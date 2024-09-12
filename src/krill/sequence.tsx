/**
 * ./src/krill/sequence.tsx
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
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

// to order in same way
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

      let message = ""
      let minSleep = 10
      let isPartitioned = false

      message = "Creating partitions"
      let currErr = ''
      await redraw(<Install message={message} percent={0} />)
      try {
         isPartitioned = await this.partition()
         sleep(minSleep)
      } catch (error) {
         showProblem(message, error)
      }

      if (isPartitioned) {
         // formatting
         message = "Formatting file system "
         await redraw(<Install message={message} percent={6} />)
         try {
            await this.mkfs()
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         // mountFs
         message = "Mounting target file system "
         redraw(<Install message={message} percent={9} />)
         try {
            await this.mountFs()
            await sleep(500) // diamo il tempo di montare
         } catch (error) {
            showProblem(message, error)
         }

         // mountVfs
         message = "Mounting on target VFS "
         await redraw(<Install message={message} percent={12} />)
         try {
            await this.mountVfs()
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         // unpackfs
         message = "Unpacking filesystem "
         await redraw(<Install message={message} percent={15} />)
         try {
            await this.unpackfs()
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         // dpkg-unsafe-io
         if (this.distro.familyId === 'debian') {
            message = "dpkg-unsafe-io"
            await redraw(<Install message={message} percent={40} />)
            sleep(minSleep)
            try {
               await this.execCalamaresModule('dpkg-unsafe-io')
               sleep(minSleep)
            } catch (error) {
               showProblem(message, error)
            }
         }


         // sources-yolk
         if (this.distro.familyId === 'debian') {
            message = 'sources-yolk'
            await redraw(<Install message={message} percent={43} />)
            try {
               await this.execCalamaresModule('sources-yolk')
               sleep(minSleep)
            } catch (error) {
               showProblem(message, error)
            }
         }


         // machineid
         message = 'machineid'
         await redraw(<Install message={message} percent={46} />)
         try {
            await this.machineId()
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         // fstab
         message = "Creating fstab "
         await redraw(<Install message={message} percent={49} />)
         try {
            await this.fstab(this.partitions.installationDevice)
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         /**
          * CryptedClone exec eggs syncfrom
          */
         if (this.is_crypted_clone) {
            message = "Restore private data from crypted clone "
            await redraw(<Install message={message} percent={55} />)
            if (fs.existsSync(this.luksFile)) {
               let cmd = `eggs syncfrom --rootdir /tmp/calamares-krill-root/ --file ${this.luksFile}`
               try {
                  await exec(cmd, Utils.setEcho(true))
                  this.is_clone = true // Adesso è un clone
                  sleep(minSleep)
               } catch (error) {
                  showProblem(message, error)
               }
            } else {
               await Utils.pressKeyToExit(`Cannot find luks-volume file ${this.luksFile}`)
            }
         }

         // networkcfg
         message = "Network configuration"
         await redraw(<Install message={message} percent={61} />)
         try {
            await this.networkCfg()
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }

         // hostname
         message = "Create hostname "
         await redraw(<Install message={message} percent={64} />)
         try {
            await this.hostname(this.network.domain)
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         // dpkg-unsafe-io-undo
         if (this.distro.familyId === 'debian') {
            message = "dpkg-unsafe-io-undo"
            await redraw(<Install message={message} percent={65} />)
            try {
               await this.execCalamaresModule('dpkg-unsafe-io-undo')
               sleep(minSleep)
            } catch (error) {
               showProblem(message, error)
            }
         }


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
            redraw(<Install message={message} percent={70} />)
            try {
               if (this.distro.familyId === 'alpine' ||
                  this.distro.familyId === 'archlinux' ||
                  this.distro.familyId === 'debian') {
                  await this.locale()
                  sleep(minSleep)
               }
            } catch (error) {
               showProblem(message, error)
            }


            // keyboard
            message = "Settings keyboard"
            redraw(<Install message={message} percent={71} />)
            try {
               await this.keyboard()
               sleep(minSleep)
            } catch (error) {
               showProblem(message, error)
            }


            // localeCfg: no alpine, no fedora
            if (this.distro.familyId === 'archlinux' || this.distro.familyId === 'debian') {
               message = "Locale Configuration"
               redraw(<Install message={message} percent={72} />)
               try {
                  await this.localeCfg()
                  await exec("chroot " + this.installTarget + " locale-gen")
                  sleep(minSleep)
               }
               catch (error) {
                  showProblem(message, error)
               }
            }


            // delLiveUser
            message = "Remove live user"
            await redraw(<Install message={message} percent={73} />)
            try {
               await this.delLiveUser()
               sleep(minSleep)
            } catch (error) {
               showProblem(message, error)
            }


            // addUser
            message = `Add user ${this.users.username}`
            await redraw(<Install message={message} percent={74} />)
            try {
               await this.addUser(this.users.username, this.users.password, this.users.fullname, '', '', '')
               sleep(minSleep)
            } catch (error) {
               showProblem(message, error)
            }


            // changePassword root
            message = "Add root password"
            await redraw(<Install message={message} percent={75} />)
            try {
               await this.changePassword('root', this.users.rootPassword)
               sleep(minSleep)
            } catch (error) {
               showProblem(message, error)
            }


            // autologin GUI
            if (Pacman.isInstalledGui()) {
               try {
                  message = "Autologin GUI"
                  await redraw(<Install message={message} percent={78} />)
                  if (this.users.autologin) {
                     await Xdg.autologin(await Utils.getPrimaryUser(), this.users.username, this.installTarget)
                     if (this.distro.distroLike === 'Arch') {
                        await exec(`chroot ${this.installTarget} groupadd autologin`)
                        await exec(`chroot ${this.installTarget} gpasswd -a ${this.users.username} autologin`)
                        sleep(minSleep)
                     }
                  }
               } catch (error) {
                  showProblem(message, error)
               }
            }
         } // IF NOT CLONE END

         // Remove ALWAYS autologin CLI
         message = "Remove autologin CLI"
         await redraw(<Install message={message} percent={80} />)
         try {
            await this.cliAutologin.remove(this.installTarget)
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         // bootloader-config
         message = "bootloader-config "
         await redraw(<Install message={message} percent={81} />)
         try {
            await this.bootloaderConfig()
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         // grubcfg
         message = "grubcfg "
         await redraw(<Install message={message} percent={82} />)
         try {
            await this.grubcfg()
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         // bootloader (grub-install)
         message = "bootloader "
         await redraw(<Install message={message} percent={83} />)
         try {
            await this.bootloader()
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         // sources-yolk-undo
         if (this.distro.familyId === 'debian') {
            message = "sources-yolk-undo"
            await redraw(<Install message={message} percent={84} />)
            try {
               await this.execCalamaresModule('sources-yolk-undo')
               sleep(minSleep)
            } catch (error) {
               showProblem(message, error)
            }
         }


         // packages
         message = "add/remove same packages"
         await redraw(<Install message={message} percent={85} />)
         try {
            await this.packages()
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         // initramfsCfg
         message = "initramfs configure"
         await redraw(<Install message={message} percent={86} />)
         try {
            await this.initramfsCfg(this.partitions.installationDevice)
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         // initramfs
         message = "initramfs "
         await redraw(<Install message={message} percent={87} />)
         try {
            await this.initramfs()
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         /**
          *
          * remove CLI/GUI installer link
          */
         message = "remove GUI installer link"
         await redraw(<Install message={message} percent={88} />)
         try {
            await this.removeInstallerLink()
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         // remove /etc/penguins_eggs.d/is_clone*
         message = "Cleanup"
         await redraw(<Install message={message} percent={89} />)
         try {
            await exec(`rm -f ${this.installTarget}/etc/penguins-eggs.d/is_clone`)
            await exec(`rm -f ${this.installTarget}/etc/penguins-eggs.d/is_crypted_clone`)
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         /**
          * custom final steps
          */
         const cfs = new CFS()
         const steps = await cfs.steps()
         if (steps.length > 0) {
            for (const step of steps) {
               message = `running ${step}`
               await redraw(<Install message={message} percent={90} />)
               try {
                  await this.execCalamaresModule(step)
                  sleep(minSleep)
               } catch (error) {
                  showProblem(message, error)
               }
            }

         }

         // chroot
         if (chroot) {
            message = `You are in chroot mode under ${this.installTarget}, type "exit" to exit.`
            await emergencyShell(message)
         }


         // umountVfs
         message = "umount VFS"
         await redraw(<Install message={message} percent={96} />)
         try {
            await this.umountVfs()
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         message = "umount"
         await redraw(<Install message={message} percent={97} />)
         try {
            await this.umountFs()
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }


         // finished
         message = "finished"
         await redraw(<Install message={message} percent={99} />)
         try {
            await this.finished()
            sleep(minSleep)
         } catch (error) {
            showProblem(message, error)
         }
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

      await redraw(<Finished 
                        installationDevice={this.partitions.installationDevice} 
                        hostName={this.users.hostname} 
                        userName={this.users.username}
                        message={message} />)

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


/**
 * 
 * @param message 
 */
async function showProblem(message: string, currErr: any) {
   message = `We was on "${message}", get error: ${JSON.stringify(currErr)}, type "exit" to exit from krill emergency shell.`
   try {
      await redraw(
         <>
            <Title />
            <Box>
               <Text>{message}</Text>
            </Box>
            <Box>
               <Text>Error: {currErr}</Text>
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
