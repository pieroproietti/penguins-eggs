/**
 * penguins-eggs: focal.ts
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
export class Focal {
   verbose = false

   remix: IRemix

   distro: IDistro

   release = false

   user_opt: string


   rootTemplate = './../../../../conf/distros/focal/calamares/'

   dirCalamaresModules = '/usr/lib/x86_64-linux-gnu/calamares/modules/'

   dirModules = '/etc/calamares/modules/'

   fisherman = {}


   /**
    * @param remix
    * @param distro
    * @param displaymanager
    * @param verbose
    */
   constructor(remix: IRemix, distro: IDistro, release: boolean, user_opt: string, verbose = false) {
      this.remix = remix
      this.distro = distro
      this.user_opt = user_opt
      this.verbose = verbose
      this.release = release
      if (process.arch === 'ia32') {
         this.dirCalamaresModules = '/usr/lib/i386-linux-gnu/calamares/modules/'
      }
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
      await fisherman.moduleUnpackfs()
      await fisherman.buildCalamaresModule('sources-yolk', true)      
      await fisherman.buildModule('machineid')
      await fisherman.buildModule('fstab')
      await fisherman.buildModule('locale')
      await fisherman.buildModule('keyboard')
      await fisherman.buildModule('localecfg')
      await fisherman.buildModule('luksbootkeyfile')
      await fisherman.buildModule('users')
      await fisherman.moduleDisplaymanager()
      await fisherman.buildModule('networkcfg')
      await fisherman.buildModule('hwclock')
      await fisherman.contextualprocess('before_bootloader_mkdirs')
      await fisherman.shellprocess('bug-LP#1829805')
      await fisherman.buildModule('initramfs')
      await fisherman.buildModule('grubcfg')
      await fisherman.contextualprocess('before_bootloader')
      await fisherman.buildModule('bootloader')
      await fisherman.contextualprocess('after_bootloader')
      await fisherman.shellprocess('add386arch')
      await fisherman.modulePackages(this.distro, this.release) //
      await fisherman.moduleRemoveuser(this.user_opt)
      await fisherman.buildCalamaresModule('remove-link', true)
      await fisherman.buildCalamaresModule('sources-yolk', false)      
      await fisherman.buildCalamaresModule('sources-yolk-unmount', false)      
      await fisherman.buildModule('umount')
      await fisherman.buildModule('finished')
   }
}