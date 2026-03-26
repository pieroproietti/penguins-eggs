#!/bin/bash
# adapter.sh -- Main entry point for layering recovery tools onto a
# penguins-eggs naked ISO.
#
# Usage:
#   sudo ./adapter.sh --input <iso-path-or-url> [--output <output.iso>] [options]
#
# Options:
#   --input <path|url>    Input naked ISO (local path or HTTP URL)
#   --output <path>       Output recovery ISO (default: recovery-<input>.iso)
#   --with-rescapp        Include the rescapp GUI wizard
#   --secureboot          Set up Secure Boot-compatible boot chain (shim/sbctl)
#   --gui <profile>       GUI profile: minimal, touch, full, or none (default: none)
#   --work-dir <path>     Working directory (default: /tmp/penguins-recovery-work)
#   --keep-work           Don't clean up working directory on completion
#   --help                Show this help
#
# The adapter:
#   1. Extracts the ISO and unsquashes the filesystem
#   2. Detects the distro family from /etc/os-release
#   3. Installs recovery packages using the appropriate package manager
#   4. Injects shared scripts, branding, and optionally rescapp
#   5. Repackages into a bootable recovery ISO

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECOVERY_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Defaults
ISO_INPUT=""
ISO_OUTPUT=""
WORK_DIR="/tmp/penguins-recovery-work"
WITH_RESCAPP="false"
WITH_SECUREBOOT="false"
GUI_PROFILE="none"
KEEP_WORK="false"

info()  { echo -e "\033[1;32m[adapter]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[adapter]\033[0m $*"; }
error() { echo -e "\033[1;31m[adapter]\033[0m $*" >&2; }

usage() {
    sed -n '2,/^$/s/^# //p' "$0"
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --input)      ISO_INPUT="$2"; shift 2 ;;
        --output)     ISO_OUTPUT="$2"; shift 2 ;;
        --with-rescapp) WITH_RESCAPP="true"; shift ;;
        --secureboot)  WITH_SECUREBOOT="true"; shift ;;
        --gui)        GUI_PROFILE="$2"; shift 2 ;;
        --work-dir)   WORK_DIR="$2"; shift 2 ;;
        --keep-work)  KEEP_WORK="true"; shift ;;
        --help|-h)    usage ;;
        *) error "Unknown option: $1"; usage ;;
    esac
done

if [ -z "$ISO_INPUT" ]; then
    error "Missing required --input argument."
    usage
fi

if [ "$EUID" -ne 0 ]; then
    error "Must be run as root (need mount, chroot, mksquashfs)."
    exit 1
fi

# Default output name
if [ -z "$ISO_OUTPUT" ]; then
    INPUT_BASENAME="$(basename "$ISO_INPUT" .iso)"
    ISO_OUTPUT="$(pwd)/recovery-${INPUT_BASENAME}.iso"
fi

# Check required tools
for tool in unsquashfs mksquashfs mount chroot; do
    if ! command -v "$tool" &>/dev/null; then
        error "Required tool not found: $tool"
        exit 1
    fi
done

# Cleanup handler
cleanup() {
    if [ "$KEEP_WORK" = "false" ] && [ -d "$WORK_DIR" ]; then
        info "Cleaning up work directory"
        # Unmount any leftover bind mounts
        for m in /run /sys /proc /dev/pts /dev; do
            umount -l "${WORK_DIR}/rootfs${m}" 2>/dev/null || true
        done
        umount -l "${WORK_DIR}/iso_mnt" 2>/dev/null || true
        rm -rf "$WORK_DIR"
    fi
}
trap cleanup EXIT

mkdir -p "$WORK_DIR"

info "============================================"
info "Penguins-Recovery Adapter"
info "============================================"
info "Input:  $ISO_INPUT"
info "Output: $ISO_OUTPUT"
info "Work:   $WORK_DIR"
info "Rescapp: $WITH_RESCAPP"
info "SecureBoot: $WITH_SECUREBOOT"
info "GUI:    $GUI_PROFILE"
info "============================================"

# Step 1: Extract ISO
info "Step 1/4: Extracting ISO"
export ISO_INPUT WORK_DIR
source "$SCRIPT_DIR/common/iso-extract.sh"

# Step 2: Detect distro family and install packages
info "Step 2/4: Installing recovery packages"

# Determine adapter based on distro family
detect_family() {
    local id="$1"
    local id_like="$2"

    # Check ID first, then ID_LIKE
    case "$id" in
        debian|ubuntu|pop|linuxmint|lmde|devuan|neon|zorin|elementary|mx|antix|sparky|peppermint|pureos)
            echo "debian" ;;
        fedora|rhel|almalinux|rocky|centos|nobara|ultramarine)
            echo "fedora" ;;
        arch|endeavouros|manjaro|biglinux|garuda|artix|cachyos|crystal)
            echo "arch" ;;
        opensuse*|sles|suse)
            echo "suse" ;;
        alpine)
            echo "alpine" ;;
        gentoo|funtoo|calculate)
            echo "gentoo" ;;
    esac

    # Fall back to ID_LIKE
    for like in $id_like; do
        case "$like" in
            debian|ubuntu)  echo "debian"; return ;;
            fedora|rhel)    echo "fedora"; return ;;
            arch)           echo "arch"; return ;;
            suse|opensuse)  echo "suse"; return ;;
        esac
    done

    echo "unknown"
}

FAMILY=$(detect_family "$DISTRO_ID" "$DISTRO_ID_LIKE")
info "Detected distro family: $FAMILY (from $DISTRO_NAME)"

ADAPTER_SCRIPT="$SCRIPT_DIR/$FAMILY/install-tools.sh"
if [ ! -f "$ADAPTER_SCRIPT" ]; then
    error "No adapter found for family: $FAMILY"
    error "Expected: $ADAPTER_SCRIPT"
    exit 1
fi

# Set up chroot environment
info "Setting up chroot bind mounts"
for m in /dev /dev/pts /proc /sys /run; do
    mount --bind "$m" "${ROOTFS}${m}"
done

# Copy resolv.conf for network access in chroot
cp -L /etc/resolv.conf "${ROOTFS}/etc/resolv.conf" 2>/dev/null || true

# Run the family-specific installer
export ROOTFS RECOVERY_ROOT FAMILY
source "$ADAPTER_SCRIPT"

# Tear down chroot bind mounts
info "Tearing down chroot bind mounts"
for m in /run /sys /proc /dev/pts /dev; do
    umount -l "${ROOTFS}${m}" 2>/dev/null || true
done

# Step 3: Inject recovery tools
info "Step 3/6: Injecting recovery tools and branding"
export WITH_RESCAPP
source "$SCRIPT_DIR/common/inject-recovery.sh"

# Step 4: Set up Secure Boot chain
if [ "$WITH_SECUREBOOT" = "true" ]; then
    info "Step 4/6: Setting up Secure Boot-compatible boot chain"
    source "$SCRIPT_DIR/common/secureboot-chain.sh"
else
    info "Step 4/6: Skipping Secure Boot (--secureboot not specified)"
fi

# Step 5: Install GUI profile
if [ "$GUI_PROFILE" != "none" ]; then
    info "Step 5/6: Installing GUI profile ($GUI_PROFILE)"
    source "$SCRIPT_DIR/common/install-gui.sh"
else
    info "Step 5/6: Skipping GUI (--gui not specified)"
fi

# Step 6: Repack ISO
info "Step 6/6: Repackaging ISO"
export ISO_OUTPUT
source "$SCRIPT_DIR/common/iso-repack.sh"

info "============================================"
info "Recovery ISO built successfully!"
info "Output: $ISO_OUTPUT"
info "============================================"
