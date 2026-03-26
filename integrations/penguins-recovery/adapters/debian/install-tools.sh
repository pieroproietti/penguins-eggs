#!/bin/bash
# install-tools.sh -- Install recovery packages into a Debian-family rootfs.
#
# Usage: sourced by adapter.sh (not run directly)
#   Requires: ROOTFS, RECOVERY_ROOT, FAMILY to be set.
#   Chroot bind mounts must already be in place.

set -euo pipefail

ROOTFS="${ROOTFS:?ROOTFS must be set}"
RECOVERY_ROOT="${RECOVERY_ROOT:?RECOVERY_ROOT must be set}"
FAMILY="${FAMILY:?FAMILY must be set}"

info()  { echo -e "\033[1;32m[debian]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[debian]\033[0m $*"; }

# Parse tool lists for debian packages
source "$(dirname "${BASH_SOURCE[0]}")/../common/parse-tool-lists.sh"

# Add debian-specific recovery packages not in tool lists
EXTRA_PACKAGES="bash-completion less man-db sudo"

# Add rescapp dependencies if requested
if [ "${WITH_RESCAPP:-false}" = "true" ]; then
    EXTRA_PACKAGES="$EXTRA_PACKAGES python3 python3-pyqt5 python3-pyqt5.qtwebkit python3-dbus kdialog"
fi

ALL_PACKAGES="$PACKAGES $EXTRA_PACKAGES"

info "Updating package lists in chroot"
chroot "$ROOTFS" apt-get update -qq

info "Installing recovery packages:"
info "  $ALL_PACKAGES"

# Install packages non-interactively
chroot "$ROOTFS" env DEBIAN_FRONTEND=noninteractive \
    apt-get install -y --no-install-recommends $ALL_PACKAGES 2>&1 | \
    grep -E "^(Setting up|Unpacking|E:)" || true

# Clean up apt cache to reduce image size
info "Cleaning apt cache"
chroot "$ROOTFS" apt-get clean
chroot "$ROOTFS" rm -rf /var/lib/apt/lists/*

# Sign kernels for Secure Boot if requested
if [ "${WITH_SECUREBOOT:-false}" = "true" ]; then
    info "Signing kernels for Secure Boot"
    source "$(dirname "${BASH_SOURCE[0]}")/sign-kernel.sh"
fi

info "Debian package installation complete."
