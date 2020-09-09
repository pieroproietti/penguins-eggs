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

   // rootTemplate = './../../../conf/calamares/buster/'
   rootTemplate = path.resolve(__dirname, './../../../conf/calamares/focal/')

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
      this.modulePartition()
      this.moduleMount()
      this.moduleUnpackfs()
      this.moduleMachineid()
      this.moduleFstab()
      this.moduleLocale()
      this.moduleKeyboard()
      this.moduleLocalecfg()
      this.moduleLuksbootkeyfile()
      this.moduleUsers()
      this.moduleDisplaymanager()
      this.moduleNetworkcfg()
      this.moduleHwclock()
      this.contextualprocess('before_bootloader_mkdirs')
      this.shellprocess('bug-LP#1829805')
      this.moduleInitramfscfg()
      this.moduleInitramfs()
      this.moduleGrubcfg()
      this.contextualprocess('before_bootloader')
      this.moduleBootloader()
      this.contextualprocess('after_bootloader')
      this.moduleAutomirror()
      this.shellprocess('add386arch')
      this.modulePackages()
      this.moduleRemoveuser()
      this.shellprocess("logs")
      this.moduleUmount()
      this.moduleRemoveLink()
      this.moduleFinished()
   }

   /**
    * ========================================================================
    * module = name + '.conf'
    * shellprocess = 'shellprocess_' + name + '.conf'
    * contextualprocess = name + '_context.conf'
    *
    * module_calamares
    *                      dir = '/usr/lib/calamares/modules/' + name
    *                      name = module.desc
    *                      script =
    * ========================================================================
    */


   /**
    * 
    * @param name 
    */
   private async shellprocess(name: string, isScript: boolean = true) {
      const moduleSource = path.resolve(__dirname, `${this.rootTemplate}/modules/shellprocess_${name}.conf`)
      const moduleDest = `${this.dirModules}/shellprocess_${name}`

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
    */
   private modulePartition() {
      const name = "partition"
      this.buildModule(name)
   }

   /**
    *
    */
   private moduleMount() {
      const name = 'mount'
      this.buildModule(name)
   }

   /**
    *
    */
   private moduleUnpackfs() {
      const name = 'unpackfs'
      this.buildModule(name)
      shx.sed('-i', '%source%', this.distro.mountpointSquashFs, `${this.dirModules}/${name}.conf`)
   }

   /**
    *
    */
   private moduleMachineid() {
      const name = 'machineid'
      this.buildModule(name)
   }

   /**
    *
    */
   private moduleFstab() {
      const name = 'fstab'
      this.buildModule(name)
   }

   private moduleLocale() {
      if (this.verbose) console.log(`calamares: module locale. Nothing to do!`)
   }

   private moduleKeyboard() {
      if (this.verbose) console.log(`calamares: module keyboard. Nothing to do!`)
   }

   private moduleLocalecfg() {
      if (this.verbose) console.log(`calamares: module localecfg. Nothing to do!`)
   }

   /**
    *
    */
   private moduleUsers() {
      const name = 'users'
      this.buildModule(name)
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

   private moduleNetworkcfg() {
      if (this.verbose) console.log(`calamares: module networkcfg. Nothing to do!`)
   }

   private moduleHwclock() {
      if (this.verbose) console.log(`calamares: module hwclock. Nothing to do!`)
   }

   private moduleServicesSystemd() {
      if (this.verbose) console.log(`calamares: module servives-systemd. Nothing to do!`)
   }

   private moduleGrubcfg() {
      if (this.verbose) console.log(`calamares: module grubcfg. Nothing to do!`)
   }

   /**
    *
    */
   private moduleBootloader() {
      const name = "bootloader"
      this.buildModule(name)
   }

   /**
    * create module packages.conf
    * Rimane con la vecchia configurazione
    */
   private modulePackages() {
      const packages = require('./modules/packages').packages
      const content  = packages()
      const name = 'packages'
      const file = this.dirModules + name + '.conf'
      fs.writeFileSync(file, content, 'utf8')

   }

   /**
    * 
    */
   private moduleLuksbootkeyfile() {
      if (this.verbose) console.log(`calamares: module luksbootkeyfile. Nothing to do!`)
   }
   /**
    *
    */
   private moduleLuksopenswaphookcfg() {
      // const name = 'luksopenswaphookcfg'
      // this.buildModule(name)
   }

   private modulePlymouthcfg() {
      if (this.verbose) console.log(`calamares: module plymouthcfg. Nothing to do!`)
   }

   private moduleInitramfscfg() {
      if (this.verbose) console.log(`calamares: module initramfscfg. Nothing to do!`)
   }

   /**
    *
    */
   private moduleRemoveuser() {
      const name = 'removeuser'
      const content  = yaml.safeDump({ username: this.user_opt })
      const file = this.dirModules + name + '.conf'
      fs.writeFileSync(file, content, 'utf8')
   }

   private moduleInitramfs() {
      if (this.verbose) console.log(`calamares: module initramfs. Nothing to do!`)
   }

   private moduleUmount() {
      if (this.verbose) console.log(`calamares: module unmount. Nothing to do!`)
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
    * M O D U L E S   C A L A M A R E S
    * ====================================================================================
    */

   /**
    * 
    */
   private async moduleRemoveLink() {
      const name = 'remove-link'
      await this.buildCalamaresModule(name)
   }



   /**
    * 
    * @param name 
    */
   private async buildModule(name: string, isScript: boolean = true) {
      const moduleSource = path.resolve(__dirname, `${this.rootTemplate}/modules/${name}.conf`)
      const moduleDest = `${this.dirModules}/${name}`
      if (this.verbose) console.log(`calamares: creating module ${name}`)
      shx.cp(moduleSource, moduleDest)
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

   private async buildCalamaresPython(name: string){
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

   /**
    * Automirror
    * Python
    */
   private async moduleAutomirror() {
      const name = 'automirror'
      this.buildCalamaresPython(name)
   }

}

