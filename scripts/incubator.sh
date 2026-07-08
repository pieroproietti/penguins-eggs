#!/usr/bin/env bash
set -euo pipefail

# =====================================================================
# incubator.sh - Test batch di ISO eggs su Proxmox via QEMU Guest Agent
# (Versione CI/CD - parametri via variabili d'ambiente)
# Uso: ./incubator.sh /percorso/della/directory/iso
#
# Override via env (impostati dal workflow GitHub Actions):
#   VMID, STORAGE, ISO_STORAGE, BRIDGE
# =====================================================================

TARGET_DIR="${1:?Uso: $0 /percorso/della/directory/iso}"

# --- Configurazione (env-override per la CI) ---
VMID="${VMID:-150}"
STORAGE="${STORAGE:-father-zfs}"
ISO_STORAGE="${ISO_STORAGE:-father-local}"
BRIDGE="${BRIDGE:-eggsnet}"
WORK="/var/tmp/eggs-minimal-${VMID}"
SOCK="/var/run/qemu-server/${VMID}.serial0"
REPORT_FILE="$(pwd)/incubator.log"
LOCK_FILE="/var/lock/incubator-${VMID}.lock"

# Timeout (secondi)
BOOT_TIMEOUT="${BOOT_TIMEOUT:-300}"
INSTALL_TIMEOUT="${INSTALL_TIMEOUT:-3600}"
SHUTDOWN_TIMEOUT="${SHUTDOWN_TIMEOUT:-120}"
VERIFY_BOOT_TIMEOUT="${VERIFY_BOOT_TIMEOUT:-300}"
AGENT_SETTLE=10
AGENT_RETRY_WINDOW=180

# Colori: disattivati automaticamente in CI o senza TTY
if [ -t 1 ] && [ -z "${CI:-}" ]; then
    C_BLUE='\033[1;34m'; C_GREEN='\033[1;32m'; C_RED='\033[1;31m'; C_RST='\033[0m'
else
    C_BLUE=''; C_GREEN=''; C_RED=''; C_RST=''
fi

require_cmds() {
    local missing=()
    for cmd in qm pvesm socat jq virt-cat; do
        command -v "$cmd" >/dev/null 2>&1 || missing+=("$cmd")
    done
    if [ ${#missing[@]} -gt 0 ]; then
        echo "ERRORE: comandi mancanti: ${missing[*]}" >&2
        exit 1
    fi
}

acquire_lock() {
    exec 200>"$LOCK_FILE"
    if ! flock -n 200; then
        echo "ERRORE: un'altra istanza sta già usando il VMID $VMID (lock: $LOCK_FILE)" >&2
        exit 1
    fi
}

log()  { echo -e "$*"; }
report() { echo "$*" >> "$REPORT_FILE"; }

report_entry() {
    local iso="$1" esito="$2" dettagli="${3:-}"
    report "================================================="
    report "DATA:  $(date '+%Y-%m-%d %H:%M:%S')"
    report "ISO:   $iso"
    report "ESITO: $esito"
    [ -n "$dettagli" ] && report "$dettagli"
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
                echo ">>> [DEBUG] Comando qm guest exec rifiutato da Proxmox: $res" >&2
                if echo "$res" | grep -q -i -E "unknown option|executable not found|parameter verification failed"; then
                    printf '%s' "$res"
                    return 1
                fi
            fi
        fi
        echo ">>> Agent occupato o in riavvio, attendo (${waited}s/${AGENT_RETRY_WINDOW}s)..." >&2
        sleep 5
        waited=$((waited + 5))
    done
    printf '%s' "Timeout: Agent non disponibile dopo ${AGENT_RETRY_WINDOW}s"
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
# LA FUNZIONE MOTORE
# =====================================================================
test_iso() {
    local ISO_NAME="$1"
    local CONSOLE_LOG="${WORK}/console_log.txt"
    local STAGE="init"
    SOCAT_PID=""

    cleanup() {
        local pid="${SOCAT_PID:-}"
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
            wait "$pid" 2>/dev/null || true
        fi
    }
    trap cleanup EXIT

    fail() {
        log "ERRORE [$STAGE]: $*"
        echo "$STAGE" > "${WORK}/failed_stage.txt" 2>/dev/null || true
        # Annotazione visibile nella UI di GitHub Actions
        [ -n "${GITHUB_ACTIONS:-}" ] && echo "::error title=Incubator [$STAGE]::${ISO_NAME}: $*"
        return 1
    }

    attach_console() {
        local i mode="$1"
        for i in $(seq 1 20); do
            [ -S "$SOCK" ] && break
            sleep 1
        done
        if [ -S "$SOCK" ]; then
            if [ "$mode" = ">" ]; then
                socat UNIX-CONNECT:"$SOCK" - > >(tee "$CONSOLE_LOG") 2>&1 < /dev/null &
            else
                socat UNIX-CONNECT:"$SOCK" - > >(tee -a "$CONSOLE_LOG") 2>&1 < /dev/null &
            fi
            SOCAT_PID=$!
        fi
    }

    STAGE="pulizia"
    log "--- 1. Pulizia vecchia VM $VMID ---"
    if qm status "$VMID" >/dev/null 2>&1; then
        qm stop "$VMID" --timeout 30 2>/dev/null || true
        wait_for_stopped 60 || true
        qm destroy "$VMID" --purge 1 --destroy-unreferenced-disks 1 2>/dev/null || true
    fi
    rm -rf "$WORK" && mkdir -p "$WORK"
    touch "$CONSOLE_LOG"

    STAGE="creazione-vm"
    log "--- 2. Creazione VM e Configurazione Boot Sequenziale ---"
    local ISO_PATH
    ISO_PATH=$(pvesm path "${ISO_STORAGE}:iso/${ISO_NAME}") || { fail "ISO non trovata"; return 1; }

    qm create "$VMID" --memory 4096 --cores 2 \
        --scsihw virtio-scsi-single --scsi0 "${STORAGE}:16" \
        --net0 "virtio,bridge=${BRIDGE}" \
        --serial0 socket --vga qxl \
        --agent 1 \
        --ide2 "${ISO_STORAGE}:iso/${ISO_NAME},media=cdrom" \
        --boot "order=scsi0;ide2" \
        || { fail "qm create fallito"; return 1; }

    STAGE="boot-live"
    log "--- 3. Avvio VM (Attesa QEMU Agent, max ${BOOT_TIMEOUT}s) ---"
    qm start "$VMID" || { fail "qm start fallito"; return 1; }
    attach_console ">"

    wait_for_agent "$BOOT_TIMEOUT" \
        || { fail "timeout: l'agente non ha risposto, boot live fallito"; return 1; }
    log "SUCCESSO: Sistema Live avviato! Attendo ${AGENT_SETTLE}s di stabilizzazione..."
    sleep "$AGENT_SETTLE"

    STAGE="installazione-krill"
    log "--- 4. Avvio installazione Krill via Agent ---"

    local EXEC_RES EXEC_PID

    # Esecuzione cieca universale (compatibile con BusyBox/Alpine)
    if ! EXEC_RES=$(agent_exec -- /bin/sh -c "sudo eggs sysinstall krill --unattended --fstype=ext4 > /tmp/krill.log 2>&1"); then
        fail "qm guest exec fallito: $EXEC_RES"
        return 1
    fi

    EXEC_PID=$(echo "$EXEC_RES" | sed -n 's/.*"pid" *: *\([0-9]*\).*/\1/p')
    if [ -z "$EXEC_PID" ]; then
        fail "impossibile ottenere il PID di installazione. Output: $EXEC_RES"
        return 1
    fi

    log "Installazione Krill in corso (PID interno: $EXEC_PID, timeout ${INSTALL_TIMEOUT}s)..."

    > "${WORK}/krill_output.txt"

    local EXIT_CODE="" STATUS IS_EXITED waited=0 status_fails=0 LOG_OFFSET=0 CHUNK
    while true; do
        if qm status "$VMID" 2>/dev/null | grep -q "stopped"; then
            log "La VM si è spenta autonomamente. Krill ha terminato con successo!"
            EXIT_CODE=0
            break
        fi

        # Recupero incrementale del log in tempo reale
        CHUNK=$(qm guest exec "$VMID" -- /bin/sh -c "tail -c +$((LOG_OFFSET + 1)) /tmp/krill.log 2>/dev/null" 2>/dev/null \
            | jq -r '."out-data" // empty' 2>/dev/null) || CHUNK=""
        if [ -n "$CHUNK" ]; then
            printf '%s' "$CHUNK" | tee -a "${WORK}/krill_output.txt"
            LOG_OFFSET=$((LOG_OFFSET + $(LC_ALL=C printf '%s' "$CHUNK" | wc -c)))
        fi

        if ! STATUS=$(qm guest exec-status "$VMID" "$EXEC_PID" 2>&1); then
            sleep 3
            if qm status "$VMID" 2>/dev/null | grep -q "stopped"; then
                log "La VM si è spenta durante il controllo di stato. Installazione completata."
                EXIT_CODE=0
                break
            fi

            status_fails=$((status_fails + 1))
            if [ "$status_fails" -ge 5 ]; then
                fail "exec-status fallito ripetutamente (l'agente è sparito senza spegnere la VM): $STATUS"
                return 1
            fi
            sleep 5; waited=$((waited + 5)); continue
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
            fail "timeout: installazione Krill non terminata"
            return 1
        fi
    done
    echo

    if [ -z "$EXIT_CODE" ]; then
        fail "Krill terminato in modo anomalo senza generare exit code"
        return 1
    fi
    if [ "$EXIT_CODE" -ne 0 ]; then
        fail "Krill ha fallito con EXIT_CODE = $EXIT_CODE (vedi krill_output.txt)"
        return 1
    fi
    log "SUCCESSO: Installazione Krill terminata correttamente."

    STAGE="spegnimento"
    log "Verifica spegnimento VM..."
    wait_for_stopped "$SHUTDOWN_TIMEOUT" || { fail "la VM è rimasta appesa durante lo spegnimento"; return 1; }

    cleanup
    SOCAT_PID=""

    STAGE="estrazione-fstab"
    local DISKVOL DISKPATH
    DISKVOL=$(qm config "$VMID" | sed -n 's/^scsi0: \([^,]*\).*/\1/p')
    DISKPATH=$(pvesm path "$DISKVOL") || { fail "impossibile risolvere il percorso del disco"; return 1; }

    virt-cat -a "$DISKPATH" /etc/fstab > "$WORK/fstab.txt" 2>/dev/null || echo "Errore lettura fstab" > "$WORK/fstab.txt"

    report_entry "$ISO_NAME" "INSTALLAZIONE COMPLETATA" "FSTAB:
$(cat "$WORK/fstab.txt")"

    STAGE="boot-verifica"
    log "--- 5. Boot di verifica post-installazione (Avvio da Hard Disk) ---"
    qm start "$VMID" || { fail "qm start post-install fallito"; return 1; }
    attach_console ">>"

    wait_for_agent "$VERIFY_BOOT_TIMEOUT" || { fail "timeout: il sistema installato su disco non risponde"; return 1; }

    log "SUCCESSO: Boot completato dal nuovo disco! Il sistema installato è stabile."

    agent_exec -- sudo poweroff >/dev/null 2>&1 || true
    wait_for_stopped "$SHUTDOWN_TIMEOUT" || true

    return 0
}

# =====================================================================
# CICLO BATCH PRINCIPALE
# =====================================================================
require_cmds
acquire_lock

[ -d "$TARGET_DIR" ] || { echo "ERRORE: '$TARGET_DIR' non è una directory." >&2; exit 1; }

shopt -s nullglob
ISOS=("$TARGET_DIR"/*.iso)
shopt -u nullglob
if [ ${#ISOS[@]} -eq 0 ]; then
    echo "Nessuna ISO trovata in $TARGET_DIR."
    exit 0
fi

echo "Inizio sessione batch: $(date '+%Y-%m-%d %H:%M:%S')" > "$REPORT_FILE"
echo "Directory bersaglio: $TARGET_DIR (${#ISOS[@]} ISO)" >> "$REPORT_FILE"

PASSED=0
FAILED=0

for ISO_FULL_PATH in "${ISOS[@]}"; do
    ISO_NAME=$(basename "$ISO_FULL_PATH")

    # Raggruppa l'output di ogni ISO nella UI di GitHub Actions
    [ -n "${GITHUB_ACTIONS:-}" ] && echo "::group::TEST ISO: $ISO_NAME"

    echo -e "\n\n${C_BLUE}===================================================================${C_RST}"
    echo -e "${C_BLUE}>>> INIZIO TEST PER ISO: $ISO_NAME${C_RST}"
    echo -e "${C_BLUE}===================================================================${C_RST}"

    if ( test_iso "$ISO_NAME" ); then
        PASSED=$((PASSED + 1))
        echo -e "${C_GREEN}>>> TEST COMPLETATO CON SUCCESSO: $ISO_NAME${C_RST}"
        cp "${WORK}/console_log.txt" "$(pwd)/console-SUCCESS-${ISO_NAME}.log" 2>/dev/null || true
    else
        FAILED=$((FAILED + 1))
        echo -e "${C_RED}>>> TEST FALLITO: $ISO_NAME${C_RST}"
        FAILED_STAGE=$(cat "${WORK}/failed_stage.txt" 2>/dev/null || echo "sconosciuto")
        report_entry "$ISO_NAME" "FALLITO (stadio: $FAILED_STAGE)" \
            "Vedi console-FAILED-${ISO_NAME}.log e krill-output-${ISO_NAME}.txt per i dettagli"

        cp "${WORK}/console_log.txt"    "$(pwd)/console-FAILED-${ISO_NAME}.log"  2>/dev/null || true
        cp "${WORK}/krill_output.txt"   "$(pwd)/krill-output-${ISO_NAME}.txt"    2>/dev/null || true
    fi

    [ -n "${GITHUB_ACTIONS:-}" ] && echo "::endgroup::"
done

{
    echo "================================================="
    echo "FINE SESSIONE: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "TOTALE: ${#ISOS[@]} | SUCCESSI: $PASSED | FALLIMENTI: $FAILED"
    echo "================================================="
} >> "$REPORT_FILE"

echo -e "\n\n>>> BATCH COMPLETATO: $PASSED/${#ISOS[@]} ISO superate. Risultati in: $REPORT_FILE"

[ "$FAILED" -eq 0 ]
