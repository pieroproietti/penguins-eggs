#!/bin/bash
# install-tools.sh -- Install recovery packages into a Gentoo rootfs.
#
# Usage: sourced by adapter.sh (not run directly)
#   Requires: ROOTFS, RECOVERY_ROOT, FAMILY to be set.
#   Chroot bind mounts must already be in place.
#
# Note: Gentoo uses source-based package management (emerge/portage).
# Binary packages (binpkgs) are used when available to avoid long compile times.

set -euo pipefail

ROOTFS="${ROOTFS:?ROOTFS must be set}"
RECOVERY_ROOT="${RECOVERY_ROOT:?RECOVERY_ROOT must be set}"
FAMILY="${FAMILY:?FAMILY must be set}"

info()  { echo -e "\033[1;32m[gentoo]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[gentoo]\033[0m $*"; }

# Parse tool lists for gentoo packages
source "$(dirname "${BASH_SOURCE[0]}")/../common/parse-tool-lists.sh"

# Gentoo-specific extras (use category/package format)
EXTRA_PACKAGES="app-shells/bash-completion sys-apps/less sys-apps/man-db app-admin/sudo"

if [ "${WITH_RESCAPP:-false}" = "true" ]; then
    EXTRA_PACKAGES="$EXTRA_PACKAGES dev-python/PyQt5 dev-python/dbus-python kde-apps/kdialog"
fi

ALL_PACKAGES="$PACKAGES $EXTRA_PACKAGES"

# Sync portage tree if needed
if [ ! -d "$ROOTFS/var/db/repos/gentoo" ] && [ ! -d "$ROOTFS/usr/portage" ]; then
    info "Syncing portage tree (this may take a while)"
    chroot "$ROOTFS" emerge-webrsync 2>&1 | tail -5
fi

info "Installing recovery packages:"
info "  $ALL_PACKAGES"

# Prefer binary packages (--getbinpkg) to avoid compilation
EMERGE_OPTS="--ask=n --verbose --noreplace"
if chroot "$ROOTFS" emerge --info 2>/dev/null | grep -q "FEATURES.*getbinpkg"; then
    EMERGE_OPTS="$EMERGE_OPTS --getbinpkg"
    info "Binary packages enabled"
fi

# Install each package individually to handle missing ones gracefully
for pkg in $ALL_PACKAGES; do
    info "  Installing: $pkg"
    chroot "$ROOTFS" emerge $EMERGE_OPTS "$pkg" 2>&1 | tail -3 || \
        warn "  Failed to install: $pkg (may not exist in tree)"
done

# Clean distfiles
info "Cleaning distfiles"
chroot "$ROOTFS" eclean-dist -d 2>/dev/null || true

info "Gentoo package installation complete."
