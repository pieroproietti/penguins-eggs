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

const exec = require('../../lib/utils').exec

/**
 *
 */
export class Bionic {
   verbose = false

   remix: IRemix

   distro: IDistro

   displaymanager = false

   user_opt: string

   rootTemplate = './../../../conf/calamares/'

   dirCalamaresModules = '/usr/lib/x86_64-linux-gnu/calamares/modules/'

   dirModules = '/etc/calamares/modules/'

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
      
   }

   /**
    *
    */
   modules() {
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
      this.moduleBeforebootloadermkdirs()
      this.moduleBug()
      this.moduleInitramfscfg()
      this.moduleInitramfs()
      this.moduleGrubcfg()
      this.moduleBeforebootloader()
      this.moduleBootloader()
      this.moduleAfterbootloader()
      this.moduleAutomirror()
      this.moduleAdd386arch()
      this.modulePackages()
      this.moduleRemoveuser()
      this.moduleUmount()
      this.moduleFinished()
   }

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
      const mount = yaml.safeDump({
         extraMounts: [
            {
               device: 'proc',
               fs: 'proc',
               mountPoint: '/proc'
            },
            {
               device: 'sys',
               fs: 'sysfs',
               mountPoint: '/sys'
            },
            {
               device: '/dev',
               mountPoint: '/dev',
               options: 'bind'
            },
            {
               device: '/dev/pts',
               fs: 'devpts',
               mountPoint: '/dev/pts'
            },
            {
               device: 'tmpfs',
               fs: 'tmpfs',
               mountPoint: '/run'
            },
            {
               device: '/run/udev',
               mountPoint: '/run/udev',
               options: 'bind'
            }
         ],
         extraMountsEfi: [
            {
               device: 'efivarfs',
               fs: 'tmpefivarfsfs',
               mountPoint: '/sys/firmware/efi/efivars'
            }
         ]
      })

      this.module('mount', mount)
   }

   /**
    *
    */
   private moduleUnpackfs() {
      const unpack = yaml.safeDump({
         unpack: [
            {
               source: this.distro.mountpointSquashFs,
               sourcefs: 'squashfs',
               destination: ''
            }
         ]
      })
      this.module('unpackfs', unpack)
   }

   /**
    *
    */
   private moduleMachineid() {
      const machineid = yaml.safeDump({
         systemd: true,
         dbus: true,
         symlink: true
      })
      this.module('machineid', machineid)
   }

   /**
    *
    */
   private moduleFstab() {
      const fstab = yaml.safeDump({
         mountOptions: {
            default: 'defaults,noatime',
            btrfs: 'defaults,noatime,space_cache,autodefrag'
         },
         ssdExtraMountOptions: {
            ext4: 'discard',
            jfs: 'discard',
            xfs: 'discard',
            swap: 'discard',
            btrfs: 'discard,compress=lzo'
         },
         crypttabOptions: 'luks,keyscript=/bin/cat'
      })

      this.module('fstab', fstab)
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
      const users = yaml.safeDump({
         userGroup: 'users',
         defaultGroups: ['cdrom', 'floppy', 'sudo', 'audio', 'dip', 'video', 'plugdev', 'netdev', 'lpadmin', 'scanner', 'bluetooth'],
         autologinGroup: 'autologin',
         sudoersGroup: 'sudo',
         setRootPassword: false
      })
      this.module('users', users)
   }

   /**
    *
    */
   private moduleDisplaymanager() {
      const displaymanager_not_used = yaml.safeDump({
         displaymanager: 'lightdm',
         basicSetup: false,
         sysconfigSetup: false
      })

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
      const bootloader = yaml.safeDump({
         efiBootLoader: 'grub',
         kernel: '/vmlinuz-linux',
         img: '/initramfs-linux.img',
         fallback: '/initramfs-linux-fallback.img',
         timeout: 10,
         grubInstall: 'grub-install',
         grubMkconfig: 'grub-mkconfig',
         grubCfg: '/boot/grub/grub.cfg',
         grubProbe: 'grub-probe',
         efiBootMgr: 'efibootmgr',
         installEFIFallback: false
      })
      this.module('bootloader', bootloader)
   }

   /**
    * create module packages.conf
    */
   private modulePackages() {
      const packages = require('./modules/packages').packages
      this.module('packages', packages())
   }

   private moduleLuksbootkeyfile() {
      if (this.verbose) console.log(`calamares: module luksbootkeyfile. Nothing to do!`)
   }

   /**
    *
    */
   private module_luksopenswaphookcfg() {
      const lksopenswaphookcfg = yaml.safeDump({
         configFilePath: '/etc/openswap.conf'
      })
      this.module('lksopenswaphookcfg', lksopenswaphookcfg)
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
    * Automirror
    * Pythonm
    */
   private async moduleAutomirror() {
      const name = 'automirror'
      const dirModule = this.dirCalamaresModules + name + '/'
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

   private async moduleCreatetmp() {
      const name = 'create-tmp'
      const dirModule = this.dirCalamaresModules + name + '/'
      if (!fs.existsSync(dirModule)) {
         fs.mkdirSync(dirModule)
      }

      const createTmp = require('./calamares-modules/desc/create-tmp').createTmp
      write(dirModule + 'module.desc', createTmp(), this.verbose)

      const scriptcreateTmp = require('./calamares-modules/scripts/create-tmp').createTmp
      const scriptFile = `/usr/sbin/${name}`
      write(scriptFile, scriptcreateTmp(), this.verbose)
      await exec(`chmod +x ${scriptFile}`)
   }

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
