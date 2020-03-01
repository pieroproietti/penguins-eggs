/* eslint-disable no-console */
/**
 * penguins-eggs: Calamares.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import shx = require('shelljs')
import path = require('path')
import fs = require('fs')


 class Buster {

  /**
   * buster settings
   */
  static settings(branding='eggs'): object {
    const settings = {
      'modules-search': ['local', '/usr/lib/calamares/modules'],
      sequence: [
        { show: ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary'] },
        {
          exec: ['partition',
            'mount',
            'unpackfs',
            'sources-media',
            'machineid',
            'fstab',
            'locale',
            'keyboard',
            'localecfg',
            'users',
            'networkcfg',
            'hwclock',
            'services-systemd',
            'bootloader-config',
            'grubcfg',
            'bootloader',
            'packages',
            'luksbootkeyfile',
            'plymouthcfg',
            'initramfscfg',
            'initramfs',
            'sources-media-unmount',
            'sources-final',
            'umount',]
        },
        { show: ['finished'] },
      ],
      branding: branding,
      'prompt-install': false,
      'dont-chroot': false,
    }
    return settings
  }




  /**
   * sourcesFinal
   * crea script bash /sbin/sources-final per Debian
   */
  static sourcesFinal(debianRelease = 'buster'): string {
    const text = `\
#!/bin/sh
#
# Writes the final sources.list file
#

CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
RELEASE=${debianRelease}

cat << EOF > $CHROOT/etc/apt/sources.list
#------------------------------------------------------------------------------#
#                   OFFICIAL DEBIAN REPOS                    
#------------------------------------------------------------------------------#

###### Debian Main Repos
deb http://deb.debian.org/debian/ $RELEASE main contrib non-free
deb-src http://deb.debian.org/debian/ $RELEASE main contrib non-free

deb http://deb.debian.org/debian/ $RELEASE-updates main contrib non-free
deb-src http://deb.debian.org/debian/ $RELEASE-updates main contrib non-free

deb http://deb.debian.org/debian-security $RELEASE/updates main
deb-src http://deb.debian.org/debian-security $RELEASE/updates main

deb http://ftp.debian.org/debian $RELEASE-backports main
deb-src http://ftp.debian.org/debian $RELEASE-backports main
EOF

exit 0`
    return text
   }
}
export default Buster
