/**
 * ./src/krill/sequence.tsx
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

/**
 * Note: I'm using REACT here to get a TUI,
 *       via ink library https://github.com/vadimdemedes/ink
 */


/**
 * Ideally, I want to respect calamares way, remplementing the same (SEMPLIFIED) steps for CLI
 *
 *
 *  - partition:     partitions
 *  - mount:         mountFs, mountVfs
 *  - unpackfs:      unpackfs
 *  - _restore:      eggs syncfrom --rootdir /tmp/calamares-krill-root/
 *  - sources-yolk:  execCalamaresModule('sources-yolk')
 *  - machineid:     machineid
 *  - fstab:         fstab
 *  - locale         locale
 *  - keyboard:      keyboard
 *  
 * - localecfg:     localecfg
 *  - users:         users
 *  - displaymanager: autologin
 *  - networkcfg:    networkcfg
 *  - hwclock:
 *  - services-systemd:
 *  - bootloader-config: bootloader-config-arch / bootloader-config-debian
 *  - grubcfg:       grubcfg
 *  - bootloader:    bootloaded
 *  - packages:      removeInstaller
 *  - plymouthcfg;
 *  - initramfscfg:  initramfscfg
 *  - initramfs:     initramfs
 *  - removeuser:    removeuser
 *  - sources-yolk-undo: execCalamaresModule('sources-yolk-undo')
 *  - bliss clustom modules
 *  - umount:     umountVfs, this.umountFs
 */


import { IRemix, IDistro, INet } from '../interfaces/index.js'
import Settings from '../classes/settings.js'

import React from 'react';
import { render, RenderOptions, Box, Text } from 'ink'
import Install from '../components/install.js'
import Finished from '../components/finished.js'

import fs from 'fs'
import yaml from 'js-yaml'
import shx from 'shelljs'

import { installer } from '../classes/incubation/installer.js'
import CliAutologin from '../classes/cli-autologin.js'
import Distro from '../classes/distro.js'
import Pacman from '../classes/pacman.js'
import Utils from '../classes/utils.js'
import Xdg from '../classes/xdg.js';

import { IInstaller, IDevices, IDevice } from '../interfaces/index.js'
import { ICalamaresModule, ILocation, IKeyboard, IPartitions, IUsers } from '../interfaces/i-krill.js'
import { exec } from '../lib/utils.js'

// import krill modules
import partition from './modules/partition.js'
import { mountFs, umountFs } from './modules/mount-fs.js'
import { mountVfs, umountVfs } from './modules/mount-vfs.js'
import unpackfs from './modules/unpackfs.js'
import machineId from './modules/machine-id.js'
import fstab from './modules/fstab.js'
import locale from './modules/locale.js'
import mKeyboard from './modules/m-keyboard.js'
import localeCfg from './modules/locale-cfg.js'
// users
import addUser from './modules/add-user.js'
import changePassword from './modules/change-password.js'
// displaymanager: autologin
import networkCfg from './modules/network-cfg.js'
// hwclock:
// services-systemd:
// bootloader-config
import bootloaderConfig from './modules/bootloader-config.js'
import grubcfg from './modules/grubcfg.js'
import bootloader from './modules/bootloader.js'
import packages from './modules/packages.js'
import removeInstallerLink from './modules/remove-installer-link.js'
import initramfsCfg from './modules/initramfs-cfg.js'
import initramfs from './modules/initramfs.js'
import delLiveUser from './modules/del-live-user.js'
// umount already imported

// to order in same wat
import umount from './modules/umount.js'
import mkfs from './modules/mkfs.js'
import hostname from './modules/hostname.js'

import CFS from '../classes/cfs.js'
import Title from '../components/title.js'

import cliCursor from 'cli-cursor'
import { spawnSync } from 'child_process';

/**
 * hatching: installazione o cova!!!
 */
export default class Sequence {
   public partition = partition
   // mount
   public mountFs = mountFs
   public mountVfs = mountVfs
   //
   public unpackfs = unpackfs
   public machineId = machineId
   public fstab = fstab
   public locale = locale
   public keyboard = mKeyboard
   public localeCfg = localeCfg
   // users
   public addUser = addUser
   public changePassword = changePassword
   // displaumanager: autologin
   public networkCfg = networkCfg
   // hwclock:
   // services-systemd:
   // bootloader-config
   public bootloaderConfig = bootloaderConfig
   //
   public grubcfg = grubcfg
   public bootloader = bootloader
   public packages = packages
   public removeInstallerLink = removeInstallerLink
   // luksbootkeyfile:
   // plymouthcfg;
   public initramfsCfg = initramfsCfg
   public initramfs = initramfs
   public delLiveUser = delLiveUser
   public umountFs = umountFs
   public umountVfs = umountVfs
   // to order in same way
   public umount = umount
   public mkfs = mkfs
   public hostname = hostname


   installer = {} as IInstaller

   installTarget = '/tmp/calamares-krill-root'

   verbose = false

   echo = {}

   efi = false

   devices = {} as IDevices

   users = {} as IUsers

   network = {} as INet

   partitions = {} as IPartitions

   language = ''

   region = ''

   zone = ''

   keyboardModel = ''

   keyboardLayout = ''

   keyboardVariant = ''

   toNull = ' > /dev/null 2>&1'

   settings = {} as Settings

   remix = {} as IRemix

   distro = {} as IDistro

   // Crypted Clone
   luksName = 'luks-volume'

   luksFile = ``

   luksDevice = `/dev/mapper/${this.luksName}`

   luksMountpoint = `/mnt`

   // Clone (Uncrypted)
   is_clone = fs.existsSync('penguins-eggs.d/is_clone')

   is_crypted_clone = fs.existsSync('/etc/penguins-eggs.d/is_crypted_clone')

   unattended = false

   nointeractive = false

   chroot = false

   halt = false

   cliAutologin = new CliAutologin()


   /**
    * constructor
    */
   constructor(location: ILocation, keyboard: IKeyboard, partitions: IPartitions, users: IUsers, network: INet) {

      this.installer = installer()
      this.settings = new Settings()

      this.language = location.language
      this.region = location.region
      this.zone = location.zone

      this.keyboardModel = keyboard.keyboardModel
      this.keyboardLayout = keyboard.keyboardLayout
      this.keyboardVariant = keyboard.keyboardVariant

      this.network = network

      this.partitions = partitions

      this.users = users

      this.devices.efi = {} as IDevice
      this.devices.boot = {} as IDevice
      this.devices.root = {} as IDevice
      this.devices.data = {} as IDevice
      this.devices.swap = {} as IDevice

      this.distro = new Distro()
      this.efi = fs.existsSync('/sys/firmware/efi/efivars')
      this.luksFile = `${this.distro.liveMediumPath}live/${this.luksName}`
   }

   /**
    * install
    * @param verbose
    * @param umount
    * @returns
    */
   async start(domain = '', unattended = false, nointeractive = false, chroot = false, halt = false, verbose = false) {

      // Imposta il domain per flag
      if (domain !== '') {
         if (domain.at(0) !== '.') {
            domain = '.' + domain
         }
         this.network.domain = domain
      }

      /**
       * To let krill to work with Arch we need:
       */
      if (this.distro.familyId === 'archlinux') {
         if (this.distro.distroId === 'ManjaroLinux') {
            await exec(`sudo ln -s /run/miso/bootmnt/live/ /live`)
         } else {
            await exec(`sudo ln -s /run/archiso/bootmnt/live/ /live`)
         }
      }

      this.unattended = unattended
      this.nointeractive = nointeractive
      this.chroot = chroot
      this.halt = halt

      this.verbose = verbose
      this.echo = Utils.setEcho(this.verbose)
      if (this.verbose) {
         this.toNull = ''
      }

      // start
      await this.settings.load()

      // partition
      let percent = 0.0
      let message = ""
      let isPartitioned = false

      message = "Creating partitions"
      percent = 0.03
      try {
         await redraw(<Install message={message} percent={percent} />)
         isPartitioned = await this.partition()
      } catch (error) {
         console.log(JSON.stringify(error))
      }
      if (this.verbose) await Utils.pressKeyToExit(message)

      if (isPartitioned) {

         // formatting
         message = "Formatting file system "
         percent = 0.06
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.mkfs()
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // mountFs
         message = "Mounting target file system "
         percent = 0.09
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.mountFs()
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         await sleep(500) // diamo il tempo di montare
         if (this.verbose) await Utils.pressKeyToExit(message)

         // mountVfs
         message = "Mounting on target VFS "
         percent = 0.12
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.mountVfs()
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // unpackfs
         message = "Unpacking filesystem "
         percent = 0.15
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.unpackfs()
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // dpkg-unsafe-io
         if (this.distro.familyId === 'debian') {
            message = "dpkg-unsafe-io"
            percent = 0.40
            try {
               await redraw(<Install message={message} percent={percent} />)
               await this.execCalamaresModule('dpkg-unsafe-io')
            } catch (error) {
               console.log(JSON.stringify(error))
            }
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // sources-yolk
         if (this.distro.familyId === 'debian') {
            message = 'sources-yolk'
            percent = 0.43
            try {
               await redraw(<Install message={message} percent={percent} spinner={true} />)
               await this.execCalamaresModule('sources-yolk')
            } catch (error) {
               console.log(JSON.stringify(error))
            }
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // machineid
         message = 'machineid'
         percent = 0.46
         try {
            await redraw(<Install message={message} percent={percent} spinner={true} />)
            await this.machineId()
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // fstab
         message = "Creating fstab "
         percent = 0.49
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.fstab(this.partitions.installationDevice)
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         /**
          * CryptedClone exec eggs syncfrom
          */
         if (this.is_crypted_clone) {
            message = "Restore private data from crypted clone "
            if (fs.existsSync(this.luksFile)) {
               percent = 0.55
               let cmd = `eggs syncfrom --rootdir /tmp/calamares-krill-root/ --file ${this.luksFile}`
               try {
                  await redraw(<Install message={message} percent={percent} spinner={true} />)
                  await exec(cmd, Utils.setEcho(true))
                  this.is_clone = true // Adesso è un clone
               } catch (error) {
                  console.log(JSON.stringify(error))
               }
            } else {
               await Utils.pressKeyToExit(`Cannot find luks-volume file ${this.luksFile}`)
            }
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // networkcfg
         message = "networkcfg"
         percent = 0.61
         try {
            await this.networkCfg()
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // hostname
         message = "Create hostname "
         percent = 0.64
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.hostname(this.network.domain)
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // dpkg-unsafe-io-undo
         if (this.distro.familyId === 'debian') {
            message = "dpkg-unsafe-io-undo"
            percent = 0.65
            try {
               await redraw(<Install message={message} percent={percent} />)
               await this.execCalamaresModule('dpkg-unsafe-io-undo')
            } catch (error) {
               console.log(JSON.stringify(error))
            }
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         /**
          * IF NOT CLONE:
          * - locale
          * - keyboard
          * - localeCfg
          * - delLiveUser
          * - adduser
          * - autologin 
          */
         if (!this.is_clone) {
            // locale
            message = "Locale"
            percent = 0.70
            try {
               redraw(<Install message={message} percent={percent} />)
               if (this.distro.familyId !== 'fedora') {
                  await this.locale()
               }
            } catch (error) {
               console.log(JSON.stringify(error))
            }
            if (this.verbose) await Utils.pressKeyToExit(message)

            // keyboard
            message = "settings keyboard"
            percent = 0.71
            try {
               await this.keyboard()
            } catch (error) {
               console.log(JSON.stringify(error))
            }
            if (this.verbose) await Utils.pressKeyToExit(message)

            // localeCfg: no alpine, no fedora
            if (this.distro.familyId === 'debian' || this.distro.familyId === 'archlinux') {
               message = "Locale Configuration"
               percent = 0.72
               try {
                  await this.localeCfg()
                  await exec("chroot " + this.installTarget + " locale-gen")
               }
               catch (error) {
                  console.log(JSON.stringify(error))
               }
            }
            if (this.verbose) await Utils.pressKeyToExit(message)

            // delLiveUser
            message = "Remove user LIVE"
            percent = 0.73
            try {
               await redraw(<Install message={message} percent={percent} />)
               await this.delLiveUser()
            } catch (error) {
               console.log(JSON.stringify(error))
            }
            if (this.verbose) await Utils.pressKeyToExit(message)

            // addUser
            message = "Add user"
            percent = 0.74
            try {
               await redraw(<Install message={message} percent={percent} />)
               await this.addUser(this.users.username, this.users.password, this.users.fullname, '', '', '')
            } catch (error) {
               console.log(JSON.stringify(error))
            }
            if (this.verbose) await Utils.pressKeyToExit(message)

            // changePassword root
            message = "Add root password"
            percent = 0.75
            try {
               await redraw(<Install message={message} percent={percent} />)
               await this.changePassword('root', this.users.rootPassword)
            } catch (error) {
               console.log(JSON.stringify(error))
            }
            if (this.verbose) await Utils.pressKeyToExit(message)

            // autologin GUI
            if (Pacman.isInstalledGui()) {
               try {
                  message = "Autologin GUI"
                  percent = 0.78
                  if (this.users.autologin) {
                     await Xdg.autologin(await Utils.getPrimaryUser(), this.users.username, this.installTarget)
                     if (this.distro.distroLike === 'Arch') {
                        await exec(`chroot ${this.installTarget} groupadd autologin`)
                        await exec(`chroot ${this.installTarget} gpasswd -a ${this.users.username} autologin`)
                     }
                  }
                  await redraw(<Install message={message} percent={percent} />)
               } catch (error) {
                  console.log(JSON.stringify(error))
               }
            }
            if (this.verbose) await Utils.pressKeyToExit(message)

         } // IF NOT CLONE END

         // Remove ALWAYS autologin CLI
         message = "Remove autologin CLI"
         percent = 0.80
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.cliAutologin.remove(this.installTarget)
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // bootloader-config
         message = "bootloader-config "
         percent = 0.81
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.bootloaderConfig()
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // grubcfg
         message = "grubcfg "
         percent = 0.82
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.grubcfg()
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // bootloader (grub-install)
         message = "bootloader "
         percent = 0.83
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.bootloader()
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)


         // sources-yolk-undo
         if (this.distro.familyId === 'debian') {
            message = "sources-yolk-undo"
            percent = 0.84
            try {
               await redraw(<Install message={message} percent={percent} />)
               await this.execCalamaresModule('sources-yolk-undo')
            } catch (error) {
               console.log(JSON.stringify(error))
            }
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // packages
         message = "add/remove same packages"
         percent = 0.85
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.packages()
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // initramfsCfg
         message = "initramfs configure"
         percent = 0.86
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.initramfsCfg(this.partitions.installationDevice)
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // initramfs
         message = "initramfs "
         percent = 0.87
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.initramfs()
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         /**
          *
          * remove CLI/GUI installer link
          */
         message = "remove GUI installer link"
         percent = 0.88
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.removeInstallerLink()
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // remove /etc/penguins_eggs.d/is_clone*
         message = "Cleanup"
         percent = 0.89
         try {
            await redraw(<Install message={message} percent={percent} />)
            await exec(`rm -f ${this.installTarget}/etc/penguins-eggs.d/is_clone`)
            await exec(`rm -f ${this.installTarget}/etc/penguins-eggs.d/is_crypted_clone`)
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         /**
          * custom final steps
          */
         const cfs = new CFS()
         const steps = await cfs.steps()
         if (steps.length > 0) {
            for (const step of steps) {
               message = `running ${step}`
               percent = 0.90
               try {
                  await redraw(<Install message={message} percent={percent} />)
                  await this.execCalamaresModule(step)
               } catch (error) {
                  console.log(JSON.stringify(error))
               }
            }
            if (this.verbose) await Utils.pressKeyToExit(message)
         }

         // chroot
         if (chroot) {
            message = `You are in chroot mode under ${this.installTarget}, type "exit" to exit.`
            percent = 0.95
            try {
               await redraw(
                  <>
                     <Title />
                     <Box>
                        <Text>{message}</Text>
                     </Box>
                  </>
               )
               cliCursor.show()
               await exec(`chroot ${this.installTarget} /bin/bash`)
               cliCursor.hide()
            } catch (error) {
               console.log(JSON.stringify(error))
            }
         }
         if (this.verbose) await Utils.pressKeyToExit(message)


         // umountVfs
         message = "umount VFS"
         percent = 0.96
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.umountVfs()
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         message = "umount"
         percent = 0.97
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.umountFs()
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

         // finished
         message = "finished"
         percent = 100.0
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.finished()
         } catch (error) {
            console.log(JSON.stringify(error))
         }
         if (this.verbose) await Utils.pressKeyToExit(message)

      }
   }



   /**
    *
    */
   async execCalamaresModule(name: string) {
      const moduleName = this.installer.multiarchModules + name + '/module.desc'
      if (fs.existsSync(moduleName)) {
         const calamaresModule = yaml.load(fs.readFileSync(moduleName, 'utf8')) as ICalamaresModule
         let command = calamaresModule.command
         if (command !== '' || command !== undefined) {
            command += this.toNull
            await exec(command, this.echo)
         }
      }
   }

   /**
    * only show the result
    */
   async finished() {
      let cmd = "reboot"
      if (this.halt) {
         cmd = "poweroff"
      }

      let message = `Press a key to ${cmd}`
      if (this.unattended && this.nointeractive) {
         message = `System will ${cmd} in 5 seconds...`
      }

      await redraw(<Finished installationDevice={this.partitions.installationDevice} hostName={this.users.hostname} userName={this.users.username} />)

      if (this.unattended && this.nointeractive) {
         await sleep(5000)
         await exec(cmd, { echo: false })
      } else {
         spawnSync('read _ ', { shell: true, stdio: [0, 1, 2] })
         await exec(cmd, { echo: false })
      }
   }
}

/**
 *
 * @param elem
 */
async function redraw(elem: JSX.Element) {
   let opt: RenderOptions = {}
   opt.patchConsole = false
   opt.debug = false
   console.clear()
   render(elem, opt)
}

/**
 *
 * @param ms
 * @returns
 */
function sleep(ms = 0) {
   return new Promise((resolve) => {
      setTimeout(resolve, ms);
   });
}

/**
 * 
 * @param message 
 */
async function emergencyShell(message: string) {
   message = message + `type "exit" to exit.`
   try {
      await redraw(
         <>
            <Title />
            <Box>
               <Text>{message}</Text>
            </Box>
         </>
      )
      cliCursor.show()
      await exec("/bin/bash")
      cliCursor.hide()
   } catch (error) {
      await Utils.pressKeyToExit(JSON.stringify(error))
   }
}

