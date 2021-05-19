/**
 * penguins-eggs: bionic.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import fs = require('fs')
import shx = require('shelljs')
import yaml = require('js-yaml')
import path = require('path')

import { IRemix, IDistro } from '../../../interfaces'

import Pacman from '../../pacman'
import Fisherman from '../fisherman'

const exec = require('../../../lib/utils').exec

interface IReplaces {
   search: string
   replace: string
}

/**
 *
 */
export class Bionic {
   verbose = false

   installer = 'krill'

   remix: IRemix

   distro: IDistro

   release = false

   user_opt: string

   rootTemplate = './../../../../conf/distros/bionic/calamares/'

   dirCalamaresModules = '/usr/lib/calamares/modules/' // E DIFFERENTE in BIONIC

   dirModules = '/etc/calamares/modules/'

   /**
    * @param remix
    * @param distro
    * @param release
    * @param verbose
    */
   constructor(remix: IRemix, distro: IDistro, release: boolean, user_opt: string, verbose = false) {
      if (Pacman.packageIsInstalled('calamares')) {
         this.installer = 'calamares'
      }
      this.remix = remix
      this.distro = distro
      this.user_opt = user_opt
      this.verbose = verbose
      this.release = release

      this.dirModules='/etc/' + this.installer + '/modules/'
      if (process.arch === 'x32') {
         this.dirCalamaresModules = '/usr/lib/i386-linux-gnu/' + this.installer + '/modules/'
      } else {
         this.dirCalamaresModules = '/usr/lib/x86_64-linux-gnu/' + this.installer + '/modules/'
      }
      shx.exec('mkdir ' + this.dirCalamaresModules + ' -p')

      // I template sono gli stessi, semplicemente non vengono usati da krill
      this.rootTemplate = `./../../../../conf/distros/${this.distro.versionLike}/calamares/`
      this.rootTemplate = path.resolve(__dirname, this.rootTemplate) + '/'
   }


   /**
    *
    */
   async create() {
      const fisherman = new Fisherman(this.distro, this.dirModules, this.dirCalamaresModules, this.rootTemplate, this.verbose)

      await fisherman.settings(this.remix.branding)

      await fisherman.buildModule('partition', this.remix.branding)
      await fisherman.buildModule('mount')
      await fisherman.moduleUnpackfs() //
      await fisherman.buildModule('machineid')
      await fisherman.buildModule('fstab')
      await fisherman.buildModule('locale')
      await fisherman.buildModule('keyboard')
      await fisherman.buildModule('localecfg')
      await fisherman.buildModule('luksbootkeyfile')
      await fisherman.buildModule('users')
      await fisherman.moduleDisplaymanager() //
      await fisherman.buildModule('networkcfg')
      await fisherman.buildModule('hwclock')
      await fisherman.buildCalamaresModule('sources-yolk', true)
      await fisherman.buildCalamaresModule('bug')
      await fisherman.buildModule('initramfscfg')
      await fisherman.buildModule('initramfs')
      await fisherman.buildCalamaresPy('grubcfg')
      await fisherman.buildModule('bootloader')
      await fisherman.buildCalamaresModule('after-bootloader')
      await fisherman.buildCalamaresModule('add386arch', false)
      await fisherman.modulePackages(this.distro, this.release) //
      await fisherman.moduleRemoveuser(this.user_opt) //
      await fisherman.buildCalamaresModule('remove-link', true)
      await fisherman.buildCalamaresModule('sources-yolk-unmount', false)
      await fisherman.buildModule('umount')
      await fisherman.buildModule('finished')
   }
}
