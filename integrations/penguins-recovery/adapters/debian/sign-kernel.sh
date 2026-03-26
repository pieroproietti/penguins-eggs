#!/bin/bash
# sign-kernel.sh -- Sign kernels in a Debian-family rootfs for Secure Boot.
#
# Usage: source sign-kernel.sh
#   Requires: ROOTFS to be set by the caller.
#   Chroot bind mounts must already be in place.
#
# Inspired by berglh/ubuntu-sb-kernel-signing. Signs all kernel images
# and modules in the rootfs so the recovery ISO boots on Secure Boot-
# enabled machines without requiring MOK enrollment.
#
# Signing methods (tried in order):
#   1. sbctl (if keys exist)
#   2. sbsign with distro MOK keys (if present)
#   3. Generate ephemeral MOK and sign (enrolls on first boot)

set -euo pipefail

ROOTFS="${ROOTFS:?ROOTFS must be set}"

info()  { echo -e "\033[1;32m[sign-kernel]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[sign-kernel]\033[0m $*"; }
error() { echo -e "\033[1;31m[sign-kernel]\033[0m $*" >&2; }

# Find kernel images in the rootfs
find_kernels() {
    find "$ROOTFS/boot" -name "vmlinuz-*" -type f 2>/dev/null
}

KERNELS=$(find_kernels)
if [ -z "$KERNELS" ]; then
    warn "No kernel images found in $ROOTFS/boot/"
    return 0 2>/dev/null || exit 0
fi

info "Found kernel images:"
echo "$KERNELS" | sed 's/^/  /'

SIGNED_COUNT=0

# --- Method 1: sbctl ---
try_sbctl() {
    if ! command -v sbctl &>/dev/null; then
        return 1
    fi

    if [ ! -d /usr/share/secureboot/keys ] && [ ! -d /etc/secureboot/keys ]; then
        return 1
    fi

    info "Signing with sbctl..."
    while IFS= read -r kernel; do
        if sbctl sign -s "$kernel" 2>/dev/null; then
            info "  Signed: ${kernel#$ROOTFS}"
            SIGNED_COUNT=$((SIGNED_COUNT + 1))
        else
            warn "  Failed: ${kernel#$ROOTFS}"
        fi
    done <<< "$KERNELS"

    [ "$SIGNED_COUNT" -gt 0 ]
}

# --- Method 2: sbsign with existing MOK ---
try_sbsign_mok() {
    if ! command -v sbsign &>/dev/null; then
        return 1
    fi

    # Look for distro-provided MOK keys
    local mok_key="" mok_cert=""
    for keydir in \
        /var/lib/shim-signed/mok \
        /var/lib/dkms/mok \
        /root/.mok \
        ; do
        if [ -f "$keydir/MOK.priv" ] && [ -f "$keydir/MOK.der" ]; then
            mok_key="$keydir/MOK.priv"
            mok_cert="$keydir/MOK.der"
            break
        elif [ -f "$keydir/MOK.key" ] && [ -f "$keydir/MOK.pem" ]; then
            mok_key="$keydir/MOK.key"
            mok_cert="$keydir/MOK.pem"
            break
        fi
    done

    if [ -z "$mok_key" ]; then
        return 1
    fi

    info "Signing with existing MOK: $mok_key"

    # Convert DER cert to PEM if needed
    local cert_pem
    cert_pem=$(mktemp)
    if file "$mok_cert" | grep -q "DER"; then
        openssl x509 -inform DER -in "$mok_cert" -out "$cert_pem" 2>/dev/null
    else
        cp "$mok_cert" "$cert_pem"
    fi

    while IFS= read -r kernel; do
        if sbsign --key "$mok_key" --cert "$cert_pem" --output "$kernel" "$kernel" 2>/dev/null; then
            info "  Signed: ${kernel#$ROOTFS}"
            SIGNED_COUNT=$((SIGNED_COUNT + 1))
        else
            warn "  Failed: ${kernel#$ROOTFS}"
        fi
    done <<< "$KERNELS"

    rm -f "$cert_pem"
    [ "$SIGNED_COUNT" -gt 0 ]
}

# --- Method 3: Generate ephemeral MOK ---
try_ephemeral_mok() {
    if ! command -v sbsign &>/dev/null || ! command -v openssl &>/dev/null; then
        return 1
    fi

    info "Generating ephemeral MOK for kernel signing..."

    local MOK_DIR="$ROOTFS/var/lib/penguins-recovery/mok"
    mkdir -p "$MOK_DIR"

    # Generate a self-signed MOK
    openssl req -new -x509 -newkey rsa:2048 -sha256 -days 365 \
        -subj "/CN=Penguins Recovery Kernel Signing/" \
        -keyout "$MOK_DIR/MOK.key" -out "$MOK_DIR/MOK.pem" -nodes 2>/dev/null

    # Also create DER version for mokutil enrollment
    openssl x509 -in "$MOK_DIR/MOK.pem" -outform DER -out "$MOK_DIR/MOK.der" 2>/dev/null

    while IFS= read -r kernel; do
        if sbsign --key "$MOK_DIR/MOK.key" --cert "$MOK_DIR/MOK.pem" --output "$kernel" "$kernel" 2>/dev/null; then
            info "  Signed: ${kernel#$ROOTFS}"
            SIGNED_COUNT=$((SIGNED_COUNT + 1))
        else
            warn "  Failed: ${kernel#$ROOTFS}"
        fi
    done <<< "$KERNELS"

    if [ "$SIGNED_COUNT" -gt 0 ]; then
        # Queue MOK enrollment for first boot
        if command -v mokutil &>/dev/null; then
            info "Queuing MOK enrollment (will prompt on first boot)..."
            # mokutil needs to run inside the chroot for the enrollment to persist
            cp "$MOK_DIR/MOK.der" "$ROOTFS/tmp/recovery-mok.der"
            chroot "$ROOTFS" mokutil --import /tmp/recovery-mok.der --root-pw 2>/dev/null || \
                warn "Could not queue MOK enrollment. Manual enrollment needed."
            rm -f "$ROOTFS/tmp/recovery-mok.der"
        fi

        info "Ephemeral MOK created at $MOK_DIR"
        warn "On first boot, MokManager will prompt to enroll the key."
        warn "The MOK password is the root password of the recovery image."
    fi

    [ "$SIGNED_COUNT" -gt 0 ]
}

# --- Try methods in order ---
info "Signing kernels for Secure Boot..."

if try_sbctl; then
    info "Kernels signed with sbctl ($SIGNED_COUNT signed)."
elif try_sbsign_mok; then
    info "Kernels signed with existing MOK ($SIGNED_COUNT signed)."
elif try_ephemeral_mok; then
    info "Kernels signed with ephemeral MOK ($SIGNED_COUNT signed)."
else
    warn "Could not sign kernels. Recovery ISO may not boot with Secure Boot enabled."
    warn "Options:"
    warn "  - Set up sbctl keys before adapting"
    warn "  - Install sbsigntool and create a MOK"
    warn "  - Disable Secure Boot in firmware settings"
fi
