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
  static settings(branding = 'eggs'): object {
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
            `removeuser`,
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

  /**
   * 
   * @param debianRelease 
   */
  static sourcesMedia(debianRelease = 'buster'): string {
    const text = `\
#!/bin/sh

CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
MEDIUM_PATH="/run/live/medium"
RELEASE="buster"

if [ "$1" = "-u" ]; then
    umount $CHROOT/$MEDIUM_PATH
    rm $CHROOT/etc/apt/sources.list.d/debian-live-media.list
    chroot $CHROOT apt-get update
    exit 0
fi

# Remove the base sources, we will configure sources in a later phase
rm -f $CHROOT/etc/apt/sources.list.d/base.list

mkdir -p $CHROOT/$MEDIUM_PATH
mount --bind $MEDIUM_PATH $CHROOT/$MEDIUM_PATH
echo "deb [trusted=yes] file:$MEDIUM_PATH $RELEASE main" > $CHROOT/etc/apt/sources.list.d/debian-live-media.list
chroot $CHROOT apt-get update
# Attempt safest way to remove cruft
rmdir $CHROOT/run/live/medium
rmdir $CHROOT/run/live

exit 0\n`
    return text
  }
}
export default Buster
