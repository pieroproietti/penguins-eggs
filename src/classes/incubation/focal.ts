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

   rootTemplate = './../../../conf/calamares/'

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

      // Istanze
      const instances = [
         {
            id: 'before_bootloader_mkdirs',
            module: 'contextualprocess',
            config: 'before_bootloader_mkdirs_context.conf'
         },
         {
            id: 'before_bootloader',
            module: 'contextualprocess',
            config: 'before_bootloader_context.conf'
         },
         {
            id: 'after_bootloader',
            module: 'contextualprocess',
            config: 'after_bootloader_context.conf'
         },
         {
            id: 'logs',
            module: 'shellprocess',
            config: 'shellprocess_logs.conf'
         },
         {
            id: 'bug-LP#1829805',
            module: 'shellprocess',
            config: 'shellprocess_bug-LP#1829805.conf'
         },
         {
            id: 'add386arch',
            module: 'shellprocess',
            config: 'shellprocess_add386arch.conf'
         }
      ]

      // moduli da mostrare a video
      const show: string[] = ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary']

      // moduli da eseguire
      const exec: string[] = []
      exec.push('partition')
      exec.push('mount')
      exec.push('unpackfs')
      exec.push('machineid')
      exec.push('fstab')
      exec.push('locale')
      exec.push('keyboard')
      exec.push('localecfg')
      exec.push('luksbootkeyfile')
      exec.push('users')
      if (this.displaymanager) {
         exec.push('displaymanager')
      }
      exec.push('networkcfg')
      exec.push('hwclock')
      exec.push('contextualprocess@before_bootloader_mkdirs')
      exec.push('shellprocess@bug-LP#1829805')
      exec.push('initramfscfg')
      exec.push('initramfs')
      exec.push('grubcfg')
      exec.push('contextualprocess@before_bootloader')
      exec.push('bootloader')
      exec.push('contextualprocess@after_bootloader')
      exec.push('automirror')
      exec.push('shellprocess@add386arch')
      exec.push('packages')
      exec.push('removeuser')
      // exec.push("shellprocess@logs")
      exec.push('remove-link')
      exec.push('umount')

      const settings = {
         'modules-search': modulesSearch,
         instances: instances,
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
      //this.shellprocess("logs")
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
    *
    * @param process
    */
   private shellprocess(name: string) {
      let text = ''
      if (name === 'bug-LP#1829805') {
         text += '---\n'
         text += 'dontChroot: false\n'
         text += 'timeout: 30\n'
         text += 'script:\n'
         text += '- "touch @@ROOT@@/boot/initrd.img-$(uname -r)"\n'
      } else if (name === 'add386arch') {
         text += '---\n'
         text += 'dontChroot: false\n'
         text += 'timeout: 30\n'
         text += 'script:\n'
         text += '- command: "/usr/bin/dpkg --add-architecture i386"\n'
      } else if (name === 'logs') {
         text += '---\n'
         text += 'dontChroot: true\n'
         text += 'timeout: 30\n'
         text += 'script:\n'
         text += '    - calamares-logs-helper @@ROOT@@\n'
      }
      let file = this.dirModules + 'shellprocess_' + name + '.conf'
      let content = text
      write(file, content, this.verbose)
   }

   /**
    *
    * @param process
    */
   private contextualprocess(name: string) {
      let text = ''
      if (name === 'before_bootloader_mkdirs') {
         text += '---\n'
         text += 'dontChroot: true\n'
         text += 'timeout: 10\n'
         text += 'firmwareType:\n'
         text += '    efi:\n'
         text += '    - -cp /cdrom/casper/vmlinuz @@ROOT@@/boot/vmlinuz-$(uname -r)\n'
         text += '    - -mkdir -pv @@ROOT@@/media/cdrom\n'
         text += '    - -mount --bind /cdrom @@ROOT@@/media/cdrom\n'
         text += '    bios:\n'
         text += '    - -cp /cdrom/casper/vmlinuz @@ROOT@@/boot/vmlinuz-$(uname -r)\n'
      } else if (name === 'before_bootloader') {
         text += '# Make sure the correct bootloader package is installed for EFI.\n'
         text += '# Also pull in shim so secureboot has a chance at working.\n'
         text += '# Because of edge cases, we ignore BIOS, and do the same\n'
         text += '# procedure for all EFI types.\n'
         text += '---\n'
         text += 'firmwareType:\n'
         text += '    bios:    "-/bin/true"\n'
         text += '    "*":\n'
         /**
          * modifica per installazione UEFI
          */
         //text += '        -    command: apt-cdrom add -m -d=/media/cdrom/\n'
         //text += '             timeout: 10\n'
         //text += '        -    command: sed -i \' / deb http / d\' /etc/apt/sources.list\n'
         //text += '             timeout: 10\n'
         /**
          * grub-efi-amd64-signed esiste ed è OK
          * quello che serve è di montare i vari fsvirtuali e la partizione efi in boot/efi
          * quindi:
          * grub-install
          * grub-update
          * e parte
          */
         text += '        -    command: apt-get update\n'
         text += '             timeout: 120\n'
         text += '        -    command: apt install -y --no-upgrade -o Acquire::gpgv::Options::=--ignore-time-conflict grub-efi-$(if grep -q 64 /sys/firmware/efi/fw_platform_size; then echo amd64-signed; else echo ia32; fi)\n'
         text += '             timeout: 300\n'
         text += '        -    command: apt install -y --no-upgrade -o Acquire::gpgv::Options::=--ignore-time-conflict shim-signed\n'
         text += '             timeout: 300\n'
      } else if (name === 'after_bootloader') {
         text += "# Workaround from ubiquity. Ubuntu's grub will want to look in EFI / ubuntu, so\n"
         text += "# let's make sure it can find something there.\n"
         text += "# This only copies the cfg and doesn't overwrite, this is specifically so\n"
         text += "# this doesn't interfere with an Ubuntu installed on the system already.\n"
         text += '---\n'
         text += 'dontChroot: false\n'
         text += 'timeout: 120\n'
         text += 'firmwareType:\n'
         text += '"*": "-for i in `ls @@ROOT@@/home/`; do rm @@ROOT@@/home/$i/Desktop/lubuntu-calamares.desktop || exit 0; done"\n'
      }
      let content = text
      let file = this.dirModules + name + '_context' + '.conf'
      write(file, content, this.verbose)
   }

   /**
    *
    */
   private modulePartition() {
      const partition = yaml.safeDump({
         efiSystemPartition: '/boot/efi',
         enableLuksAutomatedPartitioning: true,
         userSwapChoices: 'none',
         drawNestedPartitions: true,
         defaultFileSystemType: 'ext4'
      })
      this.module('partition', partition)
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
    * @param name 
    */
   private async buildModule(name: string, isScript: boolean = true) {
      const moduleSource = path.resolve(__dirname, `${this.rootTemplate}/modules/${name}.conf`)
      const moduleDest = `${this.dirModules}/${name}`

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

      if (!fs.existsSync(moduleDest)) {
         fs.mkdirSync(moduleDest)
      }
      shx.cp(`${moduleSource}/module.desc`, moduleDest)
      if (isScript) {
         shx.cp(`${moduleSource}/module.sh`, moduleScript)
         await exec(`chmod +x ${moduleScript}`)
      }
   }

   /**
    * Automirror
    * Python
    */
   private async moduleAutomirror() {
      const name = 'automirror'
      const dirModule = this.dirGlobalModules + name + '/'
      if (!fs.existsSync(dirModule)) {
         fs.mkdirSync(dirModule)
      }

      const automirror = yaml.safeDump({
         baseUrl: 'archive.ubuntu.com',
         distribution: 'Ubuntu',
         geoip: {
            style: 'json',
            url: 'http  s://ipapi.co/json'
         }
      })
      write(dirModule + 'automirror.conf', automirror, this.verbose)

      // Creo anche un config in local con la distro particolare, esempio: lubuntu, ulyana
      const automirrorModules = yaml.safeDump({
         baseUrl: 'archive.ubuntu.com',
         distribution: 'Lubuntu',
         geoip: {
            style: 'json',
            url: 'https://ipapi.co/json'
         }
      })
      write('/etc/calamares/modules/' + 'automirror.conf', automirrorModules)

      // desc
      const desc = yaml.safeDump({
         type: 'job',
         name: 'automirror',
         interface: 'python',
         script: 'main.py'
      })
      write(dirModule + 'module.desc', desc, this.verbose)

      // py
      const scriptAutomirror = require('./calamares-modules/scripts/automirror').automirror
      const scriptFile = dirModule + 'main.py'
      write(scriptFile, scriptAutomirror(this.distro.versionId), this.verbose)
      await exec(`chmod +x ${scriptFile}`)
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
