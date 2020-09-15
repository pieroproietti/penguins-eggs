/**
 * penguins-eggs: buster.ts
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

/**
 *
 */
export class Buster {
   verbose = false

   remix: IRemix

   distro: IDistro

   displaymanager = false

   user_opt: string

   rootTemplate = './../../../../conf/distros/buster/calamares/'

   dirCalamaresModules = '/usr/lib/x86_64-linux-gnu/calamares/modules/'

   dirModules = '/etc/calamares/modules/'

   /**
    * @param remix
    * @param distro
    * @param displaymanager
    * @param verbose
    */
   constructor(remix: IRemix, distro: IDistro, displaymanager: boolean, user_opt: string, verbose = false) {
      this.remix = remix
      this.distro = distro
      this.user_opt = user_opt
      this.verbose = verbose
      this.displaymanager = displaymanager
      if (process.arch === 'ia32') {
         this.dirCalamaresModules = '/usr/lib/calamares/modules/'
      }
      this.rootTemplate=path.resolve(__dirname, this.rootTemplate) + '/'
   }

   /**
    * write setting
    */
   settings() {
      const file = '/etc/calamares/settings.conf'
      shx.cp(`${this.rootTemplate}/settings.conf`, '/etc/calamares')
      shx.sed('-i', '%branding%', this.remix.branding, '/etc/calamares/settings.conf')
   }

   /**

   /**
    *
    */
   async modules() {
      const fisherman = new Fisherman(this.distro, this.dirModules, this.dirCalamaresModules, this.rootTemplate, this.verbose)

      await fisherman.buildModule('partition')
      await fisherman.buildModule('mount')
      await fisherman.moduleUnpackfs()
      await fisherman.buildCalamaresModule('sources-trusted')
      await fisherman.buildModule('machineid')
      await fisherman.buildModule('fstab')
      await fisherman.buildModule('locale')
      await fisherman.buildModule('keyboard')
      await fisherman.buildModule('localecfg')
      await fisherman.buildModule('users')
      if (this.displaymanager) {
         await fisherman.moduleDisplaymanager()
      }
      await fisherman.buildModule('networkcfg')
      await fisherman.buildModule('hwclock')
      await fisherman.buildModule('services-systemd')
      await fisherman.buildCalamaresModule('create-tmp', true)
      await fisherman.buildCalamaresModule('bootloader-config',true)
      await fisherman.buildModule('grubcf')
      await fisherman.buildModule('bootloader')
      await fisherman.modulePackages()
      await fisherman.buildModule('luksbootkeyfile')
      await fisherman.buildModule('plymouthcfg')
      await fisherman.buildModule('initramfscfg')
      await fisherman.buildModule('initramfs')
      await fisherman.moduleRemoveuser(this.user_opt)
      await fisherman.buildCalamaresModule('sources-trusted-unmount', false)
      await fisherman.buildCalamaresModule('sources-final')
      await fisherman.buildModule('umount')
      await fisherman.buildCalamaresModule('remove-link')
      await fisherman.moduleFinished()
   }

   /**
    * ====================================================================================
    * M O D U L E S
    * ====================================================================================
    */

   /**
    * Al momento rimane con la vecchia configurazione
    */
   private async moduleFinished() {
      const name = 'finished'

      const fisherman = new Fisherman(this.distro, this.dirModules, this.dirCalamaresModules, this.rootTemplate, this.verbose)
      await fisherman.buildModule(name)
      const restartNowCommand = "systemctl -i reboot"
      shx.sed('-i', '%restartNowCommand%', restartNowCommand, `${this.dirModules}/${name}.conf`)
   }

   /**
    * Al momento rimane con la vecchia configurazione
    */
   private moduleUnpackfs() {
      const fisherman = new Fisherman(this.distro, this.dirModules, this.dirCalamaresModules, this.rootTemplate, this.verbose)
      const name = 'unpackfs'
      fisherman.buildModule(name)
      shx.sed('-i', '%source%', this.distro.mountpointSquashFs, `${this.dirModules}/${name}.conf`)
   }

   /**
    * usa i moduli-ts
    */
   private async moduleDisplaymanager() {
      const name = 'displaymanager'
      const fisherman = new Fisherman(this.distro, this.dirModules, this.dirCalamaresModules, this.rootTemplate, this.verbose)
      const displaymanager = require('../fisherman-helper/displaymanager').displaymanager
      const file = this.dirModules + name + '.conf'

      if (this.verbose) fisherman.show(name, 'module', this.dirModules)

      const content = displaymanager()
      fs.writeFileSync(file, content, 'utf8')
   }

   /**
    * usa i moduli-ts
    */
   private async modulePackages() {
      const name = 'packages'
      const fisherman = new Fisherman(this.distro, this.dirModules, this.dirCalamaresModules, this.rootTemplate, this.verbose)
      const packages = require('./../fisherman-helper/packages').packages
      const file = this.dirModules + name + '.conf'

      if (this.verbose) fisherman.show(name, 'module', this.dirModules)

      const content = packages()
      fs.writeFileSync(file, content, 'utf8')
   }

   /**
    * Al momento rimane con la vecchia configurazione
    */
   private async moduleRemoveuser() {
      const name = 'removeuser'

      if (this.verbose) console.log(`calamares: ${name} creating module in ${this.dirModules}`)
      const content = yaml.safeDump({ username: this.user_opt })
      const file = this.dirModules + name + '.conf'
      fs.writeFileSync(file, content, 'utf8')
   }
}