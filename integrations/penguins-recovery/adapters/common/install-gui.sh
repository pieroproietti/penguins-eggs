#!/bin/bash
# install-gui.sh -- Install a GUI profile into the rootfs.
#
# Usage: sourced by adapter.sh
#   Requires: ROOTFS, RECOVERY_ROOT, GUI_PROFILE, FAMILY to be set.
#   Chroot bind mounts must be re-established before calling this.

set -euo pipefail

ROOTFS="${ROOTFS:?ROOTFS must be set}"
RECOVERY_ROOT="${RECOVERY_ROOT:?RECOVERY_ROOT must be set}"
GUI_PROFILE="${GUI_PROFILE:?GUI_PROFILE must be set}"
FAMILY="${FAMILY:?FAMILY must be set}"

info()  { echo -e "\033[1;32m[gui]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[gui]\033[0m $*"; }
error() { echo -e "\033[1;31m[gui]\033[0m $*" >&2; }

PROFILE_DIR="${RECOVERY_ROOT}/gui/profiles/${GUI_PROFILE}"
PROFILE_JSON=$(find "$PROFILE_DIR" -name "*.json" | head -1)

if [ ! -f "$PROFILE_JSON" ]; then
    error "No profile configuration found for: $GUI_PROFILE"
    error "Expected JSON in: $PROFILE_DIR"
    exit 1
fi

info "Using profile: $PROFILE_JSON"

# Extract package list for this distro family from the profile JSON
# Uses python3 or jq if available, falls back to grep
extract_packages() {
    local json_file="$1"
    local family="$2"

    if command -v python3 &>/dev/null; then
        python3 -c "
import json, sys
with open('$json_file') as f:
    data = json.load(f)
pkgs = data.get('packages', {}).get('$family', [])
print(' '.join(pkgs))
"
    elif command -v jq &>/dev/null; then
        jq -r ".packages.${family} // [] | .[]" "$json_file" | tr '\n' ' '
    else
        warn "Neither python3 nor jq available. Skipping profile package installation."
        echo ""
    fi
}

GUI_PACKAGES=$(extract_packages "$PROFILE_JSON" "$FAMILY")

if [ -n "$GUI_PACKAGES" ]; then
    info "Installing GUI packages for $FAMILY: $GUI_PACKAGES"

    # Re-establish chroot bind mounts
    for m in /dev /dev/pts /proc /sys /run; do
        mount --bind "$m" "${ROOTFS}${m}" 2>/dev/null || true
    done
    cp -L /etc/resolv.conf "${ROOTFS}/etc/resolv.conf" 2>/dev/null || true

    # Install using the appropriate package manager
    case "$FAMILY" in
        debian)
            chroot "$ROOTFS" apt-get update -qq
            chroot "$ROOTFS" env DEBIAN_FRONTEND=noninteractive \
                apt-get install -y --no-install-recommends $GUI_PACKAGES 2>&1 | \
                grep -E "^(Setting up|E:)" || true
            chroot "$ROOTFS" apt-get clean
            ;;
        fedora)
            chroot "$ROOTFS" dnf install -y $GUI_PACKAGES 2>&1 | \
                grep -E "^(Installing|Error)" || true
            chroot "$ROOTFS" dnf clean all
            ;;
        arch)
            chroot "$ROOTFS" pacman -Sy --noconfirm --needed $GUI_PACKAGES 2>&1 | \
                grep -E "^(installing|warning)" || true
            chroot "$ROOTFS" pacman -Scc --noconfirm 2>/dev/null || true
            ;;
        suse)
            chroot "$ROOTFS" zypper --non-interactive install --no-recommends $GUI_PACKAGES 2>&1 | \
                grep -E "^(Installing|Problem)" || true
            chroot "$ROOTFS" zypper clean --all
            ;;
        alpine)
            chroot "$ROOTFS" apk add --no-cache $GUI_PACKAGES 2>&1 | \
                grep -E "^(\(|ERROR)" || true
            ;;
        gentoo)
            for pkg in $GUI_PACKAGES; do
                chroot "$ROOTFS" emerge --ask=n --noreplace "$pkg" 2>&1 | tail -2 || true
            done
            ;;
    esac

    # Tear down chroot
    for m in /run /sys /proc /dev/pts /dev; do
        umount -l "${ROOTFS}${m}" 2>/dev/null || true
    done
fi

# Copy GUI files into rootfs
GUI_DEST="${ROOTFS}/opt/penguins-recovery/gui"
mkdir -p "$GUI_DEST"

# Always copy base (plasma-nano shell) and recovery-launcher
info "Installing plasma-nano base shell"
cp -a "${RECOVERY_ROOT}/gui/base/." "$GUI_DEST/base/"

info "Installing recovery-launcher"
cp -a "${RECOVERY_ROOT}/gui/recovery-launcher/." "$GUI_DEST/recovery-launcher/"
chmod +x "$GUI_DEST/recovery-launcher/recovery-launcher.sh"

# Copy profile-specific components
info "Installing $GUI_PROFILE profile components"
cp -a "${PROFILE_DIR}/." "$GUI_DEST/profiles/${GUI_PROFILE}/"

# Create desktop entry for autostart
AUTOSTART_DIR="${ROOTFS}/etc/xdg/autostart"
mkdir -p "$AUTOSTART_DIR"
cp "${RECOVERY_ROOT}/gui/recovery-launcher/penguins-recovery.desktop" "$AUTOSTART_DIR/"

# Create application menu entry
APPS_DIR="${ROOTFS}/usr/share/applications"
mkdir -p "$APPS_DIR"
cp "${RECOVERY_ROOT}/gui/recovery-launcher/penguins-recovery.desktop" "$APPS_DIR/"

# Create a launcher symlink
mkdir -p "${ROOTFS}/usr/local/bin"
ln -sf /opt/penguins-recovery/gui/recovery-launcher/recovery-launcher.sh \
    "${ROOTFS}/usr/local/bin/penguins-recovery"

info "GUI profile '$GUI_PROFILE' installed."
