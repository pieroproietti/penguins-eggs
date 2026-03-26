#!/bin/bash
# chroot-rescue.sh -- Mount and chroot into an installed Linux system.
#
# Usage: sudo ./chroot-rescue.sh [root-partition] [efi-partition]
#
# If partitions are not specified, the script attempts auto-detection
# via lsblk. Supports LUKS-encrypted root partitions.

set -euo pipefail

RED='\033[1;31m'
GRN='\033[1;32m'
YEL='\033[1;33m'
RST='\033[0m'

MNT="/mnt"

info()  { echo -e "${GRN}[INFO]${RST} $*"; }
warn()  { echo -e "${YEL}[WARN]${RST} $*"; }
error() { echo -e "${RED}[ERROR]${RST} $*" >&2; }

cleanup() {
    info "Unmounting bind mounts..."
    for m in /run /sys /proc /dev/pts /dev; do
        umount -l "${MNT}${m}" 2>/dev/null || true
    done
    umount -l "${MNT}/boot/efi" 2>/dev/null || true
    umount -l "${MNT}" 2>/dev/null || true
    [ -n "${LUKS_NAME:-}" ] && cryptsetup luksClose "$LUKS_NAME" 2>/dev/null || true
}

trap cleanup EXIT

if [ "$EUID" -ne 0 ]; then
    error "Must be run as root."
    exit 1
fi

ROOT_PART="${1:-}"
EFI_PART="${2:-}"
LUKS_NAME=""

# Auto-detect if not provided
if [ -z "$ROOT_PART" ]; then
    info "No root partition specified. Listing available partitions:"
    lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT,LABEL
    echo ""
    read -rp "Enter root partition (e.g. /dev/sda3 or /dev/nvme0n1p3): " ROOT_PART
fi

if [ -z "$EFI_PART" ]; then
    read -rp "Enter EFI partition (e.g. /dev/sda1 or /dev/nvme0n1p1): " EFI_PART
fi

# Handle LUKS encryption
FSTYPE=$(blkid -o value -s TYPE "$ROOT_PART" 2>/dev/null || echo "")
if [ "$FSTYPE" = "crypto_LUKS" ]; then
    LUKS_NAME="cryptdata"
    info "Detected LUKS encryption. Unlocking..."
    cryptsetup luksOpen "$ROOT_PART" "$LUKS_NAME"

    # Scan for LVM
    lvscan
    vgchange -ay

    # Find the root logical volume
    LV_ROOT=$(lvs --noheadings -o lv_path 2>/dev/null | grep -i root | head -1 | tr -d ' ')
    if [ -z "$LV_ROOT" ]; then
        error "Could not find root logical volume. Check 'lvs' output."
        exit 1
    fi
    info "Mounting $LV_ROOT"
    mount "$LV_ROOT" "$MNT"
else
    info "Mounting $ROOT_PART"
    mount "$ROOT_PART" "$MNT"
fi

# Mount EFI
if [ -d "${MNT}/boot/efi" ]; then
    info "Mounting EFI partition $EFI_PART"
    mount "$EFI_PART" "${MNT}/boot/efi"
else
    warn "No /boot/efi directory found in target. Skipping EFI mount."
fi

# Bind mounts
info "Setting up bind mounts..."
for m in /dev /dev/pts /proc /sys /run; do
    mount -R "$m" "${MNT}${m}"
done

info "Entering chroot. Type 'exit' when done."
chroot "$MNT" /bin/bash

info "Exited chroot. Cleaning up..."
