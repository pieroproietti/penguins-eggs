#!/bin/bash
set -e

BOOTLOADER_SRC="$1"
DEST="$2"

if [ -z "$DEST" ] || [ -z "$BOOTLOADER_SRC" ]; then
    echo "Error:  BOOTLOADER_SRC and DEST must be provided."
    exit 1
fi

echo "Preparing bootloader in: $DEST"
echo "Using bootloaders from: $BOOTLOADER_SRC"

# 1. Creazione struttura directory
mkdir -p "$DEST/live" "$DEST/isolinux" "$DEST/boot/grub" "$DEST/EFI/BOOT"

# 2. Copia binari e moduli BIOS/Legacy (ISOLINUX/SYSLINUX)
cp -f "$BOOTLOADER_SRC/ISOLINUX/isolinux.bin" "$DEST/isolinux/"
cp -f "$BOOTLOADER_SRC/ISOLINUX/isohdpfx.bin" "$DEST/isolinux/"
cp -f "$BOOTLOADER_SRC/syslinux/modules/bios/chain.c32" "$DEST/isolinux/"
cp -f "$BOOTLOADER_SRC/syslinux/modules/bios/ldlinux.c32" "$DEST/isolinux/"
cp -f "$BOOTLOADER_SRC/syslinux/modules/bios/libcom32.c32" "$DEST/isolinux/"
cp -f "$BOOTLOADER_SRC/syslinux/modules/bios/libutil.c32" "$DEST/isolinux/"
cp -f "$BOOTLOADER_SRC/syslinux/modules/bios/vesamenu.c32" "$DEST/isolinux/"

# 3. Copia binario UEFI
if [ -f "$BOOTLOADER_SRC/grub/x86_64-efi/monolithic/grubx64.efi" ]; then
    cp -f "$BOOTLOADER_SRC/grub/x86_64-efi/monolithic/grubx64.efi" "$DEST/EFI/BOOT/BOOTX64.EFI"
fi

echo "Bootloader preparation complete."
