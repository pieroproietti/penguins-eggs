#!/bin/bash
# use-booster.sh -- Switch the Arch rescue builder to use booster
# instead of mkinitcpio for initramfs generation.
#
# Usage: ./use-booster.sh
#
# This modifies packages.x86_64 and airootfs to use booster.
# Run before mkarchiso to build with booster initramfs.
# Reversible with use-mkinitcpio.sh.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGES="$SCRIPT_DIR/packages.x86_64"
AIROOTFS="$SCRIPT_DIR/airootfs"

info()  { echo -e "\033[1;32m[booster]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[booster]\033[0m $*"; }

# Replace mkinitcpio packages with booster
if grep -q "^mkinitcpio$" "$PACKAGES"; then
    info "Replacing mkinitcpio with booster in packages.x86_64"
    sed -i 's/^mkinitcpio$/booster/' "$PACKAGES"
    # Remove mkinitcpio-archiso and mkinitcpio-nfs-utils (not needed with booster)
    sed -i '/^mkinitcpio-archiso$/d' "$PACKAGES"
    sed -i '/^mkinitcpio-nfs-utils$/d' "$PACKAGES"
else
    warn "mkinitcpio not found in packages.x86_64 (already switched?)"
fi

# Install booster config into airootfs
info "Installing booster.conf into airootfs"
mkdir -p "$AIROOTFS/etc"
cp "$SCRIPT_DIR/booster.conf" "$AIROOTFS/etc/booster.yaml"

# Create a hook to generate the booster image during build
mkdir -p "$AIROOTFS/etc/initcpio/install"
info "Creating build hook for booster initramfs generation"

# mkarchiso calls mkinitcpio by default. With booster, we need a
# post-install script that generates the booster image.
mkdir -p "$AIROOTFS/usr/local/bin"
cat > "$AIROOTFS/usr/local/bin/generate-booster-initramfs.sh" << 'HOOK'
#!/bin/bash
# Generate booster initramfs for all installed kernels.
set -euo pipefail
for kernel in /usr/lib/modules/*/vmlinuz; do
    [ -f "$kernel" ] || continue
    kver=$(basename "$(dirname "$kernel")")
    echo "Generating booster initramfs for kernel $kver"
    booster build --force --universal --config /etc/booster.yaml "/boot/initramfs-${kver}.img"
done
HOOK
chmod +x "$AIROOTFS/usr/local/bin/generate-booster-initramfs.sh"

info "Done. Build with: cd builders/arch && sudo mkarchiso -v -w /tmp/archiso-work -o out ."
info "Note: you may need to run generate-booster-initramfs.sh in the chroot"
info "      if mkarchiso doesn't trigger it automatically."
info ""
info "To revert: ./use-mkinitcpio.sh"
