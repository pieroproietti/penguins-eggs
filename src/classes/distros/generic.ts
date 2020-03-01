/* eslint-disable no-console */
/**
 * penguins-eggs: Calamares.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import shx = require('shelljs')
import path = require('path')

/**
 * 
 */
class Generic {
    /**
     * 
     */
    static bootLoaderConfig() :string {
        const text = `\
#!/bin/bash

CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")

# Creo tmp mancante
mkdir $CHROOT/tmp

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
    DEBIAN_FRONTEND=noninteractive chroot $CHROOT apt-get -y install grub-efi-amd64 cryptsetup keyutils
else
    echo " * install grub... (bios)"
    DEBIAN_FRONTEND=noninteractive chroot $CHROOT apt-get -y install grub-pc cryptsetup keyutils
fi\n`   
    return text
    }
}

export default Generic
