#!/bin/bash
# install-tools.sh -- Install recovery packages into an openSUSE/SLES rootfs.
#
# Usage: sourced by adapter.sh (not run directly)
#   Requires: ROOTFS, RECOVERY_ROOT, FAMILY to be set.
#   Chroot bind mounts must already be in place.

set -euo pipefail

ROOTFS="${ROOTFS:?ROOTFS must be set}"
RECOVERY_ROOT="${RECOVERY_ROOT:?RECOVERY_ROOT must be set}"
FAMILY="${FAMILY:?FAMILY must be set}"

info()  { echo -e "\033[1;32m[suse]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[suse]\033[0m $*"; }

# Parse tool lists for suse packages
source "$(dirname "${BASH_SOURCE[0]}")/../common/parse-tool-lists.sh"

# SUSE-specific extras
EXTRA_PACKAGES="bash-completion less man sudo"

if [ "${WITH_RESCAPP:-false}" = "true" ]; then
    EXTRA_PACKAGES="$EXTRA_PACKAGES python3 python3-qt5 python3-dbus-python kdialog"
fi

ALL_PACKAGES="$PACKAGES $EXTRA_PACKAGES"

info "Refreshing zypper repositories"
chroot "$ROOTFS" zypper --non-interactive refresh 2>&1 | tail -3

info "Installing recovery packages:"
info "  $ALL_PACKAGES"

chroot "$ROOTFS" zypper --non-interactive install --no-recommends $ALL_PACKAGES 2>&1 | \
    grep -E "^(Installing|Upgrading|Problem)" || true

# Clean cache
info "Cleaning zypper cache"
chroot "$ROOTFS" zypper clean --all

info "SUSE package installation complete."
