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

import { IRemix, IDistro } from '../../interfaces'

const exec = require('../../lib/utils').exec

/**
 *
 */
export class Buster {
   verbose = false

   remix: IRemix

   distro: IDistro

   displaymanager = false

   user_opt: string

   rootTemplate ='./../../../conf/calamares/'

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
      write(file, this.getSettings(), this.verbose)
   }

   /**
    *
    */
   private getSettings(): string {
      // path di ricerca dei moduli
      const modulesSearch = ['local', '/usr/lib/calamares/modules']

      // moduli da mostrare a video
      const show = ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary']

      // moduli da eseguire
      const exec: string[] = []
      exec.push('partition')
      exec.push('mount')
      exec.push('unpackfs')
      exec.push('sources-trusted')
      exec.push('machineid')
      exec.push('fstab')
      exec.push('locale')
      exec.push('keyboard')
      exec.push('localecfg')
      exec.push('users')
      if (this.displaymanager) {
         exec.push('displaymanager')
      }
      exec.push('networkcfg')
      exec.push('hwclock')
      exec.push('services-systemd')
      exec.push('create-tmp')
      exec.push('bootloader-config')
      exec.push('grubcfg')
      exec.push('bootloader')
      exec.push('luksbootkeyfile')
      exec.push('plymouthcfg')
      exec.push('initramfscfg')
      exec.push('initramfs')
      exec.push('removeuser')
      exec.push('sources-trusted-unmount')
      exec.push('sources-final')
      exec.push('remove-link')
      exec.push('umount')

      const settings = {
         'modules-search': modulesSearch,
         sequence: [{ show: show }, { exec: exec }, { show: ['finished'] }],
         branding: this.remix.branding,
         'prompt-install': false,
         'dont-chroot': false
      }
      return yaml.safeDump(settings)
   }

   /**
    *
    */
   async modules() {
      this.modulePartition()
      this.moduleMount()
      this.moduleUnpackfs()
      this.moduleSourcesTrusted()
      this.moduleMachineid()
      this.moduleFstab()
      this.moduleLocale()
      this.moduleKeyboard()
      this.moduleLocalecfg()
      this.moduleUsers()
      if (this.displaymanager) {
         this.moduleDisplaymanager()
      }
      this.moduleNetworkcfg()
      this.moduleHwclock()
      this.moduleServicesSystemd()
      this.moduleCreateTmp()
      this.moduleBootloaderConfig()
      this.moduleGrubcfg()
      this.moduleBootloader()
      this.modulePackages()
      this.moduleLuksbootkeyfile()
      this.moduleLuksopenswaphookcfg()
      this.modulePlymouthcfg()
      this.moduleInitramfscfg()
      this.moduleInitramfs()
      this.moduleRemoveuser()
      this.moduleSourcesTrustedUnmount()
      this.moduleSourcesFinal()
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
    * write module
    * @param name
    * @param content
    */
   private module(name: string, content: string) {
      const file = this.dirModules + name + '.conf'
      write(file, content, this.verbose)
   }

   /**
    * ====================================================================================
    * M O D U L E S
    * ====================================================================================
    */

   /**
    *
    */
   private async modulePartition() {
      if (this.verbose) console.log(`calamares: module partition. Nothing to do!`)
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
      const name='machineid'
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
      this.module('displaymanager', displaymanager())
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
      this.module('packages', packages())
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
      const name = 'luksopenswaphookcfg'
      this.buildModule(name)
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
      const removeuser = yaml.safeDump({ username: this.user_opt })
      this.module('removeuser', removeuser)
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
    */
   private async moduleSourcesTrusted() {
      const name = 'sources-trusted'
      await this.buildCalamaresModule(name)
   }

   /**
    *
    */
   private async moduleCreateTmp() {
      const name = 'create-tmp'
      await this.buildCalamaresModule(name)
   }

   /**
    *
    */
   private async moduleBootloaderConfig() {
      const name = 'bootloader-config'
      await this.buildCalamaresModule(name)
   }

   /**
    *
    */
   private async moduleSourcesTrustedUnmount() {
      const name = 'sources-trusted-unmount'
      await this.buildCalamaresModule(name, false)
   }

   /**
    *
    */
   private async moduleSourcesFinal() {
      const name = 'sources-final'
      await this.buildCalamaresModule(name)
   }

   /**
    * 
    * @param name 
    */
   private async buildModule(name: string, isScript : boolean = true) {
      const moduleSource = path.resolve(__dirname, `${this.rootTemplate}/modules/${name}.conf`)
      const moduleDest = `${this.dirModules}/${name}`
      
      shx.cp(moduleSource, moduleDest)
   }



   /**
    * 
    * @param name 
    */
   private async buildCalamaresModule(name: string, isScript : boolean = true) {
      const moduleSource = path.resolve(__dirname, `${this.rootTemplate}/calamares-modules/${name}/`)
      const moduleDest = this.dirCalamaresModules + name 
      const moduleScript = `/usr/sbin/${name}.sh`
      
      if (!fs.existsSync(moduleDest)) {
         fs.mkdirSync(moduleDest)
      }
      shx.cp(`${moduleSource}/module.desc`, moduleDest)
      if (isScript) {
         shx.cp(`${moduleSource}/module.sh`, moduleScript)
         await exec(`chmod +x ${moduleScript}`)
      }
   }
}

/**
 *
 * @param file
 * @param content
 * @param verbose
 */
function write(file: string, content: string, verbose = false) {
   if (verbose) {
      console.log(`calamares: create ${file}`)
   }
   fs.writeFileSync(file, content, 'utf8')
}
