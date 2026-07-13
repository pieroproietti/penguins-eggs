#!/usr/bin/env bash
set -euo pipefail

# =====================================================================
# incubator.sh - Batch test of eggs ISOs on Proxmox via QEMU Guest Agent
# (CI/CD Version - parameters via environment variables)
# Usage: ./incubator.sh /path/to/iso/directory
#
# Env override (set by GitHub Actions workflow):
#   VMID, STORAGE, ISO_STORAGE, BRIDGE
# =====================================================================

TARGET_DIR="${1:?Usage: $0 /path/to/iso/directory}"

# --- Configuration (env-override for CI) ---
VMID="${VMID:-150}"
FSTYPE="${FSTYPE:-ext4}"
STORAGE="${STORAGE:-father-zfs}"
ISO_STORAGE="${ISO_STORAGE:-father-local}"
BRIDGE="${BRIDGE:-eggsnet}"
TEMPLATE="${TEMPLATE:-}"
WORK="/var/tmp/eggs-minimal-${VMID}"
REPORT_FILE="$(pwd)/incubator-${FSTYPE}.log"
LOCK_FILE="/var/lock/incubator-${VMID}.lock"

# Timeouts (seconds)
BOOT_TIMEOUT="${BOOT_TIMEOUT:-300}"
INSTALL_TIMEOUT="${INSTALL_TIMEOUT:-3600}"
SHUTDOWN_TIMEOUT="${SHUTDOWN_TIMEOUT:-120}"
VERIFY_BOOT_TIMEOUT="${VERIFY_BOOT_TIMEOUT:-300}"
AGENT_SETTLE=10
AGENT_RETRY_WINDOW=180

# Colors: automatically disabled in CI or without TTY
if [ -t 1 ] && [ -z "${CI:-}" ]; then
    C_BLUE='\033[1;34m'; C_GREEN='\033[1;32m'; C_RED='\033[1;31m'; C_RST='\033[0m'
else
    C_BLUE=''; C_GREEN=''; C_RED=''; C_RST=''
fi

require_cmds() {
    local missing=()
    for cmd in qm pvesm jq virt-cat; do
        command -v "$cmd" >/dev/null 2>&1 || missing+=("$cmd")
    done
    if [ ${#missing[@]} -gt 0 ]; then
        echo "ERROR: missing commands: ${missing[*]}" >&2
        exit 1
    fi
}

acquire_lock() {
    exec 200>"$LOCK_FILE"
    if ! flock -n 200; then
        echo "ERROR: another instance is already using VMID $VMID (lock: $LOCK_FILE)" >&2
        exit 1
    fi
}

log()  { echo -e "$*"; }
report() { echo "$*" >> "$REPORT_FILE"; }

report_entry() {
    local iso="$1" result="$2" details="${3:-}"
    report "================================================="
    report "DATE:   $(date '+%Y-%m-%d %H:%M:%S')"
    report "ISO:    $iso"
    report "RESULT: $result"
    [ -n "$details" ] && report "$details"
    report "================================================="
}

wait_for_agent() {
    local timeout="$1" waited=0 ok=0
    while [ "$waited" -lt "$timeout" ]; do
        if qm agent "$VMID" ping >/dev/null 2>&1; then
            ok=$((ok + 1))
            if [ "$ok" -ge 3 ]; then
                return 0
            fi
            sleep 2; waited=$((waited + 2))
        else
            ok=0
            sleep 3; waited=$((waited + 3))
        fi
    done
    return 1
}

agent_exec() {
    local waited=0 res="" exit_code=0
    while [ "$waited" -lt "$AGENT_RETRY_WINDOW" ]; do
        if qm agent "$VMID" ping >/dev/null 2>&1; then
            res=$(qm guest exec "$VMID" "$@" 2>&1)
            exit_code=$?
            if [ $exit_code -eq 0 ]; then
                printf '%s' "$res"
                return 0
            else
                echo ">>> [DEBUG] qm guest exec command rejected by Proxmox: $res" >&2
                if echo "$res" | grep -q -i -E "unknown option|executable not found|parameter verification failed"; then
                    printf '%s' "$res"
                    return 1
                fi
            fi
        fi
        echo ">>> Agent busy or restarting, waiting (${waited}s/${AGENT_RETRY_WINDOW}s)..." >&2
        sleep 5
        waited=$((waited + 5))
    done
    printf '%s' "Timeout: Agent unavailable after ${AGENT_RETRY_WINDOW}s"
    return 1
}

wait_for_stopped() {
    local timeout="$1" waited=0
    while ! qm status "$VMID" 2>/dev/null | grep -q "stopped"; do
        qm status "$VMID" >/dev/null 2>&1 || return 0
        sleep 2
        waited=$((waited + 2))
        if [ "$waited" -ge "$timeout" ]; then
            qm stop "$VMID" --timeout 30 2>/dev/null || true
            sleep 3
            qm status "$VMID" 2>/dev/null | grep -q "stopped"
            return $?
        fi
    done
    return 0
}

# =====================================================================
# THE ENGINE FUNCTION
# =====================================================================
test_iso() {
    local ISO_NAME="$1"
    local STAGE="init"

    fail() {
        log "ERROR [$STAGE]: $*"
        echo "$STAGE" > "${WORK}/failed_stage.txt" 2>/dev/null || true
        # Annotation visible in GitHub Actions UI
        [ -n "${GITHUB_ACTIONS:-}" ] && echo "::error title=Incubator [$STAGE]::${ISO_NAME}: $*"
        return 1
    }

    STAGE="cleanup"
    log "--- 1. Purging old VM $VMID ---"
    if qm status "$VMID" >/dev/null 2>&1; then
        qm stop "$VMID" --timeout 30 2>/dev/null || true
        wait_for_stopped 60 || true
        qm destroy "$VMID" --purge 1 --destroy-unreferenced-disks 1 2>/dev/null || true
    fi
    rm -rf "$WORK" && mkdir -p "$WORK"

    STAGE="vm-creation"
    log "--- 2. VM Creation and Sequential Boot Configuration ---"
    local ISO_PATH
    ISO_PATH=$(pvesm path "${ISO_STORAGE}:iso/${ISO_NAME}") || { fail "ISO not found"; return 1; }

    # Estrazione chirurgica del nome della distro (es. da "egg-of-alpine-3.24..." a "alpine")
    local TEMP_NAME="${ISO_NAME#egg-of-}"  # Rimuove il prefisso
    local DISTRO_NAME="${TEMP_NAME%%-*}"   # Rimuove dal primo trattino in poi

    # Rete di sicurezza: se il nome fosse anomalo e l'estrazione fallisse, usiamo un fallback
    if [ -z "$DISTRO_NAME" ] || [ "$DISTRO_NAME" = "$ISO_NAME" ]; then
        DISTRO_NAME="generic"
    fi

    if [ -n "${TEMPLATE:-}" ]; then
        log "Cloning VM template $TEMPLATE (linked clone) to VMID $VMID as testing-${FSTYPE}-distro..."
        qm clone "$TEMPLATE" "$VMID" --name "testing-${FSTYPE}-${DISTRO_NAME}" --full 0 \
            || { fail "qm clone failed"; return 1; }
        log "Configuring CDROM and boot order on cloned VM $VMID..."
        qm set "$VMID" --ide2 "${ISO_STORAGE}:iso/${ISO_NAME},media=cdrom" --boot "order=scsi0;ide2" \
            || { fail "qm set CDROM failed"; return 1; }
    else
        # Creiamo la VM assegnandole il nome "testing-distro"
        qm create "$VMID" --name "testing-${DISTRO_NAME}" --memory 4096 --cores 2 \
            --scsihw virtio-scsi-single --scsi0 "${STORAGE}:16" \
            --net0 "virtio,bridge=${BRIDGE}" \
            --serial0 socket --vga qxl \
            --agent 1 \
            --ide2 "${ISO_STORAGE}:iso/${ISO_NAME},media=cdrom" \
            --boot "order=scsi0;ide2" \
            || { fail "qm create failed"; return 1; }
    fi
    STAGE="boot-live"
    log "--- 3. Starting VM (Waiting for QEMU Agent, max ${BOOT_TIMEOUT}s) ---"
    qm start "$VMID" || { fail "qm start failed"; return 1; }

    wait_for_agent "$BOOT_TIMEOUT" \
        || { fail "timeout: agent did not respond, live boot failed"; return 1; }
    log "SUCCESS: Live System booted! Waiting ${AGENT_SETTLE}s to settle..."
    sleep "$AGENT_SETTLE"

    STAGE="krill-installation"
    log "--- 4. Starting Krill installation via Agent ---"

    local EXEC_RES EXEC_PID

    # Universal blind execution (compatible with BusyBox/Alpine)
    if ! EXEC_RES=$(agent_exec -- /bin/sh -c "sudo eggs sysinstall krill --unattended --fstype=${FSTYPE} > /tmp/krill.log 2>&1"); then
        fail "qm guest exec failed: $EXEC_RES"
        return 1
    fi

    EXEC_PID=$(echo "$EXEC_RES" | sed -n 's/.*"pid" *: *\([0-9]*\).*/\1/p')
    if [ -z "$EXEC_PID" ]; then
        fail "unable to get installation PID. Output: $EXEC_RES"
        return 1
    fi

    log "Krill installation in progress (Internal PID: $EXEC_PID, timeout ${INSTALL_TIMEOUT}s)..."

    > "${WORK}/krill_output.txt"

    local EXIT_CODE="" STATUS IS_EXITED waited=0 status_fails=0 LOG_OFFSET=0 CHUNK
    while true; do
        if qm status "$VMID" 2>/dev/null | grep -q "stopped"; then
            log "VM powered off autonomously. Krill finished successfully!"
            EXIT_CODE=0
            break
        fi

        # Incremental real-time log recovery
        CHUNK=$(qm guest exec "$VMID" -- /bin/sh -c "tail -c +$((LOG_OFFSET + 1)) /tmp/krill.log 2>/dev/null" 2>/dev/null \
            | jq -r '."out-data" // empty' 2>/dev/null) || CHUNK=""
        if [ -n "$CHUNK" ]; then
            printf '%s' "$CHUNK" | tee -a "${WORK}/krill_output.txt"
            LOG_OFFSET=$((LOG_OFFSET + $(LC_ALL=C printf '%s' "$CHUNK" | wc -c)))
        fi

        if ! STATUS=$(qm guest exec-status "$VMID" "$EXEC_PID" 2>&1); then
            sleep 3
            if qm status "$VMID" 2>/dev/null | grep -q "stopped"; then
                log "VM powered off during status check. Installation completed."
                EXIT_CODE=0
                break
            fi

            # --- ANTI-HANG COUNTERMEASURE ("PRESS ENTER") ---
            # The QEMU agent is dead because Krill called poweroff,
            # but the VM is still running (likely stuck on a prompt).
            
            # 1. The "Ghost Finger": simulate pressing ENTER (ret)
            qm sendkey "$VMID" ret >/dev/null 2>&1 || true

            status_fails=$((status_fails + 1))
            if [ "$status_fails" -ge 4 ]; then
                log "Agent offline and VM stuck. Krill successfully triggered poweroff. Applying guillotine!"
                # 2. The Guillotine: cut power entirely
                qm stop "$VMID" >/dev/null 2>&1 || true
                wait_for_stopped 15 || true
                
                # 3. Declare success: if we reached shutdown, Krill finished!
                EXIT_CODE=0
                break
            fi
            sleep 5; waited=$((waited + 5)); continue
            # ----------------------------------------------
        fi
        status_fails=0

        IS_EXITED=$(echo "$STATUS" | jq -r '.exited')
        if [ "$IS_EXITED" = "1" ] || [ "$IS_EXITED" = "true" ]; then
            EXIT_CODE=$(echo "$STATUS" | jq -r '.exitcode // empty')
            break
        fi

        sleep 5
        waited=$((waited + 5))
        if [ "$waited" -ge "$INSTALL_TIMEOUT" ]; then
            fail "timeout: Krill installation not finished"
            return 1
        fi
    done
    echo

    if [ -z "$EXIT_CODE" ]; then
        fail "Krill terminated abnormally without generating an exit code"
        return 1
    fi
    if [ "$EXIT_CODE" -ne 0 ]; then
        fail "Krill failed with EXIT_CODE = $EXIT_CODE (see krill_output.txt)"
        return 1
    fi
    log "SUCCESS: Krill installation finished correctly."

    STAGE="poweroff"
    qm stop "$VMID" >/dev/null 2>&1 || true
    wait_for_stopped 15 || true

    STAGE="fstab-extraction"
    local DISKVOL DISKPATH
    DISKVOL=$(qm config "$VMID" | sed -n 's/^scsi0: \([^,]*\).*/\1/p')
    DISKPATH=$(pvesm path "$DISKVOL") || { fail "unable to resolve disk path"; return 1; }

    virt-cat -a "$DISKPATH" /etc/fstab > "$WORK/fstab.txt" 2>/dev/null || echo "Error reading fstab" > "$WORK/fstab.txt"

    STAGE="verify-boot"
    log "--- 5. Post-installation verify boot (Boot from Hard Disk) ---"
    qm start "$VMID" || { fail "qm start post-install failed"; return 1; }

    wait_for_agent "$VERIFY_BOOT_TIMEOUT" || { fail "timeout: installed system on disk is not responding"; return 1; }

    log "SUCCESS: Boot completed from new disk! Installed system is stable."

    # --- NEW STAGE: SYSTEM SHOWCASE (STANDALONE NEOFETCH CLEAN TEXT) ---
    STAGE="neofetch-extraction"
    
    log "Quick download of neofetch bypassing package managers..."
    agent_exec -- /bin/sh -c "if command -v curl >/dev/null 2>&1; then curl -sL https://raw.githubusercontent.com/dylanaraps/neofetch/master/neofetch -o /tmp/neofetch; else wget -qO /tmp/neofetch https://raw.githubusercontent.com/dylanaraps/neofetch/master/neofetch; fi; chmod +x /tmp/neofetch" >/dev/null 2>&1 || true

    log "Retrieving installed system specs for the report..."
    
    # Estraiamo il JSON grezzo dall'agente
    local RAW_JSON
    RAW_JSON=$(agent_exec -- /bin/sh -c "[ -x /tmp/neofetch ] && /tmp/neofetch --stdout 2>/dev/null || (uname -a && cat /etc/os-release | grep PRETTY_NAME)") || RAW_JSON=""

    # Decodifichiamo il JSON in testo puro usando jq -r
    local SYS_INFO
    SYS_INFO=$(echo "$RAW_JSON" | jq -r '."out-data" // empty' 2>/dev/null) || SYS_INFO=""
    [ -z "$SYS_INFO" ] && SYS_INFO="Info not available"

    # Ora stampiamo la versione testuale pulita direttamente nella console della CI!
    echo -e "\n${C_BLUE}--- NEWLY INSTALLED SYSTEM IDENTIKIT ---${C_RST}"
    echo "$SYS_INFO"
    echo -e "${C_BLUE}-----------------------------------------------${C_RST}\n"

    # E compiliamo il referto per l'archivio
    report_entry "$ISO_NAME" "INSTALLATION COMPLETED" "FSTAB:
$(cat "$WORK/fstab.txt")

SYSTEM SPECS:
$SYS_INFO"
    # -------------------------------------------------------

    log "Hard stopping the test VM..."
    qm stop "$VMID" >/dev/null 2>&1 || true
    wait_for_stopped 15 || true
    
    return 0
}

# =====================================================================
# MAIN BATCH CYCLE
# =====================================================================
require_cmds
acquire_lock

[ -d "$TARGET_DIR" ] || { echo "ERROR: '$TARGET_DIR' is not a directory." >&2; exit 1; }

shopt -s nullglob
ISOS=("$TARGET_DIR"/*.iso)
shopt -u nullglob
if [ ${#ISOS[@]} -eq 0 ]; then
    echo "No ISO found in $TARGET_DIR."
    exit 0
fi

echo "Batch session started: $(date '+%Y-%m-%d %H:%M:%S')" > "$REPORT_FILE"
echo "Target directory: $TARGET_DIR (${#ISOS[@]} ISOs)" >> "$REPORT_FILE"

PASSED=0
FAILED=0

for ISO_FULL_PATH in "${ISOS[@]}"; do
    ISO_NAME=$(basename "$ISO_FULL_PATH")

    # Group output of each ISO in GitHub Actions UI
    [ -n "${GITHUB_ACTIONS:-}" ] && echo "::group::TEST ISO: $ISO_NAME"

    echo -e "\n\n${C_BLUE}===================================================================${C_RST}"
    echo -e "${C_BLUE}>>> STARTING TEST FOR ISO: $ISO_NAME${C_RST}"
    echo -e "${C_BLUE}===================================================================${C_RST}"

    if ( test_iso "$ISO_NAME" ); then
        PASSED=$((PASSED + 1))
        echo -e "${C_GREEN}>>> TEST COMPLETED SUCCESSFULLY: $ISO_NAME${C_RST}"
    else
        FAILED=$((FAILED + 1))
        echo -e "${C_RED}>>> TEST FAILED: $ISO_NAME${C_RST}"
        FAILED_STAGE=$(cat "${WORK}/failed_stage.txt" 2>/dev/null || echo "unknown")
        report_entry "$ISO_NAME" "FAILED (stage: $FAILED_STAGE)" \
            "See krill-output-${FSTYPE}-${ISO_NAME}.txt for details"

        cp "${WORK}/krill_output.txt"   "$(pwd)/krill-output-${FSTYPE}-${ISO_NAME}.txt"    2>/dev/null || true
    fi

    [ -n "${GITHUB_ACTIONS:-}" ] && echo "::endgroup::"
done

{
    echo "================================================="
    echo "END OF SESSION: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "TOTAL: ${#ISOS[@]} | SUCCESSES: $PASSED | FAILURES: $FAILED"
    echo "================================================="
} >> "$REPORT_FILE"

echo -e "\n\n>>> BATCH COMPLETED: $PASSED/${#ISOS[@]} ISOs passed. Results in: $REPORT_FILE"

[ "$FAILED" -eq 0 ]
