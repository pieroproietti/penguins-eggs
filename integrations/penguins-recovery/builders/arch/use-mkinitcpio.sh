#!/bin/bash
# use-mkinitcpio.sh -- Revert the Arch rescue builder to use mkinitcpio
# (the default) instead of booster.
#
# Usage: ./use-mkinitcpio.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGES="$SCRIPT_DIR/packages.x86_64"
AIROOTFS="$SCRIPT_DIR/airootfs"

info()  { echo -e "\033[1;32m[mkinitcpio]\033[0m $*"; }

if grep -q "^booster$" "$PACKAGES"; then
    info "Replacing booster with mkinitcpio in packages.x86_64"
    sed -i 's/^booster$/mkinitcpio/' "$PACKAGES"

    # Re-add mkinitcpio-archiso and mkinitcpio-nfs-utils after mkinitcpio
    if ! grep -q "^mkinitcpio-archiso$" "$PACKAGES"; then
        sed -i '/^mkinitcpio$/a mkinitcpio-archiso' "$PACKAGES"
    fi
    if ! grep -q "^mkinitcpio-nfs-utils$" "$PACKAGES"; then
        sed -i '/^mkinitcpio-archiso$/a mkinitcpio-nfs-utils' "$PACKAGES"
    fi
fi

# Remove booster config and hook
rm -f "$AIROOTFS/etc/booster.yaml"
rm -f "$AIROOTFS/usr/local/bin/generate-booster-initramfs.sh"

info "Reverted to mkinitcpio."
