#!/bin/bash
# install-tools.sh -- Install recovery packages into a Fedora/RHEL-family rootfs.
#
# Usage: sourced by adapter.sh (not run directly)
#   Requires: ROOTFS, RECOVERY_ROOT, FAMILY to be set.
#   Chroot bind mounts must already be in place.

set -euo pipefail

ROOTFS="${ROOTFS:?ROOTFS must be set}"
RECOVERY_ROOT="${RECOVERY_ROOT:?RECOVERY_ROOT must be set}"
FAMILY="${FAMILY:?FAMILY must be set}"

info()  { echo -e "\033[1;32m[fedora]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[fedora]\033[0m $*"; }

# Parse tool lists for fedora packages
source "$(dirname "${BASH_SOURCE[0]}")/../common/parse-tool-lists.sh"

# Fedora-specific extras
EXTRA_PACKAGES="bash-completion less man-db sudo"

if [ "${WITH_RESCAPP:-false}" = "true" ]; then
    EXTRA_PACKAGES="$EXTRA_PACKAGES python3 python3-qt5 python3-qt5-webkit python3-dbus kdialog"
fi

ALL_PACKAGES="$PACKAGES $EXTRA_PACKAGES"

# Detect package manager (dnf5 on newer Fedora, dnf on older, yum on RHEL 7)
PKG_MGR="dnf"
if chroot "$ROOTFS" command -v dnf5 &>/dev/null; then
    PKG_MGR="dnf5"
elif ! chroot "$ROOTFS" command -v dnf &>/dev/null; then
    if chroot "$ROOTFS" command -v yum &>/dev/null; then
        PKG_MGR="yum"
    fi
fi

info "Using package manager: $PKG_MGR"
info "Installing recovery packages:"
info "  $ALL_PACKAGES"

chroot "$ROOTFS" $PKG_MGR install -y $ALL_PACKAGES 2>&1 | \
    grep -E "^(Installing|Upgrading|Error)" || true

# Clean cache
info "Cleaning package cache"
chroot "$ROOTFS" $PKG_MGR clean all

info "Fedora/RHEL package installation complete."
