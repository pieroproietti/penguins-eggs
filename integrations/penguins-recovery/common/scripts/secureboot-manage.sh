#!/bin/bash
# secureboot-manage.sh -- Inspect and manage UEFI Secure Boot state.
#
# Usage: sudo ./secureboot-manage.sh
#
# Checks Secure Boot status, lists enrolled keys (PK/KEK/db/dbx/MOK),
# verifies EFI binary signatures, and provides key management actions
# using sbctl, mokutil, and efitools.

set -euo pipefail

info()  { echo -e "\033[1;32m[INFO]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; }

if [ "$EUID" -ne 0 ]; then
    error "Must be run as root."
    exit 1
fi

if [ ! -d /sys/firmware/efi ]; then
    error "System did not boot in UEFI mode."
    exit 1
fi

# --- Helper: check tool availability ---
has() { command -v "$1" &>/dev/null; }

show_sb_status() {
    echo "=== Secure Boot Status ==="
    if has mokutil; then
        mokutil --sb-state 2>/dev/null || echo "  Could not determine Secure Boot state."
    elif [ -f /sys/firmware/efi/efivars/SecureBoot-8be4df61-93ca-11d2-aa0d-00e098032b8c ]; then
        local val
        val=$(od -An -t u1 -j4 -N1 /sys/firmware/efi/efivars/SecureBoot-8be4df61-93ca-11d2-aa0d-00e098032b8c 2>/dev/null | tr -d ' ')
        if [ "$val" = "1" ]; then
            info "Secure Boot is ENABLED."
        else
            info "Secure Boot is DISABLED."
        fi
    else
        warn "Cannot determine Secure Boot state."
    fi

    echo ""
    if has mokutil; then
        echo "=== Setup Mode ==="
        mokutil --sb-state 2>/dev/null | grep -i "setup" || echo "  Not in setup mode."
    fi
}

show_enrolled_keys() {
    echo ""
    echo "=== Enrolled Keys ==="

    if has sbctl; then
        echo "--- sbctl status ---"
        sbctl status 2>/dev/null || warn "sbctl status failed."
        echo ""
    fi

    if has mokutil; then
        echo "--- Platform Key (PK) ---"
        mokutil --pk 2>/dev/null | head -20 || echo "  Could not read PK."
        echo ""
        echo "--- Key Exchange Keys (KEK) ---"
        mokutil --kek 2>/dev/null | head -30 || echo "  Could not read KEK."
        echo ""
        echo "--- Signature Database (db) ---"
        mokutil --db 2>/dev/null | head -30 || echo "  Could not read db."
        echo ""
        echo "--- Forbidden Signatures (dbx) ---"
        mokutil --dbx 2>/dev/null | head -20 || echo "  Could not read dbx."
        echo ""
        echo "--- Machine Owner Keys (MOK) ---"
        mokutil --list-enrolled 2>/dev/null | head -30 || echo "  No MOKs enrolled (or mokutil unavailable)."
    else
        warn "mokutil not found. Install it for key inspection."
    fi
}

verify_efi_binary() {
    read -rp "Path to EFI binary (e.g. /boot/efi/EFI/ubuntu/shimx64.efi): " EFI_PATH
    if [ ! -f "$EFI_PATH" ]; then
        error "File not found: $EFI_PATH"
        return
    fi

    echo ""
    if has sbverify; then
        echo "--- sbverify ---"
        sbverify --list "$EFI_PATH" 2>/dev/null || echo "  No signatures found or sbverify failed."
    elif has sbctl; then
        echo "--- sbctl verify ---"
        sbctl verify "$EFI_PATH" 2>/dev/null || echo "  Verification failed or binary is unsigned."
    else
        warn "Neither sbverify nor sbctl found."
    fi

    echo ""
    if has pesign; then
        echo "--- pesign signature list ---"
        pesign -S -i "$EFI_PATH" 2>/dev/null || true
    fi
}

manage_mok() {
    if ! has mokutil; then
        error "mokutil not found."
        return
    fi

    echo ""
    echo "=== MOK Management ==="
    echo "  1) List enrolled MOKs"
    echo "  2) List pending MOK requests"
    echo "  3) Import a MOK certificate (enrolls on next reboot)"
    echo "  4) Delete a MOK (removes on next reboot)"
    echo "  5) Back"
    echo ""

    read -rp "Select [1-5]: " MOK_ACTION
    case "$MOK_ACTION" in
        1)
            mokutil --list-enrolled 2>/dev/null || echo "  No MOKs enrolled."
            ;;
        2)
            mokutil --list-new 2>/dev/null || echo "  No pending MOK requests."
            ;;
        3)
            read -rp "Path to DER certificate: " CERT_PATH
            if [ -f "$CERT_PATH" ]; then
                mokutil --import "$CERT_PATH"
                info "MOK import queued. Enroll at next reboot via MokManager."
            else
                error "File not found: $CERT_PATH"
            fi
            ;;
        4)
            read -rp "Path to DER certificate to delete: " CERT_PATH
            if [ -f "$CERT_PATH" ]; then
                mokutil --delete "$CERT_PATH"
                info "MOK deletion queued. Confirm at next reboot via MokManager."
            else
                error "File not found: $CERT_PATH"
            fi
            ;;
        5) return ;;
        *) warn "Invalid selection." ;;
    esac
}

manage_sbctl() {
    if ! has sbctl; then
        error "sbctl not found. Install it for Secure Boot key management."
        return
    fi

    echo ""
    echo "=== sbctl Key Management ==="
    echo "  1) Show sbctl status"
    echo "  2) List signed files"
    echo "  3) Verify all signed files"
    echo "  4) Sign an EFI binary"
    echo "  5) Create new Secure Boot keys (CAUTION: replaces existing)"
    echo "  6) Enroll keys into firmware (CAUTION: may brick if wrong)"
    echo "  7) Back"
    echo ""

    read -rp "Select [1-7]: " SB_ACTION
    case "$SB_ACTION" in
        1)
            sbctl status
            ;;
        2)
            sbctl list-files 2>/dev/null || echo "  No files registered."
            ;;
        3)
            sbctl verify 2>/dev/null || warn "Some files failed verification."
            ;;
        4)
            read -rp "Path to EFI binary to sign: " SIGN_PATH
            if [ -f "$SIGN_PATH" ]; then
                sbctl sign -s "$SIGN_PATH" && info "Signed: $SIGN_PATH" || error "Signing failed."
            else
                error "File not found: $SIGN_PATH"
            fi
            ;;
        5)
            warn "This creates NEW Secure Boot keys and replaces any existing sbctl keys."
            warn "Your current keys in /usr/share/secureboot/ will be overwritten."
            read -rp "Proceed? [y/N]: " CONFIRM
            if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
                sbctl create-keys && info "Keys created." || error "Key creation failed."
            fi
            ;;
        6)
            warn "This enrolls sbctl keys into UEFI firmware."
            warn "If your system requires Microsoft keys for hardware init, use --microsoft."
            echo "  1) Enroll with Microsoft keys (recommended for most hardware)"
            echo "  2) Enroll without Microsoft keys (custom keys only)"
            echo "  3) Cancel"
            read -rp "Select [1-3]: " ENROLL_OPT
            case "$ENROLL_OPT" in
                1) sbctl enroll-keys --microsoft && info "Keys enrolled (with Microsoft)." || error "Enrollment failed." ;;
                2) sbctl enroll-keys && info "Keys enrolled (custom only)." || error "Enrollment failed." ;;
                3) return ;;
                *) warn "Cancelled." ;;
            esac
            ;;
        7) return ;;
        *) warn "Invalid selection." ;;
    esac
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Main menu ---
show_sb_status
show_enrolled_keys

echo ""
echo "=== Available Actions ==="
echo "  1) Refresh Secure Boot status"
echo "  2) Verify an EFI binary signature"
echo "  3) MOK management (mokutil)"
echo "  4) Secure Boot key management (sbctl)"
echo "  5) Secure Boot key provisioning (create/enroll PK/KEK/db)"
echo "  6) Exit"
echo ""

while true; do
    read -rp "Select action [1-6]: " ACTION
    case "$ACTION" in
        1) show_sb_status; show_enrolled_keys ;;
        2) verify_efi_binary ;;
        3) manage_mok ;;
        4) manage_sbctl ;;
        5)
            if [ -x "$SCRIPT_DIR/secureboot-provision.sh" ]; then
                "$SCRIPT_DIR/secureboot-provision.sh"
            else
                error "secureboot-provision.sh not found in $SCRIPT_DIR"
            fi
            ;;
        6) exit 0 ;;
        *) warn "Invalid selection." ;;
    esac
    echo ""
done
