#!/bin/bash
# tpm-inspect.sh -- TPM2 diagnostics for recovery environments.
#
# Usage: sudo ./tpm-inspect.sh
#
# Dumps PCR values, lists persistent objects, and checks TPM status.
# Useful when disk unlock fails after firmware or kernel updates
# because TPM PCR values no longer match the sealed policy.

set -euo pipefail

info()  { echo -e "\033[1;32m[INFO]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; }

if [ "$EUID" -ne 0 ]; then
    error "Must be run as root."
    exit 1
fi

if ! command -v tpm2_getcap &>/dev/null; then
    error "tpm2-tools not found. Install tpm2-tools first."
    exit 1
fi

# Check if TPM device exists
if [ ! -e /dev/tpm0 ] && [ ! -e /dev/tpmrm0 ]; then
    error "No TPM device found (/dev/tpm0 or /dev/tpmrm0)."
    error "The system may not have a TPM, or the module is not loaded."
    echo ""
    echo "Try: modprobe tpm_tis  (for hardware TPM)"
    echo "     modprobe tpm_crb  (for firmware TPM / fTPM)"
    exit 1
fi

echo "=== TPM2 Device Info ==="
tpm2_getcap properties-fixed 2>/dev/null | grep -E "TPM2_PT_(FAMILY|REVISION|FIRMWARE|MANUFACTURER)" || warn "Could not read TPM properties."

echo ""
echo "=== PCR Values (SHA-256, banks 0-7) ==="
echo "PCRs record measurements of firmware, bootloader, kernel, and initrd."
echo "If these changed since disk encryption was sealed, unlock will fail."
echo ""
if command -v tpm2_pcrread &>/dev/null; then
    tpm2_pcrread sha256:0,1,2,3,4,5,6,7 2>/dev/null || warn "Could not read PCRs."
else
    warn "tpm2_pcrread not available."
fi

echo ""
echo "=== PCR Bank Allocation ==="
tpm2_getcap pcrs 2>/dev/null || warn "Could not read PCR capabilities."

echo ""
echo "=== Persistent Objects ==="
echo "These are keys/objects stored in the TPM's NVRAM (e.g., sealed LUKS keys)."
echo ""
tpm2_getcap handles-persistent 2>/dev/null || warn "Could not list persistent handles."

echo ""
echo "=== NV Indexes ==="
echo "Non-volatile storage indexes (may contain sealed secrets or Secure Boot state)."
echo ""
tpm2_getcap handles-nv-index 2>/dev/null || warn "Could not list NV indexes."

echo ""
echo "=== Lockout Status ==="
tpm2_getcap properties-variable 2>/dev/null | grep -E "lockout" || warn "Could not read lockout status."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "=== Available Actions ==="
echo "  1) Dump all PCR banks (full)"
echo "  2) Read a specific NV index"
echo "  3) Check if a LUKS token references TPM2 (systemd-cryptenroll)"
echo "  4) Reset TPM lockout counter (requires lockout auth)"
echo "  5) Audit TPM-sealed boot (diagnose unlock failures)"
echo "  6) Exit"
echo ""

while true; do
    read -rp "Select action [1-6]: " ACTION
    case "$ACTION" in
        1)
            echo ""
            tpm2_pcrread 2>/dev/null || warn "Could not read PCRs."
            ;;
        2)
            read -rp "NV index (hex, e.g. 0x01800001): " NV_IDX
            echo ""
            tpm2_nvread "$NV_IDX" 2>/dev/null | xxd || warn "Could not read NV index $NV_IDX."
            ;;
        3)
            echo ""
            echo "Checking LUKS headers for TPM2 tokens..."
            for dev in $(lsblk -rno NAME,FSTYPE | awk '$2 == "crypto_LUKS" {print "/dev/"$1}'); do
                echo "  Device: $dev"
                if command -v cryptsetup &>/dev/null; then
                    cryptsetup luksDump "$dev" 2>/dev/null | grep -A5 "systemd-tpm2" && info "  Found systemd-tpm2 token on $dev" || echo "    No systemd-tpm2 token found."
                else
                    warn "  cryptsetup not available."
                fi
            done
            ;;
        4)
            warn "This resets the TPM lockout counter. You need the lockout auth password."
            read -rp "Proceed? [y/N]: " CONFIRM
            if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
                tpm2_dictionarylockout --setup-parameters --max-tries=32 --recovery-time=600 --lockout-recovery-time=86400 2>/dev/null \
                    && info "Lockout parameters reset." \
                    || error "Failed. You may need to provide --lockout-auth."
            fi
            ;;
        5)
            if [ -x "$SCRIPT_DIR/tpm-seal-audit.sh" ]; then
                "$SCRIPT_DIR/tpm-seal-audit.sh"
            else
                error "tpm-seal-audit.sh not found in $SCRIPT_DIR"
            fi
            ;;
        6)
            exit 0
            ;;
        *)
            warn "Invalid selection."
            ;;
    esac
    echo ""
done
