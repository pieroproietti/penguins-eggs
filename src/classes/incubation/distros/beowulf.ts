/**
 * penguins-eggs: devuan.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 * al momento escludo solo machineid
 */

import shx = require('shelljs')
import path = require('path')


import { IInstaller, IRemix, IDistro } from '../../../interfaces'
import Fisherman from '../fisherman'

const exec = require('../../../lib/utils').exec

/**
 *
 */
export class Beowulf {
   verbose = false

   installer = {} as IInstaller

   remix: IRemix

   distro: IDistro

   release = false

   user_opt: string

   /**
    * @param remix
    * @param distro
    * @param displaymanager
    * @param verbose
    */
    constructor(installer : IInstaller, remix: IRemix, distro: IDistro, release: boolean, user_opt: string, verbose = false) {
      this.installer = installer
      this.remix = remix
      this.distro = distro
      this.user_opt = user_opt
      this.verbose = verbose
      this.release = release 
   }

   /**
    *
    */
   async create() {
      const fisherman = new Fisherman(this.distro, this.installer, this.verbose)

      await fisherman.settings(this.remix.branding)

      await fisherman.buildModule('partition', this.remix.branding)
      await fisherman.buildModule('mount')
      await fisherman.moduleUnpackfs() //
      await fisherman.buildCalamaresModule('sources-yolk')
      await fisherman.buildModule('fstab')
      await fisherman.buildModule('locale')
      await fisherman.buildModule('keyboard')
      await fisherman.buildModule('localecfg')
      await fisherman.buildModule('users')
      await fisherman.moduleDisplaymanager() //
      await fisherman.buildModule('networkcfg')
      await fisherman.buildModule('hwclock')
      // await fisherman.buildCalamaresModule('create-tmp')
      await fisherman.buildCalamaresModule('bootloader-config')
      await fisherman.buildModule('grubcf')
      await fisherman.buildModule('bootloader')
      await fisherman.modulePackages(this.distro, this.release) //
      await fisherman.buildModule('luksbootkeyfile')
      await fisherman.buildModule('plymouthcfg')
      await fisherman.buildModule('initramfscfg')
      await fisherman.buildModule('initramfs')
      await fisherman.moduleRemoveuser(this.user_opt) //
      await fisherman.buildCalamaresModule('sources-yolk-unmount', false)
      await fisherman.buildModule('umount')
      await fisherman.buildCalamaresModule('remove-link')
      await fisherman.moduleFinished()
   }
}