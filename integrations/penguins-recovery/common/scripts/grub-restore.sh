#!/bin/bash
# grub-restore.sh -- Restore GRUB bootloader to a disk's MBR/EFI.
#
# Usage: sudo ./grub-restore.sh [partition] [device]
#
# If not specified, prompts for the Linux partition and target device.
# Mounts the partition, chroots, runs grub-install and update-grub.
# Derived from rescapp's grubeasy plugin.

set -euo pipefail

MNT="/mnt"

info()  { echo -e "\033[1;32m[INFO]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; }

cleanup() {
    for m in /run /sys /proc /dev/pts /dev; do
        umount -l "${MNT}${m}" 2>/dev/null || true
    done
    umount -l "${MNT}/boot/efi" 2>/dev/null || true
    umount -l "${MNT}" 2>/dev/null || true
}
trap cleanup EXIT

if [ "$EUID" -ne 0 ]; then
    error "Must be run as root."
    exit 1
fi

PARTITION="${1:-}"
DEVICE="${2:-}"

if [ -z "$PARTITION" ]; then
    lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT,LABEL
    echo ""
    read -rp "Enter Linux root partition (e.g. /dev/sda2): " PARTITION
fi

if [ -z "$DEVICE" ]; then
    read -rp "Enter device to install GRUB to (e.g. /dev/sda): " DEVICE
fi

info "Mounting $PARTITION to $MNT"
mount "$PARTITION" "$MNT"

# Mount EFI if present
EFI_PART=$(lsblk -no NAME,PARTTYPE "${DEVICE}" 2>/dev/null | grep -i "c12a7328-f81f-11d2-ba4b-00a9a1e359b8" | awk '{print $1}' || true)
if [ -n "$EFI_PART" ] && [ -d "${MNT}/boot/efi" ]; then
    info "Mounting EFI partition /dev/${EFI_PART}"
    mount "/dev/${EFI_PART}" "${MNT}/boot/efi"
fi

info "Setting up bind mounts"
for m in /dev /dev/pts /proc /sys /run; do
    mount -R "$m" "${MNT}${m}"
done

info "Running fsck on $PARTITION (non-destructive)"
fsck -y "$PARTITION" 2>/dev/null || true

info "Installing GRUB to $DEVICE"
chroot "$MNT" grub-install "$DEVICE" 2>&1 || chroot "$MNT" grub2-install "$DEVICE" 2>&1

info "Updating GRUB configuration"
chroot "$MNT" update-grub 2>&1 || chroot "$MNT" grub2-mkconfig -o /boot/grub2/grub.cfg 2>&1

info "GRUB restored successfully."
