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

   remix: IRemix

   distro: IDistro

   sterilize = false

   user_opt: string

   rootTemplate = './../../../../conf/distros/bionic/calamares/'

   dirCalamaresModules = '/usr/lib/calamares/modules/' // E DIFFERENTE in BIONIC

   dirModules = '/etc/calamares/modules/'

   /**
    * @param remix
    * @param distro
    * @param sterilize
    * @param verbose
    */
   constructor(remix: IRemix, distro: IDistro, sterilize: boolean, user_opt: string, verbose = false) {
      this.remix = remix
      this.distro = distro
      this.user_opt = user_opt
      this.verbose = verbose
      this.sterilize = sterilize
      if (process.arch === 'ia32') {
         this.dirCalamaresModules = '/usr/lib/calamares/modules/'
      }
      this.rootTemplate = path.resolve(__dirname, this.rootTemplate) + '/'
   }


   /**
    *
    */
   async create() {
      const fisherman = new Fisherman(this.distro, this.dirModules, this.dirCalamaresModules, this.rootTemplate, this.verbose)

      await fisherman.settings(this.remix.branding, this.sterilize)

      await fisherman.buildModule('partition')
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
      await fisherman.buildCalamaresModule('before-bootloader-mkdirs')
      await fisherman.buildCalamaresModule('bug')
      await fisherman.buildModule('initramfscfg')
      await fisherman.buildModule('initramfs')
      await fisherman.buildCalamaresPy('grubcfg')
      await fisherman.buildCalamaresModule('before-bootloader')
      await fisherman.buildModule('bootloader')
      await fisherman.buildCalamaresModule('after-bootloader')
      await fisherman.buildCalamaresModule('add386arch', false)
      await fisherman.modulePackages(this.distro) //
      await fisherman.moduleRemoveuser(this.user_opt) //
      await fisherman.buildCalamaresModule('remove-link', true)
      // await fisherman.shellprocess('logs') non trova calamares-helper
      await fisherman.buildModule('umount')
      await fisherman.buildModule('finished')
   }
}
