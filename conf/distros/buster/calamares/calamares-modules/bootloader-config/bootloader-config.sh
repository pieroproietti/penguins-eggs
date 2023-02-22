#!/bin/bash

CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")

# Creo la directory $CHROOT/tmp se mancante 
TMPDIR=$CHROOT/tmp
if [ ! -d $TMPDIR ]; then
    echo mkdir $TMPDIR
fi
# eseguo apt update
chroot $CHROOT apt-get -y --allow-unauthenticated update
# Set secure permissions for the initramfs if we're configuring
# full-disk-encryption. The initramfs is re-generated later in the
# installation process so we only set the permissions snippet without
# regenerating the initramfs right now:
if [ "$(mount | grep $CHROOT" " | cut -c -16)" = "/dev/mapper/luks" ]; then
    echo "UMASK=0077" > $CHROOT/etc/initramfs-tools/conf.d/initramfs-permissions
fi

echo "Running bootloader-config..."

if [ -d /sys/firmware/efi/efivars ]; then
    echo " * Installing grub-efi (uefi)..."
    DEBIAN_FRONTEND=nointeractive chroot $CHROOT apt-get -y --allow-unauthenticated install grub-efi-amd64 cryptsetup keyutils
else
    echo " * install grub... (bios)"
    DEBIAN_FRONTEND=nointeractive chroot $CHROOT apt-get -y --allow-unauthenticated install grub-pc cryptsetup
fi
