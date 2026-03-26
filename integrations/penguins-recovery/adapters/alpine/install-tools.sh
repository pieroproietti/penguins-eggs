#!/bin/bash
# install-tools.sh -- Install recovery packages into an Alpine Linux rootfs.
#
# Usage: sourced by adapter.sh (not run directly)
#   Requires: ROOTFS, RECOVERY_ROOT, FAMILY to be set.
#   Chroot bind mounts must already be in place.

set -euo pipefail

ROOTFS="${ROOTFS:?ROOTFS must be set}"
RECOVERY_ROOT="${RECOVERY_ROOT:?RECOVERY_ROOT must be set}"
FAMILY="${FAMILY:?FAMILY must be set}"

info()  { echo -e "\033[1;32m[alpine]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[alpine]\033[0m $*"; }

# Parse tool lists for alpine packages
source "$(dirname "${BASH_SOURCE[0]}")/../common/parse-tool-lists.sh"

# Alpine-specific extras
EXTRA_PACKAGES="bash bash-completion less man-db sudo"

if [ "${WITH_RESCAPP:-false}" = "true" ]; then
    EXTRA_PACKAGES="$EXTRA_PACKAGES python3 py3-pyqt5 py3-dbus kdialog"
fi

ALL_PACKAGES="$PACKAGES $EXTRA_PACKAGES"

info "Updating apk index"
chroot "$ROOTFS" apk update 2>&1 | tail -3

info "Installing recovery packages:"
info "  $ALL_PACKAGES"

chroot "$ROOTFS" apk add --no-cache $ALL_PACKAGES 2>&1 | \
    grep -E "^(\(|Installing|ERROR)" || true

info "Alpine package installation complete."
