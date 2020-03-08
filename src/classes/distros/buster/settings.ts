/* eslint-disable no-console */
/**
 * penguins-eggs: buster/settings-conf.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import shx = require('shelljs')
import path = require('path')
import fs = require('fs')


function settingsConf(branding='eggs'){
    const settings = {
      'modules-search': ['local', '/usr/lib/calamares/modules'],
      sequence: [
        { show: ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary'] },
        {
          exec: ['partition',
            'mount',
            'unpackfs',
            // 'sources-media',
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
            // 'sources-media-unmount',
            // 'sources-final',
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
}