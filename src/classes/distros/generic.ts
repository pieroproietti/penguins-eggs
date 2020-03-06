/* eslint-disable no-console */
/**
 * penguins-eggs: Calamares.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import shx = require('shelljs')
import os = require('os')
import path = require('path')
import Utils from './../utils'

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
#########################################################################
# if [ "$(mount | grep $CHROOT" " | cut -c -16)" = "/dev/mapper/luks" ]; then
#    echo "UMASK=0077" > $CHROOT/etc/initramfs-tools/conf.d/initramfs-permissions
#fi
#########################################################################
        
echo "Running bootloader-config..."

#########################################################################
DEBIAN_FRONTEND=noninteractive chroot $CHROOT apt-get update
#########################################################################
if [ -d /sys/firmware/efi/efivars ]; then
    echo " * Installing grub-efi (uefi)..."
    DEBIAN_FRONTEND=noninteractive chroot $CHROOT apt-get -y install grub-efi-amd64 cryptsetup keyutils
else
    echo " * install grub... (bios)"
    DEBIAN_FRONTEND=noninteractive chroot $CHROOT apt-get -y install grub-pc cryptsetup keyutils
fi\n`   
    return text
    }

    /**
    * 
    */
   static packages(): string {
    let text = ``
    text += `backend: apt\n\n`
    text += `operations:\n`
    text += ` - remove:\n`
    text += addIfExist('live-boot')
    text += addIfExist('live-boot-doc')
    text += addIfExist('live-config')
    text += addIfExist('live-config-doc')
    text += addIfExist('live-config-systemd')
    text += addIfExist('live-tools')
    text += addIfExist('task-localisation')
    text += addIfExist('live-task-recommended')
    text += addIfExist('calamares-settings-debian')
    text += '\n'
    return text
  }

  /**
   * create content per removeuser.conf
   */
  static removeuser(): string{
    let text = ''
    text += '---\n'
    //text += `username: ${os.userInfo().username}\n`
    text += `username: live\n`
    return text
  }

  /** 
   * create content per displaymanager.conf
   */
  static displaymanager(): string {
    let text = ''

    text += 'displaymanagers:\n'
    text += addIfExist('slim')
    text += addIfExist('sddm')
    text += addIfExist('lightdm')
    text += addIfExist('gdm')
    text += addIfExist('mdm')
    text += addIfExist('lxdm')
    text += addIfExist('kdm')
    text += 'basicSetup: false\n'
    text += 'sysconfigSetup: false'
    return text
  }
}
export default Generic

function addIfExist(package2check: string): string {
  let text = ''
  if (Utils.packageIsInstalled(package2check)){
    text +=`   - '${package2check}'\n`
  }
  return text
  
}
