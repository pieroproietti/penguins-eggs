#!/bin/bash
# password-reset.sh -- Reset a Linux user's password from a rescue environment.
#
# Usage: sudo ./password-reset.sh [partition] [username]
#
# Mounts the target partition, chroots, and runs passwd for the specified user.
# Derived from rescapp's chpasswd plugin.

set -euo pipefail

MNT="/mnt"

info()  { echo -e "\033[1;32m[INFO]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; }

cleanup() {
    for m in /run /sys /proc /dev/pts /dev; do
        umount -l "${MNT}${m}" 2>/dev/null || true
    done
    umount -l "${MNT}" 2>/dev/null || true
}
trap cleanup EXIT

if [ "$EUID" -ne 0 ]; then
    error "Must be run as root."
    exit 1
fi

PARTITION="${1:-}"
USERNAME="${2:-}"

if [ -z "$PARTITION" ]; then
    lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT,LABEL
    echo ""
    read -rp "Enter Linux root partition (e.g. /dev/sda2): " PARTITION
fi

info "Mounting $PARTITION to $MNT"
mount "$PARTITION" "$MNT"

for m in /dev /dev/pts /proc /sys /run; do
    mount -R "$m" "${MNT}${m}"
done

# List available users if not specified
if [ -z "$USERNAME" ]; then
    info "Available users (UID >= 1000):"
    awk -F: '$3 >= 1000 && $3 < 65534 {print "  " $1}' "${MNT}/etc/passwd"
    echo ""
    read -rp "Enter username to reset password for: " USERNAME
fi

info "Resetting password for $USERNAME"
chroot "$MNT" passwd "$USERNAME"

info "Password reset complete for $USERNAME."
