#!/bin/bash
set -e

ISODIR="$1"
BOOTLOADERS_DIR="$2"

if [ -z "$ISODIR" ] || [ -z "$BOOTLOADERS_DIR" ]; then
    echo "Error: ISODIR and BOOTLOADERS_DIR must be provided."
    exit 1
fi

echo "Preparing bootloader in: $ISODIR"
echo "Using bootloaders from: $BOOTLOADERS_DIR"

# 1. Creazione struttura directory
mkdir -p "$ISODIR/live" "$ISODIR/isolinux" "$ISODIR/boot/grub" "$ISODIR/EFI/BOOT"

# 2. Copia binari e moduli BIOS/Legacy (ISOLINUX/SYSLINUX)
cp -f "$BOOTLOADERS_DIR/ISOLINUX/isolinux.bin" "$ISODIR/isolinux/"
cp -f "$BOOTLOADERS_DIR/ISOLINUX/isohdpfx.bin" "$ISODIR/isolinux/"
cp -f "$BOOTLOADERS_DIR/syslinux/modules/bios/chain.c32" "$ISODIR/isolinux/"
cp -f "$BOOTLOADERS_DIR/syslinux/modules/bios/ldlinux.c32" "$ISODIR/isolinux/"
cp -f "$BOOTLOADERS_DIR/syslinux/modules/bios/libcom32.c32" "$ISODIR/isolinux/"
cp -f "$BOOTLOADERS_DIR/syslinux/modules/bios/libutil.c32" "$ISODIR/isolinux/"
cp -f "$BOOTLOADERS_DIR/syslinux/modules/bios/vesamenu.c32" "$ISODIR/isolinux/"

# 3. Copia binario UEFI
if [ -f "$BOOTLOADERS_DIR/grub/x86_64-efi/monolithic/grubx64.efi" ]; then
    cp -f "$BOOTLOADERS_DIR/grub/x86_64-efi/monolithic/grubx64.efi" "$ISODIR/EFI/BOOT/BOOTX64.EFI"
fi

echo "Bootloader preparation complete."
