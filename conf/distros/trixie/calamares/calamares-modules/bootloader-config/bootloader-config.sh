#!/bin/bash

CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")

# Creo la directory $CHROOT/tmp se mancante 
TMPDIR=$CHROOT/tmp
if [ ! -d $TMPDIR ]; then
    echo mkdir $TMPDIR
fi

# patch: for same reason we need it for derivatives
chroot $CHROOT dpkg --configure -a

# eseguo apt update
chroot $CHROOT apt-get --yes --allow-unauthenticated update
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
    MACHINE=$(uname -m)
    if [[ "$MACHINE" == x86_64* ]]; then
        arch="amd64"
    elif [[ "$MACHINE" == i*86 ]]; then
        arch=""
    elif  [[ "$MACHINE" == arm* ]]; then
        arch="arm64"
    fi
    DEBIAN_FRONTEND=nointeractive chroot $CHROOT apt-get --yes --allow-unauthenticated --no-install-recommends install grub-efi-${arch} cryptsetup keyutils
else
    echo " * install grub... (bios)"
    DEBIAN_FRONTEND=nointeractive chroot $CHROOT apt-get --yes --allow-unauthenticated --no-install-recommends install grub-pc cryptsetup
fi
