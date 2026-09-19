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

# 2. Copia binari e moduli BIOS/Legacy (ISOLINUX/SYSLINUX) se presenti
if [ -d "$BOOTLOADER_SRC/ISOLINUX" ]; then
    cp -f "$BOOTLOADER_SRC/ISOLINUX/isolinux.bin" "$DEST/isolinux/" 2>/dev/null || true
    cp -f "$BOOTLOADER_SRC/ISOLINUX/isohdpfx.bin" "$DEST/isolinux/" 2>/dev/null || true
fi
if [ -d "$BOOTLOADER_SRC/syslinux/modules/bios" ]; then
    cp -f "$BOOTLOADER_SRC/syslinux/modules/bios/"*.c32 "$DEST/isolinux/" 2>/dev/null || true
fi

# 3. Copia binari UEFI (x86_64, arm64, riscv64, i386)
# Da penguins-bootloaders:
if [ -f "$BOOTLOADER_SRC/grub/x86_64-efi/monolithic/grubx64.efi" ]; then
    cp -f "$BOOTLOADER_SRC/grub/x86_64-efi/monolithic/grubx64.efi" "$DEST/EFI/BOOT/BOOTX64.EFI"
fi
if [ -f "$BOOTLOADER_SRC/grub/arm64-efi/monolithic/grubaa64.efi" ]; then
    cp -f "$BOOTLOADER_SRC/grub/arm64-efi/monolithic/grubaa64.efi" "$DEST/EFI/BOOT/BOOTAA64.EFI"
fi
if [ -f "$BOOTLOADER_SRC/grub/riscv64-efi/monolithic/grubriscv64.efi" ]; then
    cp -f "$BOOTLOADER_SRC/grub/riscv64-efi/monolithic/grubriscv64.efi" "$DEST/EFI/BOOT/BOOTRISCV64.EFI"
fi
if [ -f "$BOOTLOADER_SRC/grub/i386-efi/monolithic/grubia32.efi" ]; then
    cp -f "$BOOTLOADER_SRC/grub/i386-efi/monolithic/grubia32.efi" "$DEST/EFI/BOOT/BOOTIA32.EFI"
fi

# Fallback dai binari installati nel sistema host:
if [ ! -f "$DEST/EFI/BOOT/BOOTAA64.EFI" ]; then
    for f in /usr/lib/grub/arm64-efi/monolithic/grubaa64.efi /usr/lib/grub/arm64-efi/grub.efi /boot/efi/EFI/BOOT/BOOTAA64.EFI; do
        if [ -f "$f" ]; then
            cp -f "$f" "$DEST/EFI/BOOT/BOOTAA64.EFI"
            break
        fi
    done
fi

if [ ! -f "$DEST/EFI/BOOT/BOOTRISCV64.EFI" ]; then
    for f in /usr/lib/grub/riscv64-efi/monolithic/grubriscv64.efi /usr/lib/grub/riscv64-efi/grub.efi /boot/efi/EFI/BOOT/BOOTRISCV64.EFI; do
        if [ -f "$f" ]; then
            cp -f "$f" "$DEST/EFI/BOOT/BOOTRISCV64.EFI"
            break
        fi
    done
fi

if [ ! -f "$DEST/EFI/BOOT/BOOTX64.EFI" ]; then
    for f in /usr/lib/grub/x86_64-efi/monolithic/grubx64.efi /usr/lib/grub/x86_64-efi/grub.efi /boot/efi/EFI/BOOT/BOOTX64.EFI; do
        if [ -f "$f" ]; then
            cp -f "$f" "$DEST/EFI/BOOT/BOOTX64.EFI"
            break
        fi
    done
fi

echo "Bootloader preparation complete."
