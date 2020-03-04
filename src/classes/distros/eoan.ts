/* eslint-disable no-console */
/**
 * penguins-eggs: Calamares.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import shx = require('shelljs')
import path = require('path')

class Eoan {
      /**
   * eoanSettings
   */
  static settings(branding='eggs'): object {
    // shx.cp(`-r`, `${__dirname}/../../templates/distros/eoan/*`, `/etc/`)
    const settings = {
      'modules-search': ['local', '/usr/lib/calamares/modules'],
      sequence: [
        { show: ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary'] },
        {
          exec: [
            'partition',
            'mount',
            'unpackfs',
            'machineid',
            'fstab',
            'locale',
            'keyboard',
            'localecfg',
            'users',
            'displaymanager',
            'networkcfg',
            'hwclock',
            'grubcfg',
            'bootloader',
            'luksbootkeyfile',
            'plymouthcfg',
            'initramfscfg',
            'initramfs',
            'removeuser',
            'umount',
          ]
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
   * 
   */
  static sourcesFinal(){
    return ''
  }


}

export default Eoan