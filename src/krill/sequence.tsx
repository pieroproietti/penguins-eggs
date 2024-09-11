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

      let percent = 0
      let message = ""
      let isPartitioned = false

      message = "Creating partitions"
      percent = 0.03
      let currErr = ''
      await redraw(<Install message={message} percent={0} />)
      try {
         isPartitioned = await this.partition()
         sleep(50)
      } catch (error) {
         showProblem(message, JSON.stringify(error))
      }

      if (isPartitioned) {
         // formatting
         message = "Formatting file system "
         await redraw(<Install message={message} percent={6} />)
         try {
            await this.mkfs()
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         // mountFs
         message = "Mounting target file system "
         redraw(<Install message={message} percent={9} />)
         try {
            await this.mountFs()
            await sleep(500) // diamo il tempo di montare
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         // mountVfs
         message = "Mounting on target VFS "
         await redraw(<Install message={message} percent={12} />)
         try {
            await this.mountVfs()
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         // unpackfs
         message = "Unpacking filesystem "
         await redraw(<Install message={message} percent={15} />)
         try {
            await this.unpackfs()
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         // dpkg-unsafe-io
         if (this.distro.familyId === 'debian') {
            message = "dpkg-unsafe-io"
            await redraw(<Install message={message} percent={40} />)
            try {
               await this.execCalamaresModule('dpkg-unsafe-io')
               sleep(50)
            } catch (error) {
               showProblem(message, JSON.stringify(error))
            }
         }


         // sources-yolk
         if (this.distro.familyId === 'debian') {
            message = 'sources-yolk'
            await redraw(<Install message={message} percent={43} />)
            try {
               await this.execCalamaresModule('sources-yolk')
            } catch (error) {
               showProblem(message, JSON.stringify(error))
            }
         }


         // machineid
         message = 'machineid'
         await redraw(<Install message={message} percent={46} />)
         try {
            await this.machineId()
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         // fstab
         message = "Creating fstab "
         await redraw(<Install message={message} percent={49} />)
         try {
            await this.fstab(this.partitions.installationDevice)
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         /**
          * IF CryptedClone
          */
         if (this.is_crypted_clone) {
            message = "Restore private data from crypted clone "
            await redraw(<Install message={message} percent={55} />)
            if (fs.existsSync(this.luksFile)) {
               let cmd = `eggs syncfrom --rootdir /tmp/calamares-krill-root/ --file ${this.luksFile}`
               try {
                  await exec(cmd, Utils.setEcho(true))
                  this.is_clone = true // Adesso è un clone
               } catch (error) {
                  showProblem(message, JSON.stringify(error))
               }
            } else {
               await Utils.pressKeyToExit(`Cannot find luks-volume file ${this.luksFile}`)
            }
         }
         // END CryptedClone


         // networkcfg
         message = "Network configuration"
         await redraw(<Install message={message} percent={61} />)
         try {
            await this.networkCfg()
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }

         // hostname
         message = "Create hostname "
         await redraw(<Install message={message} percent={64} />)
         try {
            await this.hostname(this.network.domain)
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         // dpkg-unsafe-io-undo
         if (this.distro.familyId === 'debian') {
            message = "dpkg-unsafe-io-undo"
            await redraw(<Install message={message} percent={65} />)
            try {
               await this.execCalamaresModule('dpkg-unsafe-io-undo')
               sleep(50)
            } catch (error) {
               showProblem(message, JSON.stringify(error))
            }
         }


         /**
          * IF NOT CLONE:
          */
         if (!this.is_clone) {

            // locale Alpine, archlinux, Debian
            message = "Locale"
            redraw(<Install message={message} percent={70} />)
            if (this.distro.familyId === 'alpine' ||
               this.distro.familyId === 'archlinux' ||
               this.distro.familyId === 'debian') {
               try {
                  await this.locale()
                  sleep(50)
               } catch (error) {
                  showProblem(message, JSON.stringify(error))
               }
            }


            // keyboard
            message = "Settings keyboard"
            redraw(<Install message={message} percent={71} />)
            try {
               await this.keyboard()
               sleep(50)
            } catch (error) {
               showProblem(message, JSON.stringify(error))
            }


            // localeCfg: solo Debian 
            if (this.distro.familyId === 'archlinux' || this.distro.familyId === 'debian') {
               message = "Locale Configuration"
               redraw(<Install message={message} percent={72} />)
               try {
                  await this.localeCfg()
                  await exec("chroot " + this.installTarget + " locale-gen")
                  sleep(50)
               }
               catch (error) {
                  showProblem(message, JSON.stringify(error))
               }
            }


            // delLiveUser
            message = "Remove live user"
            await redraw(<Install message={message} percent={73} />)
            try {
               await this.delLiveUser()
               sleep(50)
            } catch (error) {
               showProblem(message, JSON.stringify(error))
            }


            // addUser
            message = `Add user ${this.users.username}`
            await redraw(<Install message={message} percent={74} />)
            try {
               await this.addUser(this.users.username, this.users.password, this.users.fullname, '', '', '')
               sleep(50)
            } catch (error) {
               showProblem(message, JSON.stringify(error))
            }


            // changePassword root
            message = "Add root password"
            await redraw(<Install message={message} percent={75} />)
            try {
               await this.changePassword('root', this.users.rootPassword)
               sleep(50)
            } catch (error) {
               showProblem(message, JSON.stringify(error))
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
                        sleep(50)
                     }
                  }
               } catch (error) {
                  showProblem(message, JSON.stringify(error))
               }
            }
         } // IF NOT CLONE END


         // Remove ALWAYS autologin CLI
         message = "Remove autologin CLI"
         await redraw(<Install message={message} percent={80} />)
         try {
            await this.cliAutologin.remove(this.installTarget)
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         // bootloader-config
         message = "bootloader-config "
         await redraw(<Install message={message} percent={81} />)
         try {
            await this.bootloaderConfig()
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         // grubcfg
         message = "grubcfg "
         await redraw(<Install message={message} percent={82} />)
         try {
            await this.grubcfg()
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         // bootloader (grub-install)
         message = "bootloader "
         await redraw(<Install message={message} percent={83} />)
         try {
            await this.bootloader()
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         // sources-yolk-undo
         if (this.distro.familyId === 'debian') {
            message = "sources-yolk-undo"
            await redraw(<Install message={message} percent={84} />)
            try {
               await this.execCalamaresModule('sources-yolk-undo')
               sleep(50)
            } catch (error) {
               showProblem(message, JSON.stringify(error))
            }
         }


         // packages
         message = "add/remove same packages"
         await redraw(<Install message={message} percent={85} />)
         try {
            await this.packages()
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         // initramfsCfg
         message = "initramfs configure"
         await redraw(<Install message={message} percent={86} />)
         try {
            await this.initramfsCfg(this.partitions.installationDevice)
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         // initramfs
         message = "initramfs "
         await redraw(<Install message={message} percent={87} />)
         try {
            await this.initramfs()
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         /**
          *
          * remove CLI/GUI installer link
          */
         message = "remove GUI installer link"
         await redraw(<Install message={message} percent={88} />)
         try {
            await this.removeInstallerLink()
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         // remove /etc/penguins_eggs.d/is_clone*
         message = "Cleanup"
         await redraw(<Install message={message} percent={89} />)
         try {
            await exec(`rm -f ${this.installTarget}/etc/penguins-eggs.d/is_clone`)
            await exec(`rm -f ${this.installTarget}/etc/penguins-eggs.d/is_crypted_clone`)
            sleep(50)
         } catch (error) {
            showProblem(message, JSON.stringify(error))
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
                  sleep(50)
               } catch (error) {
                  showProblem(message, JSON.stringify(error))
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
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         message = "umount"
         await redraw(<Install message={message} percent={97} />)
         try {
            await this.umountFs()
         } catch (error) {
            showProblem(message, JSON.stringify(error))
         }


         // finished
         message = "finished"
         await redraw(<Install message={message} percent={100} />)
         try {
            await this.finished()
         } catch (error) {
            showProblem(message, JSON.stringify(error))
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
async function showProblem(message: string, currErr: string) {
   if (currErr !== '') {
      message = `You are after ${message}, error: ${currErr}`
      try {
         await redraw(
            <>
               <Title />
               <Box>
                  <Text>You are after {message}</Text>
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
}
