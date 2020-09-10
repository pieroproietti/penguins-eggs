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

import { IRemix, IDistro } from '../../interfaces'

import Fisherman from './fisherman'


const exec = require('../../lib/utils').exec
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

   displaymanager = false

   user_opt: string

   rootTemplate = path.resolve(__dirname, './../../../conf/calamares/bionic')

   dirCalamaresModules = '/usr/lib/calamares/modules/' // E DIFFERENTE in BIONIC

   dirModules = '/etc/calamares/modules'

   fisherman = {}


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
      this.rootTemplate = path.resolve(__dirname, this.rootTemplate)

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
      const fisherman = new Fisherman(this.dirModules, this.dirCalamaresModules, this.rootTemplate, this.verbose)

      await fisherman.buildModule('partition')
      await fisherman.buildModule('mount')
      await this.moduleUnpackfs()
      await fisherman.buildModule('machineid')
      await fisherman.buildModule('fstab')
      await fisherman.buildModule('locale')
      await fisherman.buildModule('keyboard')
      await fisherman.buildModule('localecfg')
      await fisherman.buildModule('luksbootkeyfile')
      await fisherman.buildModule('users')
      await this.moduleDisplaymanager()
      await fisherman.buildModule('networkcfg')
      await fisherman.buildModule('hwclock')
      this.moduleBeforebootloadermkdirs()
      this.moduleBug()
      await fisherman.buildModule('initramfscfg')
      await fisherman.buildModule('initramfs')
      await fisherman.buildModule('rubcfg')
      this.moduleBeforebootloader()
      await fisherman.buildModule('bootloader')
      this.moduleAfterbootloader()
      this.moduleAdd386arch()
      this.modulePackages()
      this.moduleRemoveuser()
      await fisherman.buildCalamaresModule('remove-link', true)
      // await fisherman.shellprocess('logs') non trova calamares-helper
      await fisherman.buildModule('umount')
      await fisherman.buildModule('finished')
   }


   /**
    * ====================================================================================
    * M O D U L E S
    * ====================================================================================
    */
   private async moduleBeforebootloadermkdirs() {
      const name = 'before-bootloader-mkdirs'
      const dir = this.dirCalamaresModules + name + `/`
      if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir)
      }

      /**
       * copia vmlinuz del cd in /boot/vmlinuz-$(uname -r)
       */
      const desBeforeBootloaderMkdirs = yaml.safeDump({
         type: 'job',
         name: `${name}`,
         interface: 'process',
         command: `/usr/sbin/${name}`,
         timeout: '600'
      })
      write(dir + 'module.desc', desBeforeBootloaderMkdirs)
      const bashContent = 'cp /lib/live/mount/medium/live/vmlinuz /boot/vmlinuz-$(uname -r)\n'
      const bashFile = `/usr/sbin/${name}`
      write(bashFile, bashContent, this.verbose)
      await exec(`chmod +x ${bashFile}`)
   }

   /**
    *
    */
   private async moduleBug() {
      const name = 'bug'
      const dir = this.dirCalamaresModules + name + `/`
      if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir)
      }
      const desBug = yaml.safeDump({
         dontChroot: false,
         type: 'job',
         name: `${name}`,
         interface: 'process',
         command: `/usr/sbin/${name}`
      })
      write(dir + 'module.desc', desBug)

      /**
       * crea un falso initrd in /boot
       */
      const bashContent = 'touch /boot/initrd.img-$(uname -r)\n'
      const bashFile = `/usr/sbin/${name}`
      write(bashFile, bashContent, this.verbose)
      await exec(`chmod +x ${bashFile}`)
   }

   /**
    *
    */
   private async moduleBeforebootloader() {
      const name = 'before-bootloader'
      const dir = this.dirCalamaresModules + name + `/`
      if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir)
      }

      const desBeforeBootloader = yaml.safeDump({
         dontChroot: true,
         type: 'job',
         name: `${name}`,
         interface: 'process',
         command: `/usr/sbin/${name}`
      })
      write(dir + 'module.desc', desBeforeBootloader)
      /**
       * Ho tolto la parte per shim-signed Secure Boot chain-loading bootloader (Microsoft-signed binary)
       */
      let bashContent = ''
      bashContent += '# apt-cdrom add -m -d=/media/cdrom/\n'
      bashContent += "sed -i ' / deb http / d' /etc/apt/sources.list.d/official-package-repositories.list\n"
      bashContent += 'apt-get update\n'
      bashContent += 'apt install -y --no-upgrade -o Acquire::gpgv::Options::=--ignore-time-conflict grub-efi-$(if grep -q 64 /sys/firmware/efi/fw_platform_size; then echo amd64-signed; else echo ia32; fi)\n'
      bashContent += '#apt install -y --no-upgrade -o Acquire::gpgv::Options::=--ignore-time-conflict shim-signed\n'
      const bashFile = `/usr/sbin/${name}`
      write(bashFile, bashContent, this.verbose)
      await exec(`chmod +x ${bashFile}`)
   }

   /**
    *
    */
   private async moduleAfterbootloader() {
      const name = 'after-bootloader'
      const dir = this.dirCalamaresModules + name + `/`
      if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir)
      }

      const desAfterBootloader = yaml.safeDump({
         dontChroot: true,
         type: 'job',
         name: `${name}`,
         interface: 'process',
         command: `/usr/sbin/${name}`
      })
      write(dir + 'module.desc', desAfterBootloader)

      /**
       * stabilire se dontChroot rimuove gli install-debian.desktop degli utenti
       */
      const bashContent = '#"for i in `ls /home/`; do rm /home/$i/Desktop/install-debian.desktop || exit 0; done"\n'
      const bashFile = `/usr/sbin/${name}`
      write(bashFile, bashContent, this.verbose)
      await exec(`chmod +x ${bashFile}`)
   }

   /**
    *
    */
   private async moduleAdd386arch() {
      const name = 'add386arch'
      const dir = this.dirCalamaresModules + name + `/`
      if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir)
      }

      const desAfterBootloader = yaml.safeDump({
         dontChroot: false,
         type: 'job',
         name: `${name}`,
         interface: 'process',
         command: '/usr/bin/dpkg --add-architecture i386'
      })
      write(dir + 'module.desc', desAfterBootloader)

      const bashContent = '/usr/bin/dpkg --add-architecture i386\n'
      const bashFile = `/usr/sbin/${name}`
      write(bashFile, bashContent, this.verbose)
      await exec(`chmod +x ${bashFile}`)
   }


   /**
    *
    */
   private moduleUnpackfs() {
      const fisherman = new Fisherman(this.dirModules, this.dirCalamaresModules, this.rootTemplate, this.verbose)
      const name = 'unpackfs'
      fisherman.buildModule(name)
      shx.sed('-i', '%source%', this.distro.mountpointSquashFs, `${this.dirModules}/${name}.conf`)
   }
   
   /**
    * Al momento rimane con la vecchia configurazione
    */
   private async moduleDisplaymanager() {
      const name = 'displaymanager'
      const displaymanager = require('./modules/displaymanager').displaymanager
      const file = this.dirModules + name + '.conf'
      const content = displaymanager()
      fs.writeFileSync(file, content, 'utf8')
   }

   /**
    * Al momento rimane con la vecchia configurazione
    */
   private async modulePackages() {
      const packages = require('./modules/packages').packages
      const content = packages()
      const name = 'packages'
      const file = this.dirModules + name + '.conf'
      fs.writeFileSync(file, content, 'utf8')
   }

      /**
    * Al momento rimane con la vecchia configurazione
    */
   private async moduleRemoveuser() {
      const name = 'removeuser'
      const content = yaml.safeDump({ username: this.user_opt })
      const file = this.dirModules + name + '.conf'
      fs.writeFileSync(file, content, 'utf8')
   }

   /**
 * moduleFinished
 */
   private moduleFinished() {
      const finished = yaml.safeDump({
         restartNowEnabled: true,
         restartNowChecked: true,
         restartNowCommand: "systemctl -i reboot",
      })
      this.module('finished', finished)
   }


   /**
    * ====================================================================================
    * M O D U L E S   C A L A M A R E S
    * ====================================================================================
    */



   /**
    *
    */
   private async moduleBootloaderconfig() {
      const name = 'bootloader-config'
      const dirModule = this.dirCalamaresModules + name
      if (!fs.existsSync(dirModule)) {
         fs.mkdirSync(dirModule)
      }

      const bootloaderConfig = require('./calamares-modules/desc/bootloader-config').bootloaderConfig
      write(dirModule + 'module.desc', bootloaderConfig(), this.verbose)

      const scriptBootloaderConfig = require('./calamares-modules/scripts/bootloader-config').bootloaderConfig
      const scriptFile = `/usr/sbin/` + 'bootloader-config'
      write(scriptFile, scriptBootloaderConfig(), this.verbose)
      await exec(`chmod +x ${scriptFile}`)
   }

   private module(name: string, content: string) {
      const file = this.dirModules + name + '.conf'
      write(file, content, this.verbose)
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
   // console.log(content)
   fs.writeFileSync(file, content, 'utf8')
}
