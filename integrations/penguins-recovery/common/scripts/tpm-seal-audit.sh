#!/bin/bash
# tpm-seal-audit.sh -- Audit and recover TPM-sealed boot configurations.
#
# Usage: sudo ./tpm-seal-audit.sh
#
# Inspired by osresearch/safeboot. Checks whether the current boot state
# matches what was expected when disk encryption keys were sealed to the
# TPM. Helps diagnose why automatic disk unlock failed after firmware
# updates, kernel upgrades, or bootloader changes.
#
# Requires: tpm2-tools, efibootmgr

set -euo pipefail

info()  { echo -e "\033[1;32m[INFO]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; }

if [ "$EUID" -ne 0 ]; then
    error "Must be run as root."
    exit 1
fi

if ! command -v tpm2_pcrread &>/dev/null; then
    error "tpm2-tools not found. Install tpm2-tools first."
    exit 1
fi

# --- PCR reference ---
# PCR 0: UEFI firmware code
# PCR 1: UEFI firmware configuration
# PCR 2: Option ROMs
# PCR 3: Option ROM configuration
# PCR 4: Boot manager code (bootloader)
# PCR 5: Boot manager configuration (GPT partition table)
# PCR 6: Host platform manufacturer specific
# PCR 7: Secure Boot policy (db, dbx, KEK, PK)
# PCR 8-9: Used by GRUB/systemd-boot for kernel/initrd
# PCR 11: Used by systemd-stub for UKI components
# PCR 14: Used by shim for MOK state

PCR_DESCRIPTIONS=(
    [0]="Firmware code (BIOS/UEFI update changes this)"
    [1]="Firmware config (UEFI settings changes)"
    [2]="Option ROMs (GPU, NIC firmware)"
    [3]="Option ROM config"
    [4]="Boot manager code (bootloader update changes this)"
    [5]="Boot manager config (partition table changes)"
    [6]="Host platform manufacturer"
    [7]="Secure Boot policy (key enrollment changes this)"
    [8]="Kernel command line (GRUB-measured)"
    [9]="Kernel + initrd (GRUB-measured)"
    [11]="UKI components (systemd-stub measured)"
    [14]="Shim MOK state"
)

# --- Dump current PCRs ---
echo "=== Current PCR Values (SHA-256) ==="
echo "These values represent the current boot chain measurements."
echo "If disk unlock was sealed against specific PCRs, any change"
echo "in those PCRs will prevent automatic unlock."
echo ""

tpm2_pcrread sha256:0,1,2,3,4,5,6,7,8,9,11,14 2>/dev/null || {
    error "Could not read PCRs."
    exit 1
}

# --- Check for saved PCR policy ---
echo ""
echo "=== Saved PCR Policies ==="

POLICY_FOUND="false"

# Check systemd-cryptenroll style (LUKS2 tokens)
echo "--- LUKS2 TPM2 Tokens ---"
for dev in $(lsblk -rno NAME,FSTYPE | awk '$2 == "crypto_LUKS" {print "/dev/"$1}'); do
    if command -v cryptsetup &>/dev/null; then
        TOKEN_INFO=$(cryptsetup luksDump "$dev" 2>/dev/null | grep -A20 "systemd-tpm2" || true)
        if [ -n "$TOKEN_INFO" ]; then
            POLICY_FOUND="true"
            echo "  Device: $dev"
            echo "$TOKEN_INFO" | sed 's/^/    /'

            # Extract PCR mask if visible
            PCR_MASK=$(echo "$TOKEN_INFO" | grep -i "pcr" || true)
            if [ -n "$PCR_MASK" ]; then
                echo "    PCR binding: $PCR_MASK"
            fi
            echo ""
        fi
    fi
done

# Check for Clevis/tang pins
echo "--- Clevis Pins ---"
for dev in $(lsblk -rno NAME,FSTYPE | awk '$2 == "crypto_LUKS" {print "/dev/"$1}'); do
    if command -v cryptsetup &>/dev/null; then
        CLEVIS_INFO=$(cryptsetup luksDump "$dev" 2>/dev/null | grep -A10 "clevis" || true)
        if [ -n "$CLEVIS_INFO" ]; then
            POLICY_FOUND="true"
            echo "  Device: $dev"
            echo "$CLEVIS_INFO" | sed 's/^/    /'
            echo ""
        fi
    fi
done

# Check for safeboot-style sealed files
echo "--- Sealed Key Files ---"
for candidate in \
    /boot/sealed-key.tpm2 \
    /boot/efi/sealed-key.tpm2 \
    /etc/cryptsetup-keys.d/*.tpm2 \
    /etc/tpm2-totp/* \
    ; do
    if compgen -G "$candidate" >/dev/null 2>&1; then
        POLICY_FOUND="true"
        for f in $candidate; do
            echo "  Found: $f ($(stat -c%s "$f") bytes, modified $(stat -c%y "$f" | cut -d. -f1))"
        done
    fi
done

if [ "$POLICY_FOUND" = "false" ]; then
    echo "  No TPM-sealed policies or tokens found."
fi

# --- Diagnose common issues ---
echo ""
echo "=== Diagnosis ==="

# Check if Secure Boot state changed
if [ -f /sys/firmware/efi/efivars/SecureBoot-8be4df61-93ca-11d2-aa0d-00e098032b8c ]; then
    SB_VAL=$(od -An -t u1 -j4 -N1 /sys/firmware/efi/efivars/SecureBoot-8be4df61-93ca-11d2-aa0d-00e098032b8c 2>/dev/null | tr -d ' ')
    if [ "$SB_VAL" = "1" ]; then
        info "Secure Boot: ENABLED"
    else
        warn "Secure Boot: DISABLED"
        echo "  If keys were sealed with PCR 7 while SB was enabled,"
        echo "  disabling SB changes PCR 7 and breaks the seal."
    fi
fi

# Check kernel version
echo ""
info "Running kernel: $(uname -r)"
echo "  If the kernel was updated since sealing, PCRs 4/8/9 may differ."

# Check for recent firmware updates
if [ -d /sys/firmware/efi/esrt ]; then
    echo ""
    info "EFI System Resource Table (firmware update history):"
    for entry in /sys/firmware/efi/esrt/entries/*/; do
        if [ -d "$entry" ]; then
            FW_VER=$(cat "$entry/fw_version" 2>/dev/null || echo "?")
            LAST_ATTEMPT=$(cat "$entry/last_attempt_version" 2>/dev/null || echo "?")
            echo "  Version: $FW_VER, Last attempt: $LAST_ATTEMPT"
        fi
    done
fi

# --- Actions ---
echo ""
echo "=== Available Actions ==="
echo "  1) Save current PCR values to a file (for comparison)"
echo "  2) Compare saved PCR values with current"
echo "  3) Re-seal LUKS key to current PCRs (systemd-cryptenroll)"
echo "  4) Show PCR event log (if available)"
echo "  5) Exit"
echo ""

while true; do
    read -rp "Select action [1-5]: " ACTION
    case "$ACTION" in
        1)
            SAVE_PATH="/tmp/pcr-values-$(date +%Y%m%d-%H%M%S).txt"
            tpm2_pcrread sha256 > "$SAVE_PATH" 2>/dev/null
            info "PCR values saved to $SAVE_PATH"
            ;;
        2)
            read -rp "Path to saved PCR file: " SAVED_FILE
            if [ ! -f "$SAVED_FILE" ]; then
                error "File not found: $SAVED_FILE"
                continue
            fi
            echo ""
            echo "--- Differences ---"
            CURRENT_FILE=$(mktemp)
            tpm2_pcrread sha256 > "$CURRENT_FILE" 2>/dev/null
            diff --color=auto "$SAVED_FILE" "$CURRENT_FILE" || true
            rm -f "$CURRENT_FILE"

            # Identify which PCRs changed
            echo ""
            echo "--- Changed PCRs ---"
            while IFS= read -r line; do
                if [[ "$line" =~ ^[\<\>] ]] && [[ "$line" =~ ([0-9]+)\ *: ]]; then
                    pcr_num="${BASH_REMATCH[1]}"
                    desc="${PCR_DESCRIPTIONS[$pcr_num]:-unknown}"
                    echo "  PCR $pcr_num: $desc"
                fi
            done < <(diff "$SAVED_FILE" <(tpm2_pcrread sha256 2>/dev/null) 2>/dev/null || true)
            ;;
        3)
            echo ""
            if ! command -v systemd-cryptenroll &>/dev/null; then
                error "systemd-cryptenroll not found."
                continue
            fi
            echo "This will re-seal a LUKS volume's TPM2 token to the current PCR values."
            echo "The old token will be replaced."
            echo ""
            echo "Available LUKS devices:"
            lsblk -rno NAME,FSTYPE | awk '$2 == "crypto_LUKS" {print "  /dev/"$1}'
            echo ""
            read -rp "LUKS device (e.g. /dev/nvme0n1p3): " LUKS_DEV
            if [ ! -b "$LUKS_DEV" ]; then
                error "Not a block device: $LUKS_DEV"
                continue
            fi
            read -rp "PCRs to bind (comma-separated, e.g. 0,2,4,7): " PCRS
            PCRS="${PCRS:-7}"

            warn "This will wipe the existing TPM2 token and create a new one."
            read -rp "Proceed? [y/N]: " CONFIRM
            if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
                # Remove existing TPM2 token
                systemd-cryptenroll --wipe-slot=tpm2 "$LUKS_DEV" 2>/dev/null || true
                # Enroll new token with current PCRs
                systemd-cryptenroll --tpm2-device=auto --tpm2-pcrs="$PCRS" "$LUKS_DEV" \
                    && info "Re-sealed to PCRs: $PCRS" \
                    || error "Re-sealing failed."
            fi
            ;;
        4)
            echo ""
            if [ -f /sys/kernel/security/tpm0/binary_bios_measurements ]; then
                info "PCR event log available."
                if command -v tpm2_eventlog &>/dev/null; then
                    tpm2_eventlog /sys/kernel/security/tpm0/binary_bios_measurements 2>/dev/null | head -100
                    echo "  ... (truncated, full log may be very long)"
                else
                    warn "tpm2_eventlog not available. Raw log at:"
                    echo "  /sys/kernel/security/tpm0/binary_bios_measurements"
                fi
            else
                warn "No PCR event log found at /sys/kernel/security/tpm0/binary_bios_measurements"
            fi
            ;;
        5)
            exit 0
            ;;
        *)
            warn "Invalid selection."
            ;;
    esac
    echo ""
done
