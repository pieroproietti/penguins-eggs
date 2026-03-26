#!/bin/bash
# iso-repack.sh -- Repackage a modified rootfs back into a bootable ISO.
#
# Usage: source iso-repack.sh
#   Requires: ROOTFS, ISO_COPY, SQUASHFS_PATH, ISO_OUTPUT, WORK_DIR
#   to be set by the caller.
#
# Rebuilds the squashfs from the modified rootfs, then creates a new
# bootable ISO using xorriso (UEFI+BIOS hybrid where possible).

set -euo pipefail

ROOTFS="${ROOTFS:?ROOTFS must be set}"
ISO_COPY="${ISO_COPY:?ISO_COPY must be set}"
SQUASHFS_PATH="${SQUASHFS_PATH:?SQUASHFS_PATH must be set}"
ISO_OUTPUT="${ISO_OUTPUT:?ISO_OUTPUT must be set}"
WORK_DIR="${WORK_DIR:?WORK_DIR must be set}"

info()  { echo -e "\033[1;32m[repack]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[repack]\033[0m $*"; }
error() { echo -e "\033[1;31m[repack]\033[0m $*" >&2; }

# Rebuild squashfs
info "Rebuilding squashfs from $ROOTFS"
rm -f "$SQUASHFS_PATH"

if [[ "$SQUASHFS_PATH" == *.erofs ]]; then
    if command -v mkfs.erofs &>/dev/null; then
        mkfs.erofs -z lz4hc "$SQUASHFS_PATH" "$ROOTFS"
    else
        # Fall back to squashfs, rename the file
        warn "mkfs.erofs not available, falling back to squashfs"
        NEW_PATH="${SQUASHFS_PATH%.erofs}.sfs"
        mksquashfs "$ROOTFS" "$NEW_PATH" -comp xz -b 1M -Xdict-size 100%
        SQUASHFS_PATH="$NEW_PATH"
    fi
else
    mksquashfs "$ROOTFS" "$SQUASHFS_PATH" -comp xz -b 1M -Xdict-size 100%
fi

info "Squashfs rebuilt: $(du -h "$SQUASHFS_PATH" | cut -f1)"

# Update md5sum if present
if [ -f "$ISO_COPY/md5sum.txt" ]; then
    info "Updating md5sum.txt"
    SQUASH_REL="${SQUASHFS_PATH#$ISO_COPY/}"
    MD5=$(md5sum "$SQUASHFS_PATH" | awk '{print $1}')
    sed -i "s|.*${SQUASH_REL}$|${MD5}  ./${SQUASH_REL}|" "$ISO_COPY/md5sum.txt"
fi

# Detect boot configuration for xorriso
EFI_IMG=""
BIOS_IMG=""
BOOT_CAT=""

# Look for EFI boot image
for candidate in \
    "$ISO_COPY/boot/grub/efi.img" \
    "$ISO_COPY/EFI/boot/efiboot.img" \
    "$ISO_COPY/efi.img" \
    "$ISO_COPY/boot/grub/efiboot.img" \
    ; do
    if [ -f "$candidate" ]; then
        EFI_IMG="${candidate#$ISO_COPY/}"
        break
    fi
done

# Look for BIOS boot image (isolinux/syslinux)
for candidate in \
    "$ISO_COPY/isolinux/isolinux.bin" \
    "$ISO_COPY/syslinux/isolinux.bin" \
    "$ISO_COPY/boot/syslinux/isolinux.bin" \
    ; do
    if [ -f "$candidate" ]; then
        BIOS_IMG="${candidate#$ISO_COPY/}"
        break
    fi
done

# Look for boot catalog
for candidate in \
    "$ISO_COPY/isolinux/boot.cat" \
    "$ISO_COPY/boot.catalog" \
    "$ISO_COPY/boot/syslinux/boot.cat" \
    ; do
    if [ -f "$candidate" ]; then
        BOOT_CAT="${candidate#$ISO_COPY/}"
        break
    fi
done

# Build xorriso command
XORRISO_ARGS=(
    -as mkisofs
    -iso-level 3
    -full-iso9660-filenames
    -volid "PENGUINS_RECOVERY"
    -output "$ISO_OUTPUT"
)

if [ -n "$BIOS_IMG" ]; then
    info "BIOS boot: $BIOS_IMG"
    XORRISO_ARGS+=(
        -b "$BIOS_IMG"
        -no-emul-boot
        -boot-load-size 4
        -boot-info-table
    )
    if [ -n "$BOOT_CAT" ]; then
        XORRISO_ARGS+=(-c "$BOOT_CAT")
    fi
fi

if [ -n "$EFI_IMG" ]; then
    info "EFI boot: $EFI_IMG"
    XORRISO_ARGS+=(
        -eltorito-alt-boot
        -e "$EFI_IMG"
        -no-emul-boot
        -isohybrid-gpt-basdat
    )
fi

# Add isohybrid for USB booting if isolinux is present
if [ -n "$BIOS_IMG" ] && [ -f "$ISO_COPY/isolinux/isohdpfx.bin" ]; then
    XORRISO_ARGS+=(-isohybrid-mbr "$ISO_COPY/isolinux/isohdpfx.bin")
fi

XORRISO_ARGS+=("$ISO_COPY")

info "Building ISO: $ISO_OUTPUT"
if command -v xorriso &>/dev/null; then
    xorriso "${XORRISO_ARGS[@]}"
elif command -v genisoimage &>/dev/null; then
    warn "xorriso not found, falling back to genisoimage (no hybrid boot)"
    genisoimage -o "$ISO_OUTPUT" -R -J -V "PENGUINS_RECOVERY" "$ISO_COPY"
else
    error "Neither xorriso nor genisoimage found. Cannot build ISO."
    exit 1
fi

ISO_SIZE=$(du -h "$ISO_OUTPUT" | cut -f1)
info "ISO built: $ISO_OUTPUT ($ISO_SIZE)"

# Cleanup working directory
info "Cleaning up work directory"
rm -rf "$ROOTFS" "$ISO_COPY"

info "Repack complete."
