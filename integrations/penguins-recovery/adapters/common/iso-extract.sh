#!/bin/bash
# iso-extract.sh -- Extract a penguins-eggs naked ISO for customization.
#
# Usage: source iso-extract.sh
#   Requires: ISO_INPUT, WORK_DIR to be set by the caller.
#
# Outputs:
#   WORK_DIR/iso/       -- mounted ISO contents (read-only copy)
#   WORK_DIR/rootfs/    -- extracted squashfs root filesystem (read-write)
#   SQUASHFS_PATH       -- path to the original squashfs file
#
# Supports penguins-eggs ISO layouts:
#   - live/filesystem.squashfs (Debian/Ubuntu family)
#   - LiveOS/squashfs.img or LiveOS/rootfs.img (Fedora/RHEL)
#   - airootfs.sfs or airootfs.erofs (Arch family)
#   - boot/*/filesystem.squashfs (SUSE)

set -euo pipefail

ISO_INPUT="${ISO_INPUT:?ISO_INPUT must be set}"
WORK_DIR="${WORK_DIR:?WORK_DIR must be set}"

info()  { echo -e "\033[1;32m[extract]\033[0m $*"; }
error() { echo -e "\033[1;31m[extract]\033[0m $*" >&2; }

ISO_MNT="${WORK_DIR}/iso_mnt"
ISO_COPY="${WORK_DIR}/iso"
ROOTFS="${WORK_DIR}/rootfs"

mkdir -p "$ISO_MNT" "$ISO_COPY" "$ROOTFS"

# Handle URL input -- download first
if [[ "$ISO_INPUT" == http* ]]; then
    info "Downloading ISO from $ISO_INPUT"
    ISO_LOCAL="${WORK_DIR}/input.iso"
    curl -fSL -o "$ISO_LOCAL" "$ISO_INPUT"
    ISO_INPUT="$ISO_LOCAL"
fi

# Mount the ISO
info "Mounting ISO: $ISO_INPUT"
mount -o loop,ro "$ISO_INPUT" "$ISO_MNT"

# Copy ISO contents (we need a writable copy for repackaging)
info "Copying ISO contents to $ISO_COPY"
cp -a "$ISO_MNT"/. "$ISO_COPY"/

# Locate the squashfs/erofs image
SQUASHFS_PATH=""
for candidate in \
    "$ISO_COPY/live/filesystem.squashfs" \
    "$ISO_COPY/LiveOS/squashfs.img" \
    "$ISO_COPY/LiveOS/rootfs.img" \
    "$ISO_COPY/arch/x86_64/airootfs.sfs" \
    "$ISO_COPY/arch/x86_64/airootfs.erofs" \
    "$ISO_COPY/boot/"*/filesystem.squashfs \
    ; do
    if [ -f "$candidate" ]; then
        SQUASHFS_PATH="$candidate"
        break
    fi
done

if [ -z "$SQUASHFS_PATH" ]; then
    # Fallback: search recursively
    SQUASHFS_PATH=$(find "$ISO_COPY" -name "*.squashfs" -o -name "*.sfs" -o -name "squashfs.img" 2>/dev/null | head -1)
fi

if [ -z "$SQUASHFS_PATH" ]; then
    error "Could not locate squashfs/erofs image in ISO."
    error "ISO contents:"
    find "$ISO_COPY" -maxdepth 3 -type f
    umount "$ISO_MNT"
    exit 1
fi

info "Found filesystem image: $SQUASHFS_PATH"

# Extract the squashfs
if [[ "$SQUASHFS_PATH" == *.erofs ]]; then
    info "Extracting erofs image..."
    if command -v fsck.erofs &>/dev/null; then
        fsck.erofs --extract="$ROOTFS" "$SQUASHFS_PATH"
    else
        error "erofs-utils not installed. Cannot extract erofs image."
        umount "$ISO_MNT"
        exit 1
    fi
else
    info "Extracting squashfs image..."
    unsquashfs -f -d "$ROOTFS" "$SQUASHFS_PATH"
fi

# Unmount the original ISO
umount "$ISO_MNT"
rmdir "$ISO_MNT"

# Detect distro family from extracted rootfs
if [ -f "$ROOTFS/etc/os-release" ]; then
    source "$ROOTFS/etc/os-release"
    info "Detected distro: $NAME ($ID)"
    info "ID_LIKE: ${ID_LIKE:-none}"
else
    error "No /etc/os-release found in extracted rootfs."
    exit 1
fi

# Export for downstream scripts
export SQUASHFS_PATH ROOTFS ISO_COPY ISO_MNT
export DISTRO_ID="$ID"
export DISTRO_ID_LIKE="${ID_LIKE:-}"
export DISTRO_NAME="$NAME"

info "Extraction complete. Rootfs at: $ROOTFS"
