#!/bin/bash

mkdir -p /tmp/efi
# create bootx64.efi
grub2-mkimage -o /tmp/efi/bootx64.efi -O x86_64-efi -p /EFI/BOOT part_gpt part_msdos fat ext2 search_disk_uuid normal configfile linux help loadenv test cat echo

# using mtools create efiboot.img
dd if=/dev/zero of=/tmp/efi/efiboot.img bs=1M count=10
mkfs.vfat /tmp/efi/efiboot.img
mmd -i /tmp/efi/efiboot.img efi
mmd -i /tmp/efi/efiboot.img efi/boot
mcopy -i /tmp/efi/efiboot.img /tmp/efi/bootx64.efi ::efi/boot/bootx64.efi

#cp /tmp/efi/efiboot.img /home/eggs/.mnt/iso/boot/grub/
cp /tmp/efi/efiboot.img /home/artisan