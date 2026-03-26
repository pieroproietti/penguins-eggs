#!/bin/bash
# secureboot-chain.sh -- Inject a Secure Boot-compatible boot chain into
# the ISO's EFI directory so recovery ISOs boot on machines with Secure
# Boot enabled.
#
# Usage: source secureboot-chain.sh
#   Requires: ISO_COPY, ROOTFS to be set by the caller.
#
# Strategy:
#   If the rootfs already contains a signed shim (from Debian, Fedora,
#   etc.), copy it into the ISO's EFI/BOOT/ as the primary loader.
#   The chain is: shimx64.efi -> grubx64.efi -> kernel/ISO boot.
#
#   If sbctl is available and the user has custom Secure Boot keys,
#   sign the existing bootloader EFI binaries in-place.
#
#   This follows the same approach as Super-UEFIinSecureBoot-Disk:
#   shim (Microsoft-signed) -> second-stage loader -> GRUB.

set -euo pipefail

ISO_COPY="${ISO_COPY:?ISO_COPY must be set}"
ROOTFS="${ROOTFS:?ROOTFS must be set}"

info()  { echo -e "\033[1;32m[secureboot]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[secureboot]\033[0m $*"; }
error() { echo -e "\033[1;31m[secureboot]\033[0m $*" >&2; }

EFI_BOOT_DIR="$ISO_COPY/EFI/BOOT"
mkdir -p "$EFI_BOOT_DIR"

# Track what we did
SB_METHOD="none"

# --- Method 1: Copy signed shim from the rootfs ---
# Distro-provided shims are signed by Microsoft and work on stock hardware.
find_signed_shim() {
    local shim_path=""
    for candidate in \
        "$ROOTFS/usr/lib/shim/shimx64.efi.signed" \
        "$ROOTFS/usr/lib/shim/shimx64.efi" \
        "$ROOTFS/boot/efi/EFI/BOOT/BOOTX64.EFI" \
        "$ROOTFS/boot/efi/EFI/debian/shimx64.efi" \
        "$ROOTFS/boot/efi/EFI/ubuntu/shimx64.efi" \
        "$ROOTFS/boot/efi/EFI/fedora/shimx64.efi" \
        "$ROOTFS/boot/efi/EFI/opensuse/shim.efi" \
        "$ROOTFS/usr/share/shim-signed/shimx64.efi.signed" \
        ; do
        if [ -f "$candidate" ]; then
            shim_path="$candidate"
            break
        fi
    done
    echo "$shim_path"
}

find_signed_grub() {
    local grub_path=""
    for candidate in \
        "$ROOTFS/usr/lib/grub/x86_64-efi-signed/grubx64.efi.signed" \
        "$ROOTFS/boot/efi/EFI/debian/grubx64.efi" \
        "$ROOTFS/boot/efi/EFI/ubuntu/grubx64.efi" \
        "$ROOTFS/boot/efi/EFI/fedora/grubx64.efi" \
        "$ROOTFS/usr/lib/grub/x86_64-efi/grubx64.efi" \
        "$ROOTFS/usr/share/grub-signed/grubx64.efi.signed" \
        ; do
        if [ -f "$candidate" ]; then
            grub_path="$candidate"
            break
        fi
    done
    echo "$grub_path"
}

find_mokmanager() {
    local mm_path=""
    for candidate in \
        "$ROOTFS/usr/lib/shim/mmx64.efi" \
        "$ROOTFS/usr/lib/shim/mmx64.efi.signed" \
        "$ROOTFS/usr/share/shim-signed/mmx64.efi.signed" \
        "$ROOTFS/usr/share/shim/mmx64.efi" \
        ; do
        if [ -f "$candidate" ]; then
            mm_path="$candidate"
            break
        fi
    done
    echo "$mm_path"
}

inject_shim_chain() {
    local shim grub mokmanager

    shim=$(find_signed_shim)
    grub=$(find_signed_grub)
    mokmanager=$(find_mokmanager)

    if [ -z "$shim" ]; then
        warn "No signed shim found in rootfs."
        return 1
    fi

    info "Found signed shim: $shim"
    cp "$shim" "$EFI_BOOT_DIR/BOOTX64.EFI"

    if [ -n "$grub" ]; then
        info "Found signed GRUB: $grub"
        cp "$grub" "$EFI_BOOT_DIR/grubx64.efi"
    else
        # If no signed GRUB, copy the existing GRUB from the ISO
        if [ -f "$ISO_COPY/EFI/BOOT/grubx64.efi" ]; then
            info "Using existing GRUB from ISO (may need MOK enrollment)."
        else
            warn "No GRUB EFI binary found. Secure Boot chain may be incomplete."
        fi
    fi

    if [ -n "$mokmanager" ]; then
        info "Found MokManager: $mokmanager"
        cp "$mokmanager" "$EFI_BOOT_DIR/mmx64.efi"
    fi

    SB_METHOD="shim"
    return 0
}

# --- Method 2: Sign EFI binaries with sbctl ---
sign_with_sbctl() {
    if ! command -v sbctl &>/dev/null; then
        warn "sbctl not found."
        return 1
    fi

    # Check if sbctl keys exist
    if [ ! -d /usr/share/secureboot/keys ] && [ ! -d /etc/secureboot/keys ]; then
        warn "No sbctl keys found. Run 'sbctl create-keys' first."
        return 1
    fi

    info "Signing EFI binaries with sbctl..."
    local signed_count=0

    for efi_file in $(find "$ISO_COPY/EFI" -name "*.efi" -o -name "*.EFI" 2>/dev/null); do
        if sbctl sign -s "$efi_file" 2>/dev/null; then
            info "  Signed: ${efi_file#$ISO_COPY/}"
            signed_count=$((signed_count + 1))
        else
            warn "  Failed to sign: ${efi_file#$ISO_COPY/}"
        fi
    done

    if [ "$signed_count" -gt 0 ]; then
        SB_METHOD="sbctl"
        return 0
    fi

    return 1
}

# --- Method 3: Sign with sbsign (manual key paths) ---
sign_with_sbsign() {
    if ! command -v sbsign &>/dev/null; then
        warn "sbsign not found."
        return 1
    fi

    # Look for keys in common locations
    local sb_key="" sb_cert=""
    for keydir in /usr/share/secureboot/keys/db /etc/secureboot/keys/db; do
        if [ -f "$keydir/db.key" ] && [ -f "$keydir/db.pem" ]; then
            sb_key="$keydir/db.key"
            sb_cert="$keydir/db.pem"
            break
        fi
    done

    if [ -z "$sb_key" ]; then
        warn "No Secure Boot signing keys found for sbsign."
        return 1
    fi

    info "Signing EFI binaries with sbsign..."
    local signed_count=0

    for efi_file in $(find "$ISO_COPY/EFI" -name "*.efi" -o -name "*.EFI" 2>/dev/null); do
        if sbsign --key "$sb_key" --cert "$sb_cert" --output "$efi_file" "$efi_file" 2>/dev/null; then
            info "  Signed: ${efi_file#$ISO_COPY/}"
            signed_count=$((signed_count + 1))
        else
            warn "  Failed to sign: ${efi_file#$ISO_COPY/}"
        fi
    done

    if [ "$signed_count" -gt 0 ]; then
        SB_METHOD="sbsign"
        return 0
    fi

    return 1
}

# --- Main: try methods in order of preference ---
info "Setting up Secure Boot-compatible boot chain..."

if inject_shim_chain; then
    info "Secure Boot chain installed via signed shim."
elif sign_with_sbctl; then
    info "EFI binaries signed with sbctl."
elif sign_with_sbsign; then
    info "EFI binaries signed with sbsign."
else
    warn "Could not set up Secure Boot chain."
    warn "The recovery ISO may not boot on Secure Boot-enabled machines."
    warn "Options:"
    warn "  - Install shim-signed in the rootfs before adapting"
    warn "  - Set up sbctl keys: sbctl create-keys && sbctl enroll-keys --microsoft"
    warn "  - Disable Secure Boot in UEFI firmware settings"
fi

# Update the EFI boot image inside the ISO if we modified EFI/BOOT/
# The efi.img (FAT image) embedded in the ISO needs to reflect our changes.
update_efi_image() {
    local efi_img=""
    for candidate in \
        "$ISO_COPY/boot/grub/efi.img" \
        "$ISO_COPY/EFI/boot/efiboot.img" \
        "$ISO_COPY/efi.img" \
        "$ISO_COPY/boot/grub/efiboot.img" \
        ; do
        if [ -f "$candidate" ]; then
            efi_img="$candidate"
            break
        fi
    done

    if [ -z "$efi_img" ]; then
        warn "No EFI boot image found in ISO. Creating one."
        efi_img="$ISO_COPY/boot/grub/efi.img"
        mkdir -p "$(dirname "$efi_img")"
    fi

    # Calculate required size (EFI/BOOT contents + 512K padding)
    local efi_size_kb
    efi_size_kb=$(du -sk "$ISO_COPY/EFI" | cut -f1)
    efi_size_kb=$((efi_size_kb + 512))

    info "Rebuilding EFI boot image ($efi_size_kb KB)"

    # Create a new FAT image
    rm -f "$efi_img"
    dd if=/dev/zero of="$efi_img" bs=1K count="$efi_size_kb" 2>/dev/null
    mkfs.vfat "$efi_img" >/dev/null 2>&1

    # Copy EFI directory into the FAT image
    local mnt_point="$WORK_DIR/efi_mnt"
    mkdir -p "$mnt_point"
    mount -o loop "$efi_img" "$mnt_point"
    cp -r "$ISO_COPY/EFI" "$mnt_point/"
    umount "$mnt_point"
    rmdir "$mnt_point"

    info "EFI boot image updated."
}

if [ "$SB_METHOD" != "none" ]; then
    update_efi_image
fi

export SB_METHOD
info "Secure Boot setup complete (method: $SB_METHOD)."
