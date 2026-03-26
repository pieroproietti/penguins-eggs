#!/bin/bash
# uefi-repair.sh -- Check and repair UEFI boot entries.
#
# Usage: sudo ./uefi-repair.sh
#
# Displays current UEFI boot entries, checks EFI partition status,
# and allows creating/reordering boot entries.
# Derived from rescapp's UEFI plugins.

set -euo pipefail

info()  { echo -e "\033[1;32m[INFO]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; }

if [ "$EUID" -ne 0 ]; then
    error "Must be run as root."
    exit 1
fi

if [ ! -d /sys/firmware/efi ]; then
    error "System did not boot in UEFI mode. Cannot manage UEFI entries."
    exit 1
fi

if ! command -v efibootmgr &>/dev/null; then
    error "efibootmgr not found. Install it first."
    exit 1
fi

echo "=== UEFI Boot Entries ==="
efibootmgr -v

echo ""
echo "=== EFI System Partitions ==="
lsblk -o NAME,SIZE,FSTYPE,PARTTYPE,MOUNTPOINT | grep -i "c12a7328\|vfat" || echo "  (none detected)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "=== Available Actions ==="
echo "  1) Show current boot order"
echo "  2) Create new boot entry from EFI file"
echo "  3) Change boot order"
echo "  4) Secure Boot key management"
echo "  5) TPM2 diagnostics"
echo "  6) Exit"
echo ""

while true; do
    read -rp "Select action [1-6]: " ACTION
    case "$ACTION" in
        1)
            efibootmgr
            ;;
        2)
            read -rp "EFI partition (e.g. /dev/sda1): " EFI_PART
            read -rp "EFI file path (e.g. \\EFI\\ubuntu\\shimx64.efi): " EFI_FILE
            read -rp "Label for boot entry: " LABEL
            DISK=$(echo "$EFI_PART" | sed 's/[0-9]*$//')
            PARTNUM=$(echo "$EFI_PART" | grep -o '[0-9]*$')
            efibootmgr -c -d "$DISK" -p "$PARTNUM" -l "$EFI_FILE" -L "$LABEL"
            info "Boot entry created."
            ;;
        3)
            read -rp "Enter new boot order (comma-separated, e.g. 0001,0002,0003): " ORDER
            efibootmgr -o "$ORDER"
            info "Boot order updated."
            ;;
        4)
            if [ -x "$SCRIPT_DIR/secureboot-manage.sh" ]; then
                "$SCRIPT_DIR/secureboot-manage.sh"
            else
                error "secureboot-manage.sh not found in $SCRIPT_DIR"
            fi
            ;;
        5)
            if [ -x "$SCRIPT_DIR/tpm-inspect.sh" ]; then
                "$SCRIPT_DIR/tpm-inspect.sh"
            else
                error "tpm-inspect.sh not found in $SCRIPT_DIR"
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
