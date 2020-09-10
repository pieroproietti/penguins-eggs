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

import { IRemix, IDistro } from '../../interfaces'

const exec = require('../../lib/utils').exec

/**
 *
 */
export class Focal {
   verbose = false

   remix: IRemix

   distro: IDistro

   displaymanager = false

   user_opt: string

   rootTemplate = path.resolve(__dirname, './../../../conf/calamares/focal')

   dirCalamaresModules = '/usr/lib/x86_64-linux-gnu/calamares/modules'

   dirModules = '/etc/calamares/modules'

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
    *
    */
   async modules() {
      this.buildModule('partition')
      this.buildModule('mount')
      this.moduleUnpackfs()
      this.buildModule('machineid')
      this.buildModule('fstab')
      this.buildModule('locale')
      this.buildModule('keyboard')
      this.buildModule('localecfg')
      this.buildModule('luksbootkeyfile')
      this.buildModule('users')
      this.buildModule('displaymanager')
      this.buildModule('networkcfg')
      this.buildModule('hwclock')
      this.contextualprocess('before_bootloader_mkdirs')
      this.shellprocess('bug-LP#1829805')
      this.buildModule('initramfs')
      this.buildModule('rubcfg')
      this.contextualprocess('before_bootloader')
      this.buildModule('bootloader')
      this.contextualprocess('after_bootloader')
      // this.buildCalamaresPy('automirror')
      this.shellprocess('add386arch')
      this.buildModule('packages')
      this.buildCalamaresModule('remove-link')
      this.shellprocess('logs')
      this.buildModule('umount')
      // - show:
      this.buildModule('finished')
   }


   /**
    * ====================================================================================
    * M O D U L E S   C A L A M A R E S
    * ====================================================================================
    */

   /**
    * Al momento rimane con la vecchia configurazione
    */
   private moduleUnpackfs() {
      const name = 'unpackfs'
      this.buildModule(name)
      shx.sed('-i', '%source%', this.distro.mountpointSquashFs, `${this.dirModules}/${name}.conf`)
   }

   /**
    * Al momento rimane con la vecchia configurazione
    */
   private moduleDisplaymanager() {
      const displaymanager = require('./modules/displaymanager').displaymanager
      const file = this.dirModules + name + '.conf'
      const content = displaymanager()
      fs.writeFileSync(file, content, 'utf8')
   }

   /**
    * Al momento rimane con la vecchia configurazione
    */
   private modulePackages() {
      const packages = require('./modules/packages').packages
      const content = packages()
      const name = 'packages'
      const file = this.dirModules + name + '.conf'
      fs.writeFileSync(file, content, 'utf8')
   }

   /**
    *
    */
   private moduleRemoveuser() {
      const name = 'removeuser'
      const content = yaml.safeDump({ username: this.user_opt })
      const file = this.dirModules + name + '.conf'
      fs.writeFileSync(file, content, 'utf8')
   }

   /**
    * moduleFinished
    */
   private moduleFinished() {
      const name = "finished"
      const restartNowCommand = "systemctl -i reboot"
      this.buildModule(name)
      shx.sed('-i', '%restartNowCommand%', restartNowCommand, `${this.dirModules}/${name}.conf`)
   }


/**
    * ====================================================================================
    * M O D U L E S   C A L A M A R E S - E N D
    * ====================================================================================
    */





   /**
    *  F I S H E R M A N
    */


   /**
    * 
    * @param name 
    */
   private async shellprocess(name: string, isScript: boolean = true) {
      const moduleSource = path.resolve(__dirname, `${this.rootTemplate}/modules/shellprocess_${name}.conf`)
      const moduleDest = `${this.dirModules}/shellprocess_${name}.conf`

      shx.cp(moduleSource, moduleDest)
   }

   /**
   * 
   * @param name 
   */
   private async contextualprocess(name: string, isScript: boolean = true) {
      const moduleSource = path.resolve(__dirname, `${this.rootTemplate}/modules/${name}_context.conf`)
      const moduleDest = `${this.dirModules}/${name}_context.conf`

      shx.cp(moduleSource, moduleDest)
   }

   /**
    * 
    * @param name 
    */
   private async buildModule(name: string, isScript: boolean = true) {
      const moduleSource = path.resolve(__dirname, `${this.rootTemplate}/modules/${name}.conf`)
      const moduleDest = `${this.dirModules}/${name}.conf`
      if (fs.existsSync(moduleSource)) {
         shx.cp(moduleSource, moduleDest)
         if (this.verbose) console.log(`calamares: creating module ${name}`)
         shx.cp(moduleSource, moduleDest)
      } else {
         if (this.verbose) console.log(`calamares: module ${name}, nothing to do`)
      }
   }

   /**
    * 
    * @param name 
    */
   private async buildCalamaresModule(name: string, isScript: boolean = true) {
      const moduleSource = path.resolve(__dirname, `${this.rootTemplate}/calamares-modules/${name}/`)
      const moduleDest = this.dirCalamaresModules + name
      const moduleScript = `/usr/sbin/${name}.sh`

      if (this.verbose) console.log(`calamares: creating moduleCalamares ${name}`)


      if (!fs.existsSync(moduleDest)) {
         fs.mkdirSync(moduleDest)
      }
      shx.cp(`${moduleSource}/module.desc`, moduleDest)
      if (isScript) {
         shx.cp(`${moduleSource}/module.sh`, moduleScript)
         await exec(`chmod +x ${moduleScript}`)
      }
   }

   private async buildCalamaresPy(name: string) {
      const moduleSource = path.resolve(__dirname, `${this.rootTemplate}/calamares-modules/${name}/`)
      const moduleDest = this.dirCalamaresModules + name

      if (this.verbose) console.log(`calamares: creating module Python ${name}`)
      if (!fs.existsSync(moduleDest)) {
         fs.mkdirSync(moduleDest)
      }
      shx.cp(`${moduleSource}/module.desc`, moduleDest)
      shx.cp(`${moduleSource}/${name}.conf`, moduleDest)
      shx.cp(`${moduleSource}/main.py`, moduleDest)
      await exec(`chmod +x ${moduleSource}/main.py`)
   }
}

