#!/bin/bash
# install-tools.sh -- Install recovery packages into an Arch-family rootfs.
#
# Usage: sourced by adapter.sh (not run directly)
#   Requires: ROOTFS, RECOVERY_ROOT, FAMILY to be set.
#   Chroot bind mounts must already be in place.

set -euo pipefail

ROOTFS="${ROOTFS:?ROOTFS must be set}"
RECOVERY_ROOT="${RECOVERY_ROOT:?RECOVERY_ROOT must be set}"
FAMILY="${FAMILY:?FAMILY must be set}"

info()  { echo -e "\033[1;32m[arch]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[arch]\033[0m $*"; }

# Parse tool lists for arch packages
source "$(dirname "${BASH_SOURCE[0]}")/../common/parse-tool-lists.sh"

# Arch-specific extras
EXTRA_PACKAGES="bash-completion less man-db sudo"

if [ "${WITH_RESCAPP:-false}" = "true" ]; then
    EXTRA_PACKAGES="$EXTRA_PACKAGES python python-pyqt5 python-pyqt5-webengine python-dbus kdialog"
fi

ALL_PACKAGES="$PACKAGES $EXTRA_PACKAGES"

# Initialize pacman keyring if needed
if [ ! -d "$ROOTFS/etc/pacman.d/gnupg" ]; then
    info "Initializing pacman keyring"
    chroot "$ROOTFS" pacman-key --init
    chroot "$ROOTFS" pacman-key --populate archlinux
fi

info "Updating package database"
chroot "$ROOTFS" pacman -Sy --noconfirm 2>&1 | tail -5

info "Installing recovery packages:"
info "  $ALL_PACKAGES"

chroot "$ROOTFS" pacman -S --noconfirm --needed $ALL_PACKAGES 2>&1 | \
    grep -E "^(installing|upgrading|warning)" || true

# Clean cache
info "Cleaning package cache"
chroot "$ROOTFS" pacman -Scc --noconfirm 2>/dev/null || true

info "Arch package installation complete."
