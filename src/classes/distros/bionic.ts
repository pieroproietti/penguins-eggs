/* eslint-disable no-console */
/**
 * penguins-eggs: Calamares.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import shx = require('shelljs')
import path = require('path')

class Bionic {

  /**
  * bionicSettings
  */
  static settings(branding = 'eggs'): object {
    const settings = {
      'modules-search': ['local'],
      sequence: [
        { show: ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary'] },
        { exec: ['partition', 'mount', 'unpackfs', 'machineid', 'fstab', 'locale', 'keyboard', 'localecfg', 'users', 'displaymanager', 'networkcfg', 'hwclock', 'services', 'initramfs', 'grubcfg', 'bootloader', 'removeuser', 'umount'] },
        { show: ['finished'] },
      ],
      branding: branding,
      'prompt-install': true,
      'dont-chroot': false,
    }
    return settings
  }

  /**
 * ubuntuSourcesFinal
 * @param ubuntuRelease 
 */
  static sourcesFinal(ubuntuRelease = 'bionic'): string {
    const text = `
#!/bin/sh
#
# Writes the final sources.list file
#

CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
RELEASE=${ubuntuRelease}

cat << EOF > $CHROOT/etc/apt/sources.list

# penguins-eggs made
# deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE main restricted

# deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE-updates main restricted
# deb http://security.ubuntu.com/ubuntu $RELEASE-security main restricted

# See http://help.ubuntu.com/community/UpgradeNotes for how to upgrade to
# newer versions of the distribution.
deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE main restricted
# deb-src http://it.archive.ubuntu.com/ubuntu/ $RELEASE main restricted

## Major bug fix updates produced after the final release of the
## distribution.
deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE-updates main restricted
# deb-src http://it.archive.ubuntu.com/ubuntu/ $RELEASE-updates main restricted

## N.B. software from this repository is ENTIRELY UNSUPPORTED by the Ubuntu
## team. Also, please note that software in universe WILL NOT receive any
## review or updates from the Ubuntu security team.
deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE universe
# deb-src http://it.archive.ubuntu.com/ubuntu/ $RELEASE universe
deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE-updates universe
# deb-src http://it.archive.ubuntu.com/ubuntu/ $RELEASE-updates universe

## N.B. software from this repository is ENTIRELY UNSUPPORTED by the Ubuntu 
## team, and may not be under a free licence. Please satisfy yourself as to 
## your rights to use the software. Also, please note that software in 
## multiverse WILL NOT receive any review or updates from the Ubuntu
## security team.
deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE multiverse
# deb-src http://it.archive.ubuntu.com/ubuntu/ $RELEASE multiverse
deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE-updates multiverse
# deb-src http://it.archive.ubuntu.com/ubuntu/ $RELEASE-updates multiverse

## N.B. software from this repository may not have been tested as
## extensively as that contained in the main release, although it includes
## newer versions of some applications which may provide useful features.
## Also, please note that software in backports WILL NOT receive any review
## or updates from the Ubuntu security team.
deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE-backports main restricted universe multiverse
# deb-src http://it.archive.ubuntu.com/ubuntu/ $RELEASE-backports main restricted universe multiverse

## Uncomment the following two lines to add software from Canonical's
## 'partner' repository.
## This software is not part of Ubuntu, but is offered by Canonical and the
## respective vendors as a service to Ubuntu users.
# deb http://archive.canonical.com/ubuntu $RELEASE partner
# deb-src http://archive.canonical.com/ubuntu $RELEASE partner

deb http://security.ubuntu.com/ubuntu $RELEASE-security main restricted
# deb-src http://security.ubuntu.com/ubuntu $RELEASE-security main restricted
deb http://security.ubuntu.com/ubuntu $RELEASE-security universe
# deb-src http://security.ubuntu.com/ubuntu $RELEASE-security universe
deb http://security.ubuntu.com/ubuntu $RELEASE-security multiverse
# deb-src http://security.ubuntu.com/ubuntu $RELEASE-security multiverse
EOF

exit 0`
    return text
  }

}
export default Bionic
