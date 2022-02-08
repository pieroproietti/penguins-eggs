/**
 * penguins-eggs: hatching.js
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */

/**
 * Ideally, I want to respect this schema
      - partition
      - mount
      - unpackfs
      - sources-yolk
      - machineid // to do
      - fstab
      - locale // to do
      - keyboard
      - localecfg // to do
      - users // rivedere
      - displaymanager // autologin
      - networkcfg 
      - hwclock // to do
      - services-systemd // to do
      - bootloader-config // compatible calamares-module bootloader-config
      - grubcfg // 
      - bootloader // compatible calamares-module calamares-modules grubInstall
      - packages // to do
      - luksbootkeyfile // to do
      - plymouthcfg // to do
      - initramfscfg OK
      - initramfs OK
      - removeuser 
      - remove-link // OK
      - sources-yolk-unmount // compatible calamares-modules sources-yolk-unmount
      - umount
 */


import { IRemix, IDistro, INet } from '../interfaces'
import Settings from './settings'

import React from 'react';
import { render, RenderOptions } from 'ink'
import Install from '../components/install'
import Finished from '../components/finished'

import fs from 'fs'
import yaml from 'js-yaml'
import shx = require('shelljs')
import Utils from './utils'
import cliAutologin = require('../lib/cli-autologin')

import Pacman from './pacman';
import { installer } from './incubation/installer'
import Xdg from './xdg';
import Distro from './distro';

import { IInstaller, IDevices, IDevice } from '../interfaces'
import { ICalamaresModule, ILocation, IKeyboard, IPartitions, IUsers } from '../interfaces/i-krill'
import { execSync } from 'child_process'
import {exec} from'../lib/utils'

/**
 * hatching: installazione o cova!!!
 */
export default class Hatching {

   installer = {} as IInstaller

   installTarget = '/tmp/calamares-krill-root'

   verbose = false

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

   luksName = ''
   luksFile = ''
   luksDevice = ''
   luksMountpoint = ''

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

      this.distro = new Distro(this.remix)

      this.efi = fs.existsSync('/sys/firmware/efi/efivars')

      // Per il restore dei dati
      this.luksName = 'luks-eggs-backup'
      this.luksFile = `/run/live/medium/live/${this.luksName}`
      this.luksDevice = `/dev/mapper/${this.luksName}`
      this.luksMountpoint = `/mnt`
   
   }

   /**
    * install
    * @param verbose 
    * @param umount 
    * @returns 
    */
   async install(verbose = false) {
      this.verbose = verbose

      await this.settings.load()

      let percent = 0.0
      let message = ""

      if (await this.partition()) {

         message = "Formatting file system "
         percent = 0.01
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.mkfs()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)

         // mount
         message = "Mounting target file system "
         percent = 0.03
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.mount()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)

         // mountvfs
         message = "Mounting target file system vfs "
         percent = 0.06
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.mountvfs()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)


         // unpackfs
         message = "Unpacking filesystem "
         percent = 0.10
         try {
            redraw(<Install message={message} percent={percent} spinner={true} />)
            await this.unpackfs()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)

         /*
         message = "Syncronize filesystem "
         percent = 0.35
         try {
            redraw(<Install message={message} percent={percent} spinner={true} />)
            await this.syncfs()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         */

         /**
          * RESTORE USERS DATA
          */

         if (fs.existsSync(this.luksFile)) {
            message = "Restore private data from backup "
            percent = 0.37
            try {
               redraw(<Install message={message} percent={percent} spinner={true} />)
               await exec('eggs syncfrom --rootdir /tmp/calamares-krill-root/')
            } catch (error) {
               message += JSON.stringify(error)
               redraw(<Install message={message} percent={percent} />)
            }
            // await checkIt(message)
         }

         // sources-yolk
         message = 'sources-yolk'
         percent = 0.40
         try {
            redraw(<Install message={message} percent={percent} spinner={true} />)
            await this.execCalamaresModule('sources-yolk')
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)


         message = "Setting time zone "
         percent = 0.43
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.setTimezone()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)


         message = "Creating fstab "
         percent = 0.47
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.fstab(this.partitions.installationDevice)
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)

         message = "settings keyboard "
         percent = 0.48
         try {
            this.setKeyboard()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)

         message = "networkcfg"
         percent = 0.50
         try {
            this.networkcfg()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)

         message = "Create hostname "
         percent = 0.53
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.hostname()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)

         message = "Creating hosts "
         percent = 0.60
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.hosts()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)


         message = "bootloader-config "
         percent = 0.63
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.execCalamaresModule('bootloader-config')
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)

         message = "bootloader "
         percent = 0.63
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.bootloader()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)


         message = "initramfs configure"
         percent = 0.65
         try {
            redraw(<Install message={message} percent={percent} />)
            this.initramfsCfg(this.partitions.installationDevice)
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)


         message = "initramfs "
         percent = 0.67
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.initramfs()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)

         message = "Removing user live "
         percent = 0.70
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.delLiveUser()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)


         /**
          * IF NOT RESTORE-USERS-ACCOUNTS
          * 
          * create user
          */
         if (!fs.existsSync(this.luksFile)) {
            message = "Adding user "
            percent = 0.73
            try {
               redraw(<Install message={message} percent={percent} />)
               await this.addUser(this.users.name, this.users.password, this.users.fullname, '', '', '')
            } catch (error) {
               message += JSON.stringify(error)
               redraw(<Install message={message} percent={percent} />)
            }
            // await checkIt(message)
         }

         message = "adding user password "
         percent = 0.77
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.changePassword('root', this.users.rootPassword)
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)

         if (Pacman.isInstalledGui()) {
            try {
               message = "autologin GUI"
               percent = 0.80
               await Xdg.autologin(Utils.getPrimaryUser(), this.users.name, this.installTarget)
               redraw(<Install message={message} percent={percent} />)
            } catch (error) {
               message += JSON.stringify(error)
               redraw(<Install message={message} percent={percent} />)
            }
         } else { // autologin CLI remove DEFAULT
            message = "autologin CLI"
            percent = 0.80
            try {
               redraw(<Install message={message} percent={percent} />)
               await cliAutologin.remove(this.installTarget)
            } catch (error) {
               message += JSON.stringify(error)
               redraw(<Install message={message} percent={percent} />)
            }
         }
         // eggs-cleanup forced
         await cliAutologin.msgRemove(`${this.installTarget}/etc/motd`)
         await cliAutologin.msgRemove(`${this.installTarget}/etc/issue`)
 
         // await checkIt(message)

         message = "remove installer"
         percent = 0.87
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.removeInstaller()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)


         message = "sources yolk unmount"
         percent = 0.92
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.execCalamaresModule('sources-yolk-unmount')
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)

         message = "umount"
         percent = 0.92
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.umountvfs()
            await this.umount()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
         // await checkIt(message)

         message = "finished"
         percent = 100.0
         try {
            redraw(<Install message={message} percent={percent} />)
            this.finished()
         } catch (error) {
            message += JSON.stringify(error)
            redraw(<Install message={message} percent={percent} />)
         }
      }
   }

   /**
    * setTimezone
    */
   private async setTimezone() {
      const echo = { echo: false, ignore: false }

      if (fs.existsSync('/etc/localtime')) {
         const cmd = `chroot ${this.installTarget} unlink /etc/localtime`
         await exec(cmd, echo)
      }
      const cmd = `chroot ${this.installTarget} ln -sf /usr/share/zoneinfo/${this.region}/${this.zone} /etc/localtime`
      await exec(cmd, echo)
   }

   /**
    *
    * @param name
    * @param password
    * @param fullName
    * @param roomNumber
    * @param workPhone
    * @param homePhone
    */
   private async addUser(name = 'live', password = 'evolution', fullName = '', roomNumber = '', workPhone = '', homePhone = ''): Promise<void> {
      const echo = { echo: false, ignore: false }

      const cmd = `chroot ${this.installTarget} \
adduser ${name} \
--home /home/${name} \
--shell /bin/bash \
--disabled-password \
--gecos "${fullName},${roomNumber},${workPhone},${homePhone}"`

      await exec(cmd, echo)

      await exec(`echo ${name}:${password} | chroot ${this.installTarget} chpasswd `, echo)

      await exec(`chroot ${this.installTarget} usermod -aG sudo ${name}`, echo)
   }

   /**
    * changePassword
    * @param name
    * @param newPassword
    */
   private async changePassword(name = 'live', newPassword = 'evolution') {
      const echo = Utils.setEcho(this.verbose)
      const cmd = `echo ${name}:${newPassword} | chroot ${this.installTarget} chpasswd `
      await exec(cmd, echo)
   }

   /**
    * delUser
    * va corretto con users.conf di calamares
    */
   async delLiveUser() {
      const echo = { echo: false, ignore: false }

      if (Utils.isLive()) {
         const user: string = this.settings.config.user_opt
         const cmd = `chroot ${this.installTarget} deluser --remove-home ${user}`
         await exec(cmd, echo)
      }
   }

   /**
    * grubInstall()
    * @param target
    * @param options
    */
   private async bootloader() {
      await exec('chroot ' + this.installTarget + ' grub-install ' + this.partitions.installationDevice) // + this.toNull
      await exec('chroot ' + this.installTarget + ' update-grub') // + this.toNull
      await exec('sleep 1')  // + this.toNull
   }

   /**
    * 
   */
   initramfsCfg(installDevice: string) {
      // userSwapChoices = ['none', 'small', 'suspend', 'file']

      const file = this.installTarget + '/etc/initramfs-tools/conf.d/resume'
      let text = ''
      if (this.partitions.userSwapChoice === 'none' || this.partitions.userSwapChoice === 'file') {
         text += '#RESUME=none\n'
      } else {
         text += 'RESUME=UUID=' + Utils.uuid(this.devices.swap.name)
      }
      Utils.write(file, text)
   }



   /**
    * initramfs()
    */
   private async initramfs() {
      const echo = { echo: false, ignore: false }
      await exec('chroot ' + this.installTarget + ' mkinitramfs -o ~/initrd.img-$(uname -r)', echo)
      await exec('chroot ' + this.installTarget + ' mv ~/initrd.img-$(uname -r) /boot', echo)
   }


   /**
    * fstab()
    * @param devices
    */
   private async fstab(installDevice: string) {

      const file = this.installTarget + '/etc/fstab'
      let mountOptsRoot = ''
      let mountOptsBoot = ''
      let mountOptsData = ``
      let mountOptsEfi = ''
      let mountOptsSwap = ''

      if (await this.isRotational(installDevice)) {
         mountOptsRoot = 'defaults,relatime 0 1'
         mountOptsBoot = 'defaults,relatime 0 1'
         mountOptsData = 'defaults,relatime 0 1'
         mountOptsEfi = 'defaults,relatime 0 2'
         mountOptsSwap = 'defaults,relatime 0 2'
      } else {
         mountOptsRoot = 'defaults,noatime 0 1'
         mountOptsBoot = 'defaults,noatime 0 1'
         mountOptsData = 'defaults,noatime 0 1'
         mountOptsEfi = 'defaults,noatime 0 2'
         mountOptsSwap = 'defaults,noatime 0 2'
      }
      let text = ''

      text += `# ${this.devices.root.name} ${this.devices.root.mountPoint} ${this.devices.root.fsType} ${mountOptsRoot}\n`
      text += `UUID=${Utils.uuid(this.devices.root.name)} ${this.devices.root.mountPoint} ${this.devices.root.fsType} ${mountOptsRoot}\n`

      if (this.devices.boot.name !== `none`) {
         text += `# ${this.devices.boot.name} ${this.devices.boot.mountPoint} ${this.devices.boot.fsType} ${mountOptsBoot}\n`
         text += `UUID=${Utils.uuid(this.devices.boot.name)} ${this.devices.boot.mountPoint} ${this.devices.root.fsType} ${mountOptsBoot}\n`
      }

      if (this.devices.data.name !== `none`) {
         text += `# ${this.devices.data.name} ${this.devices.data.mountPoint} ${this.devices.data.fsType} ${mountOptsData}\n`
         text += `UUID=${Utils.uuid(this.devices.data.name)} ${this.devices.data.mountPoint} ${this.devices.data.fsType} ${mountOptsData}\n`
      }

      if (this.efi) {
         text += `# ${this.devices.efi.name} ${this.devices.efi.mountPoint} vfat ${mountOptsEfi}\n`
         text += `UUID=${Utils.uuid(this.devices.efi.name)} ${this.devices.efi.mountPoint} vfat ${mountOptsEfi}\n`
      }
      text += `# ${this.devices.swap.name} ${this.devices.swap.mountPoint} ${this.devices.swap.fsType} ${mountOptsSwap}\n`
      text += `UUID=${Utils.uuid(this.devices.swap.name)} ${this.devices.swap.mountPoint} ${this.devices.swap.fsType} ${mountOptsSwap}\n`
      Utils.write(file, text)
   }

   /**
    * setKeyboard
    */
   private async setKeyboard() {
      const file = this.installTarget + '/etc/default/keyboard'
      let content = '# KEYBOARD CONFIGURATION FILE\n\n'
      content += '# Consult the keyboard(5) manual page.\n\n'
      content += 'XKBMODEL="' + this.keyboardModel + '"\n'
      content += 'XKBLAYOUT="' + this.keyboardLayout + '"\n'
      content += 'XKBVARIANT="' + this.keyboardVariant + '"\n'
      content += 'XKBOPTIONS=""\n'
      content += '\n'
      content += 'BACKSPACE="guess"\n'
      Utils.write(file, content)

      // lancio setupcon in chroot per salvare la tastiera
      const echo = { echo: false, ignore: false }
      const cmd = 'chroot ' + this.installTarget + ' ' + 'setupcon ' + this.toNull
      try {
         await exec(cmd, echo)
      } catch (error) {
         console.log(error)
      }
   }

   /**
    * networkcfg
    */
   private async networkcfg() {

      const file = this.installTarget + '/etc/network/interfaces'
      let content = '# created by eggs\n\n'
      content += 'auto lo\n'
      content += 'iface lo inet loopback\n\n'
      content += 'auto ' + this.network.iface + '\n'
      content += 'iface ' + this.network.iface + ' inet ' + this.network.addressType + '\n'
      if (this.network.addressType !== 'dhcp') {
         content += '    address ' + this.network.address + '\n'
         content += '    netmask ' + this.network.netmask + '\n'
         content += '    gateway ' + this.network.gateway + '\n'
      }
      Utils.write(file, content)

      /**
       * resolv.conf
       */
      if (this.network.addressType !== 'dhcp') {
         const file = this.installTarget + '/etc/resolv.conf'
         let content = '# created by eggs\n\n'
         content += 'domain ' + this.network.domain + '\n'
         for (const element of this.network.dns) {
            content += 'nameserver ' + element + '\n'
         }
         Utils.write(file, content)
      }
   }

   /**
    * hostname
    */
   private async hostname() {
      const echo = { echo: false, ignore: false }

      const file = this.installTarget + '/etc/hostname'
      const text = this.users.hostname

      await exec(`rm ${file} `, echo)
      fs.writeFileSync(file, text)
   }

   /**
    * hosts
    */
   private async hosts() {

      const file = this.installTarget + '/etc/hosts'
      let text = '127.0.0.1 localhost localhost.localdomain\n'
      if (this.network.addressType === 'static') {
         text += `${this.network.address} ${this.users.hostname} pvelocalhost\n`
      } else {
         text += `127.0.1.1 ${this.users.hostname} \n`
      }
      text += `# The following lines are desirable for IPv6 capable hosts\n`
      text += `:: 1     ip6 - localhost ip6 - loopback\n`
      text += `fe00:: 0 ip6 - localnet\n`
      text += `ff00:: 0 ip6 - mcastprefix\n`
      text += `ff02:: 1 ip6 - allnodes\n`
      text += `ff02:: 2 ip6 - allrouters\n`
      text += `ff02:: 3 ip6 - allhosts\n`
      fs.writeFileSync(file, text)
   }

   /**
    * removeInstaller
    */
   private async removeInstaller() {
      let file = `${this.installTarget}/usr/bin/penguins-links-add.sh`
      let lines = []
      let content = ''
      if (fs.existsSync(file)) {
         lines = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' }).split('\n')
         for (let i = 0; i < lines.length; i++) {

            if (lines[i]) {
               if (lines[i].search('penguins-krill.desktop') !== -1) {
                  lines[i] += '#'
               }
               if (lines[i].search('penguins-clinstaller.desktop') !== -1) {
                  lines[i] += '#'
               }
               if (lines[i].search('install-debian.desktop') !== -1) {
                  lines[i] += '#'
               }
               content += lines[i] + '\n'
            }
         }
      }
      fs.writeFileSync(file, content)
   }

   /**
    * unpackfs
    */
   private async unpackfs(): Promise<void> {
      const echo = Utils.setEcho(this.verbose)
      const cmd = 'unsquashfs -d ' + this.installTarget + ' -f ' + this.distro.mountpointSquashFs
      await exec(cmd)
   }

   /**
    * syncfs
    */
   private async syncfs(): Promise<void> {
      const echo = Utils.setEcho(this.verbose)

      let cmd = ''
      let f = ''
      f += ' --filter="- /cdrom/*"'
      f += ' --filter="- /dev/*"'
      f += ' --filter="- /home/' + this.settings.config.user_opt + '/*"' // esclude da rsync solo utente live
      f += ' --filter="- /live"'
      f += ' --filter="- /media/*"'
      f += ' --filter="- /mnt/*"'
      f += ' --filter="- /proc/*"'
      f += ' --filter="- /swapfile"'
      f += ' --filter="- /sys/*"'
      f += ' --filter="- /tmp/*"'

      // boot
      f += ' --filter="- /boot/efi*"'
      f += ' --filter="- /boot/grub/device.map"'
      f += ' --filter="- /boot/grub/grub.cfg"'
      f += ' --filter="- /boot/grub/menu.lst"'

      // etc
      f += ' --filter="- /etc/fstab.d/*"'
      f += ' --filter="- /etc/mtab"'
      f += ' --filter="- /etc/popularity-contest.conf"'
      f += ' --filter="- /etc/PolicyKit/PolicyKit.conf"'

      // var
      f += ' --filter="- /var/lib/dbus/machine-id"'

      // Added for newer version of live-config/live-boot
      f += ' --filter="- /lib/live/image"'
      f += ' --filter="- /lib/live/mount"'
      f += ' --filter="- /lib/live/overlay"'
      f += ' --filter="- /lib/live/rootfs"'

      // Added for symlink /lib
      f += ' --filter="- /usr/lib/live/image"'
      f += ' --filter="- /usr/lib/live/mount"'
      f += ' --filter="- /usr/lib/live/overlay"'
      f += ' --filter="- /usr/lib/live/rootfs"'

      f += ' --filter="- /run/*"'

      //       --progress \

      cmd = `\
      rsync \
      --archive \
      --delete -before \
      --delete -excluded \
      --info=progress2 \
      ${f} \
      / ${this.installTarget}`

      await exec(cmd.trim())
   }


   /**
    * mkfs
    */
   private async mkfs(): Promise<boolean> {
      const echo = { echo: false, ignore: false }

      const result = true

      if (this.efi) {
         await exec(`mkdosfs -F 32 -I ${this.devices.efi.name}` + this.toNull, echo)
      }

      if (this.devices.boot.name !== 'none') {
         // controllare se non vada !== undefined
         if (this.devices.boot.fsType === undefined) {
            this.devices.boot.fsType = `ext2`
            this.devices.boot.mountPoint = '/boot'
         }
         await exec('mke2fs -Ft ' + this.devices.boot.fsType + ' ' + this.devices.boot.name + this.toNull, echo)
      }

      if (this.devices.root.name !== 'none') {
         await exec('mke2fs -Ft ' + this.devices.root.fsType + ' ' + this.devices.root.name + this.toNull, echo)
      }

      if (this.devices.data.name !== 'none') {
         await exec('mke2fs -Ft ' + this.devices.data.fsType + ' ' + this.devices.data.name + this.toNull, echo)
      }

      if (this.devices.swap.name !== 'none') {
         await exec('mkswap ' + this.devices.swap.name + this.toNull, echo)
      }
      return result
   }

   /**
    * mount
    */
   private async mount(): Promise<boolean> {
      const echo = { echo: false, ignore: false }

      if (!fs.existsSync(this.installTarget)) {
         await exec(`mkdir ${this.installTarget}` + this.toNull, echo)
      }

      // root
      await exec(`mount ${this.devices.root.name} ${this.installTarget}${this.devices.root.mountPoint}` + this.toNull, echo)
      await exec(`tune2fs -c 0 -i 0 ${this.devices.root.name}` + this.toNull, echo)
      await exec(`rm -rf ${this.installTarget}/lost+found` + this.toNull, echo)

      // boot
      if (this.devices.boot.name !== `none`) {
         await exec(`mkdir ${this.installTarget}/boot -p` + this.toNull)
         await exec(`mount ${this.devices.boot.name} ${this.installTarget}${this.devices.boot.mountPoint}` + this.toNull, echo)
         await exec(`tune2fs -c 0 -i 0 ${this.devices.boot.name}` + this.toNull, echo)
      }

      // data
      if (this.devices.data.name !== `none`) {
         await exec(`mkdir ${this.installTarget}${this.devices.data.mountPoint} -p` + this.toNull)
         await exec(`mount ${this.devices.data.name} ${this.installTarget}${this.devices.data.mountPoint}` + this.toNull, echo)
         await exec(`tune2fs -c 0 -i 0 ${this.devices.data.name}` + this.toNull, echo)
      }

      // efi
      if (this.efi) {
         if (!fs.existsSync(this.installTarget + this.devices.efi.mountPoint)) {
            await exec(`mkdir ${this.installTarget}${this.devices.efi.mountPoint} -p` + this.toNull, echo)
            await exec(`mount ${this.devices.efi.name} ${this.installTarget}${this.devices.efi.mountPoint}` + this.toNull, echo)
         }
      }
      return true
   }

   /**
    * umount
    */
   private async umount(): Promise<boolean> {
      const echo = { echo: false, ignore: false }

      if (this.efi) {
         await exec(`umount ${this.installTarget}/boot/efi` + this.toNull, echo)
         await exec('sleep 1', echo)
      }

      // data
      if (this.devices.data.name !== `none`) {
         await exec(`umount ${this.devices.data.name}` + this.toNull, echo)
      }

      // root
      if (this.devices.boot.name !== `none`) {
         await exec(`umount ${this.devices.boot.name}` + this.toNull, echo)
      }

      await exec(`umount ${this.devices.root.name}` + this.toNull, echo)
      await exec('sleep 1', echo)
      return true
   }

   /**
   * mountvfs()
   */
   private async mountvfs() {
      const echo = { echo: true, ignore: true }

      await exec('mkdir ' + this.installTarget + '/dev' + this.toNull)
      await exec('mkdir ' + this.installTarget + '/dev/pts' + this.toNull)
      await exec('mkdir ' + this.installTarget + '/proc' + this.toNull)
      await exec('mkdir ' + this.installTarget + '/sys' + this.toNull)
      await exec('mkdir ' + this.installTarget + '/run' + this.toNull)

      await exec(`mount -o bind /dev ${this.installTarget}/dev` + this.toNull, echo)
      await exec(`mount -o bind /dev/pts ${this.installTarget}/dev/pts` + this.toNull, echo)
      await exec(`mount -o bind /proc ${this.installTarget}/proc` + this.toNull, echo)
      await exec(`mount -o bind /sys ${this.installTarget}/sys` + this.toNull, echo)
      /**
       * I know, that's very old thread, but maybe will help for someone. 
       * Most guides suggest the same solution to mount virtual filesystems before chroot:
       * for i in /dev /dev/pts /proc /sys /run; do sudo mount -B $i /mnt$i; done
       * But now (maybe related to efivars/efivarfs changes) this loop skips one very special sub-mountpoint 
       * - /sys/firmware/efi/efivars and efibootmgr/grub fails.
       * 
       * https://unix.stackexchange.com/questions/91620/efi-variables-are-not-supported-on-this-system
       */

      await exec(`mount -o bind /sys/firmware/efi/efivars ${this.installTarget}/sys/firmware/efi/efivars` + this.toNull, echo)
      await exec(`mount -o bind /run ${this.installTarget}/run` + this.toNull, echo)
   }

   /**
    */
   private async umountvfs() {
      const echo = { echo: false, ignore: false }

      if (Utils.isMountpoint(`${this.installTarget}/dev/pts`)) {
         await exec(`umount ${this.installTarget}/dev/pts` + this.toNull, echo)
         await exec('sleep 1', echo)
      }

      if (Utils.isMountpoint(`${this.installTarget}/dev`)) {
         await exec(`umount ${this.installTarget}/dev` + this.toNull, echo)
         await exec('sleep 1', echo)
      }

      if (Utils.isMountpoint(`${this.installTarget}/proc`)) {
         await exec(`umount ${this.installTarget}/proc` + this.toNull, echo)
         await exec('sleep 1', echo)
      }

      if (Utils.isMountpoint(`${this.installTarget}/run`)) {
         await exec(`umount ${this.installTarget}/run` + this.toNull, echo)
         await exec('sleep 1', echo)
      }

      if (Utils.isMountpoint(`${this.installTarget}/sys/fs/fuse/connections`)) {
         await exec(`umount ${this.installTarget}/sys/fs/fuse/connections` + this.toNull, echo)
         await exec('sleep 1', echo)
      }

      if (Utils.isMountpoint(`${this.installTarget}/firmware/efi/efivars`)) {
         await exec(`umount ${this.installTarget}/firmware/efi/efivars` + this.toNull, echo)
         await exec('sleep 1', echo)
      }

      if (Utils.isMountpoint(`${this.installTarget}/sys`)) {
         await exec(`umount ${this.installTarget}/sys` + this.toNull, echo)
         await exec('sleep 1', echo)
      }
   }

   /**
    * 
    * @param p 
    * @returns 
    */
   private async partition(): Promise<boolean> {
      const echo = Utils.setEcho(false) //    { echo: false, ignore: false }

      let retVal = false

      await exec('wipefs -a ' + this.partitions.installationDevice + this.toNull, echo)
      console.log('installationMode: ' + this.partitions.installationMode)
     
      if (this.partitions.installationMode === 'standard' && !this.efi) {

         /**
          * standard BIOS: working
          */
         await exec('parted --script ' + this.partitions.installationDevice + ' mklabel msdos' + this.toNull, echo)
         await exec('parted --script --align optimal ' + this.partitions.installationDevice + ' mkpart primary 1MiB 95%' + this.toNull, echo)
         await exec('parted --script ' + this.partitions.installationDevice + ' set 1 boot on' + this.toNull, echo)
         await exec('parted --script --align optimal ' + this.partitions.installationDevice + ' mkpart primary 95% 100%' + this.toNull, echo)

         this.devices.efi.name = `none`
         this.devices.boot.name = `none`
         this.devices.root.name = this.partitions.installationDevice + '1'
         this.devices.root.fsType = 'ext4'
         this.devices.root.mountPoint = '/'
         this.devices.data.name = `none`
         this.devices.swap.name = this.partitions.installationDevice + '2'
         this.devices.swap.fsType = 'swap'
         this.devices.swap.mountPoint = 'none'

         retVal = true

      } else if (this.partitions.installationMode === 'standard' && this.efi) {
         /**
          * UEFI: gpt, UEFI working
          */

         await exec('parted --script ' + this.partitions.installationDevice + ' mklabel gpt mkpart primary 0% 1% mkpart primary 1% 95% mkpart primary linux-swap 95% 100%' + this.toNull, echo)
         await exec('parted --script ' + this.partitions.installationDevice + ' set 1 boot on' + this.toNull, echo)
         await exec('parted --script ' + this.partitions.installationDevice + ' set 1 esp on' + this.toNull, echo)

         this.devices.efi.name = this.partitions.installationDevice + '1'
         this.devices.efi.fsType = 'F 32 -I'
         this.devices.efi.mountPoint = '/boot/efi'
         this.devices.boot.name = `none`

         this.devices.root.name = this.partitions.installationDevice + '2'
         this.devices.root.fsType = 'ext4'
         this.devices.root.mountPoint = '/'
         this.devices.data.name = `none`

         this.devices.swap.name = this.partitions.installationDevice + '3'
         this.devices.swap.fsType = 'swap'

         retVal = true

       } else if (this.partitions.installationMode === 'full-encrypted') { // && this.efi) {
         /**
          * UEFI: gpt, UEFI, full-encrypt
         */
          let echoYes = Utils.setEcho(true)

         const device =this.partitions.installationDevice
          await exec(`parted --script ${device} mklabel gpt`)
          await exec(`parted --script ${device} mkpart efi fat32           34s 256MiB`, echoYes) //dev/sda1 EFI
          await exec(`parted --script ${device} mkpart boot ext4       256MiB 768MiB`, echoYes) //dev/sda2 boot
          await exec(`parted --script ${device} mkpart root ext4       768MiB  30GiB`, echoYes) //dev/sda3 root
          await exec(`parted --script ${device} mkpart swap linux-swap  30GiB  100%s`, echoYes) //dev/sda4 swap sino fine

          await exec(`parted ${device} set 1 boot on`, echo)
          await exec(`parted ${device} set 1 esp on`, echo)

         /**
          * EFI 256M
          */
         this.devices.efi.name = `${device}1` // 'efi' 
         this.devices.efi.fsType = 'F 32 -I'
         this.devices.efi.mountPoint = '/boot/efi'

         /**
          * BOOT 512M
          */
         this.devices.boot.name = `${device}2` // 'boot' 
         this.devices.boot.fsType = 'ext4'
         this.devices.boot.mountPoint = '/boot'

         /**
          * ROOT 29G
          */
         let crytoRoot = await exec(`cryptsetup -y -v luksFormat --type luks2 ${device}3`, echoYes)
         if (crytoRoot.code !== 0) {
             Utils.warning(`Error: ${crytoRoot.code} ${crytoRoot.data}`)
             process.exit(1)
         }
         let crytoRootOpen = await exec(`cryptsetup luksOpen --type luks2 ${device}3 root-crypted`, echoYes)
         if (crytoRootOpen.code !== 0) {
             Utils.warning(`Error: ${crytoRootOpen.code} ${crytoRootOpen.data}`)
             process.exit(1)
         }
         this.devices.root.name = '/dev/mapper/root-crypted'
         this.devices.root.fsType = 'ext4'
         this.devices.root.mountPoint = '/'
 
 
         /**
          * SWAP 1G
          */
         console.log('SWAP 1G')
         let crytoSwap = await exec(`cryptsetup -y -v luksFormat --type luks2 ${device}4`, echoYes)
         if (crytoSwap.code !== 0) {
             Utils.warning(`Error: ${crytoSwap.code} ${crytoSwap.data}`)
             process.exit(1)
         }
         let crytoSwapOpen = await exec(`cryptsetup luksOpen --type luks2 ${device}4 swap-crypted`, echoYes)
         if (crytoSwapOpen.code !== 0) {
             Utils.warning(`Error: ${crytoSwapOpen.code} ${crytoSwapOpen.data}`)
             process.exit(1)
         }
         this.devices.swap.name = '/dev/mapper/swap-crypted'
         this.devices.swap.fsType = 'swap'
         this.devices.swap.mountPoint = 'none'

         this.devices.data.name = `none`

         retVal = true
         
      } else if (this.partitions.installationMode === 'lvm2' && !this.efi) {
         /**
         * LVM2, non EFI PROXMOX-VE
         */

         await exec(`parted --script ${this.partitions.installationDevice} mklabel msdos`)

         // Creo partizioni
         await exec(`parted --script ${this.partitions.installationDevice} mkpart primary ext2 1 512`)
         await exec(`parted --script --align optimal ${this.partitions.installationDevice} set 1 boot on`)
         await exec(`parted --script --align optimal ${this.partitions.installationDevice} mkpart primary ext2 512 100%`)
         await exec(`parted --script ${this.partitions.installationDevice} set 2 lvm on`)

         // Partizione LVM
         const lvmPartname = shx.exec(`fdisk $1 -l | grep 8e | awk '{print $1}' | cut -d "/" -f3`).stdout.trim()
         const lvmByteSize = Number(shx.exec(`cat /proc/partitions | grep ${lvmPartname}| awk '{print $3}' | grep "[0-9]"`).stdout.trim())
         const lvmSize = lvmByteSize / 1024

         // La partizione di root viene posta ad 1/4 della partizione LVM.
         // Viene limitata fino ad un massimo di 100 GB
         const lvmSwapSize = 4 * 1024
         let lvmRootSize = lvmSize / 8
         if (lvmRootSize < 20480) {
            lvmRootSize = 20480
         }
         const lvmDataSize = lvmSize - lvmRootSize - lvmSwapSize

         await exec(`pvcreate /dev/${lvmPartname}`)
         await exec(`vgcreate pve /dev/${lvmPartname}`)
         await exec(`vgchange -an`)
         await exec(`lvcreate -L ${lvmSwapSize} -nswap pve`)
         await exec(`lvcreate -L ${lvmRootSize} -nroot pve`)
         await exec(`lvcreate -l 100%FREE -ndata pve`)
         await exec(`vgchange -a y pve`)

         this.devices.efi.name = `none`

         this.devices.boot.name = `${this.partitions.installationDevice}1`
         this.devices.root.fsType = 'ext2'
         this.devices.root.mountPoint = '/boot'

         this.devices.root.name = `/dev/pve/root`
         this.devices.root.fsType = 'ext4'
         this.devices.root.mountPoint = '/'

         this.devices.data.name = `/dev/pve/data`
         this.devices.data.fsType = 'ext4'
         this.devices.data.mountPoint = '/var/lib/vz'

         this.devices.swap.name = `/dev/pve/swap`
         retVal = true
      } else if (this.partitions.installationMode === 'lvm2' && this.efi) {
         /**
         * LVM2, EFI
         */
         console.log('LVM2 on UEFI: to be implemented!')
         process.exit(0)
      }
      return retVal
   }

   /**
    * isRotational
    * @param device
    */
   private async isRotational(device: string): Promise<boolean> {
      device = device.substring(4)
      let response: any
      let retVal = false

      response = shx.exec(`cat /sys/block/${device}/queue/rotational`, { silent: this.verbose }).stdout.trim()
      if (response === '1') {
         retVal = true
      }
      return retVal
   }

   /**
    * execCalamaresModule
    * 
    * @param name 
    */
   private async execCalamaresModule(name: string) {
      const echo = { echo: false, ignore: false }

      const moduleName = this.installer.multiarchModules + name + '/module.desc'
      if (fs.existsSync(moduleName)) {
         console.log('analyzing: ' + moduleName)
         const calamaresModule = yaml.load(fs.readFileSync(moduleName, 'utf8')) as ICalamaresModule
         let command = calamaresModule.command
         console.log('command: ' + command)
         if (command !== '' || command !== undefined) {
            command += this.toNull
            execSync(command)
         }
      } else {
         /**
          * patch per ubuntu sostituisce bootloader-config e bootloader
          */
         if (name === 'bootloader-config') {
            await this.bootloaderConfigUbuntu()
         }
      }
   }

   /**
    * 
    */
   async bootloaderConfigUbuntu() {
      const echo = { echo: false, ignore: false }

      let cmd = ''
      try {
         cmd = 'chroot ' + this.installTarget + ' ' + 'apt-get update -y ' + this.toNull
         await exec(cmd, echo)
      } catch (error) {
         console.log(error)
      }

      try {
         cmd = 'chroot ' + this.installTarget + ' sleep 1' + this.toNull
         await exec(cmd, echo)
      } catch (error) {
         console.log(error)
      }

      let aptInstallOptions = ' apt install -y --no-upgrade --allow-unauthenticated -o Acquire::gpgv::Options::=--ignore-time-conflict '
      if (this.efi) {
         try {
            cmd = 'chroot ' + this.installTarget + aptInstallOptions + ' grub-efi-' + Utils.machineArch() + '  --allow-unauthenticated ' + this.toNull
            await exec(cmd, echo)
         } catch (error) {
            console.log('cmd: ' + cmd + ' error: ' + error)
         }
      } else {
         try {
            cmd = 'chroot ' + this.installTarget + aptInstallOptions + ' grub-pc' + this.toNull
            await exec(cmd, echo)
         } catch (error) {
            console.log('cmd: ' + cmd + ' error: ' + error)
         }
      }

      try {
         cmd = 'chroot ' + this.installTarget + ' sleep 1' + this.toNull
         await exec(cmd, echo)
      } catch (error) {
         console.log('cmd: ' + cmd + ' error: ' + error)
      }


      try {
         cmd = 'chroot ' + this.installTarget + ' grub-install ' + this.partitions.installationDevice + this.toNull
         await exec(cmd, echo)
      } catch (error) {
         console.log('cmd: ' + cmd + ' error: ' + error)
      }


      try {
         cmd = 'chroot ' + this.installTarget + ' grub-mkconfig -o /boot/grub/grub.cfg' + this.toNull
         await exec(cmd, echo)
      } catch (error) {
         console.log('cmd: ' + cmd + ' error: ' + error)
      }
      // await Utils.customConfirmAbort(cmd)

      try {
         cmd = 'chroot ' + this.installTarget + ' update-grub' + this.toNull
         await exec(cmd, echo)
      } catch (error) {
         console.log('cmd: ' + cmd + ' error: ' + error)
      }

      try {
         cmd = 'chroot ' + this.installTarget + ' sleep 1' + this.toNull
         await exec(cmd, echo)
      } catch (error) {
         console.log('cmd: ' + cmd + ' error: ' + error)
      }
   }

   /**
    * only show the result
    */
   finished() {
      redraw(<Finished installationDevice={this.partitions.installationDevice} hostName={this.users.hostname} userName={this.users.name} />)
      require('child_process').spawnSync('read _ ', { shell: true, stdio: [0, 1, 2] })
      shx.exec('reboot')
   }
}

const ifaces: string[] = fs.readdirSync('/sys/class/net/')

/**
 * Occorre farglierlo rigenerare a forza
 * anche quando NON cambiano i dati
 * forceUpdate
 */
function redraw(elem: JSX.Element) {
   let opt: RenderOptions = {}

   opt.patchConsole = false
   opt.debug = false

   shx.exec('clear')
   render(elem, opt)
}

/**
 * 
 * @param message 
 */
async function checkIt(message: string) {
   await Utils.customConfirm(message)
}