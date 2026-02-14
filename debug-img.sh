#!/bin/bash
# debug-img.sh
# Usage: sudo ./debug-img.sh <image.img>

IMG="$1"

if [ -z "$IMG" ]; then
    echo "Usage: $0 <image.img>"
    exit 1
fi

if [ ! -f "$IMG" ]; then
    echo "Error: Image $IMG not found"
    exit 1
fi

echo "=== Partition Table ==="
fdisk -l "$IMG"

echo ""
echo "=== Mounting Partitions ==="
LOOP_DEV=$(losetup -fP --show "$IMG")
echo "Loop device: $LOOP_DEV"

mkdir -p /tmp/debug_efi
mkdir -p /tmp/debug_root

mount "${LOOP_DEV}p1" /tmp/debug_efi
mount "${LOOP_DEV}p2" /tmp/debug_root

echo ""
echo "=== EFI Partition Content (p1) ==="
find /tmp/debug_efi -type f -exec ls -lh {} \;

echo ""
echo "=== Root Partition GRUB Content (p2) ==="
find /tmp/debug_root/boot/grub -type f -name "grub.cfg" -exec ls -lh {} \;
cat /tmp/debug_root/boot/grub/grub.cfg

echo ""
echo "=== Cleaning up ==="
umount /tmp/debug_efi
umount /tmp/debug_root
losetup -d "$LOOP_DEV"
rmdir /tmp/debug_efi
rmdir /tmp/debug_root
