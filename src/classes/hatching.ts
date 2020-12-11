/**
 * penguins-eggs: hatch.js
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */

import fs = require('fs')
import os = require('os')
import chalk = require('chalk')
import shx = require('shelljs')
import inquirer = require('inquirer')
import drivelist = require('drivelist')
import Utils from './utils'
import Pacman from './pacman'
import { IDevices, IDevice } from '../interfaces'
import * as diskusage from 'diskusage'

const exec = require('../lib/utils').exec

/**
 * Queste definizioni sono SOLO per hatching
 */
interface INet {
   interface: string
   addressType: string
   address: string
   netMask: string
   gateway: string
   dns: string
}

interface IUsers {
   name: string
   fullname: string
   password: string
   autologin: string
   rootpassword: string
}

interface IHost {
   name: string
   domain: string
}

interface IDisk {
   installationDevice: string
   partionType: string
   fsType: string
}

/**
 * hatch, installazione
 */
export default class Hatching {

   target = '/tmp/TARGET'

   efi = false

   devices = {} as IDevices

   users = {} as IUsers

   host = {} as IHost

   net = {} as INet

   disk = {} as IDisk

   /**
    * constructor
    */
   constructor() {
      this.devices.efi = {} as IDevice
      this.devices.boot = {} as IDevice
      this.devices.root = {} as IDevice
      this.devices.data = {} as IDevice
      this.devices.swap = {} as IDevice
   }

   /**
    * question
    */
   async questions(verbose = false, umount = false): Promise<void> {
      if (verbose) {
         Utils.warning('hatching: questions')
      }

      const msg1 = '\nThe process of installation will format your disk and destroy all datas on it.\n Did You are sure?\n'
      const msg2 = '\nWe need to be absolutely sure, did You saved your data before to proced?\n'
      const msg3 = '\nConfirm, again you want to continue?\n'

      if (await Utils.customConfirm(msg1)) {
         if (await Utils.customConfirm(msg2)) {
            if (await Utils.customConfirm(msg3)) {
               this.install(verbose, umount)
            }
         }
      }
   }

   /**
    * install
    */
   async install(verbose = false, umount = false) {
      if (verbose) {
         Utils.warning('>>>hatching: install')
      }
      while (true) {
         /**
          * users configuration
          */
         while (true) {
            Utils.titles(`install`)
            Utils.warning('get users')
            const optionsUsers: any = await this.getOptionsUsers(verbose)
            this.users = JSON.parse(optionsUsers)

            Utils.titles(`install`)
            Utils.warning('get users')
            console.log(`- ` + chalk.bgGreen.black(`name: `) + chalk.bgGreen.whiteBright(this.users.name))
            console.log(`- ` + chalk.bgGreen.black(`fullname: `) + chalk.bgGreen.whiteBright(this.users.fullname))
            console.log(`- ` + chalk.bgGreen.black(`user password: `) + chalk.bgGreen.whiteBright(this.users.password))
            console.log(`- ` + chalk.bgGreen.black(`autologin: `) + chalk.bgGreen.whiteBright(this.users.autologin))
            console.log(`- ` + chalk.bgGreen.black(`root password: `) + chalk.bgGreen.whiteBright(this.users.rootpassword))
            console.log()

            const result = JSON.parse(await Utils.customConfirmAbort())
            if (result.confirm === 'Yes') {
               break
            } else if (result.confirm === 'Abort') {
               Utils.warning(`You chose to abort the installation`)
               process.exit()
            }
         }

         /**
          * host configuration
          */
         while (true) {
            Utils.titles(`install`)
            Utils.warning('get options host')
            const optionsHost: any = await this.getOptionsHost(verbose)
            this.host = JSON.parse(optionsHost)

            Utils.titles(`install`)
            Utils.warning('get host')
            console.log(`- ` + chalk.bgGreen.black(`name: `) + chalk.bgGreen.whiteBright(this.host.name))
            console.log(`- ` + chalk.bgGreen.black(`domain: `) + chalk.bgGreen.whiteBright(this.host.domain))
            console.log()

            const result = JSON.parse(await Utils.customConfirmAbort())
            if (result.confirm === 'Yes') {
               break
            } else if (result.confirm === 'Abort') {
               Utils.warning(`You chose to abort the installation`)
               process.exit()
            }
         }

         /**
          * net configuration
          */
         while (true) {
            Utils.titles(`install`)
            Utils.warning('get net configuration')
            const optionsNet: any = await this.getOptionsNet(verbose)
            this.net = JSON.parse(optionsNet)

            Utils.titles(`install`)
            Utils.warning('get options net')
            console.log(`- ` + chalk.bgGreen.black(`net Interface: `) + chalk.bgGreen.whiteBright(this.net.interface))
            console.log(`- ` + chalk.bgGreen.black(`net address type: `) + chalk.bgGreen.whiteBright(this.net.addressType))
            console.log(`- ` + chalk.bgGreen.black(`net address: `) + chalk.bgGreen.whiteBright(this.net.address))
            console.log(`- ` + chalk.bgGreen.black(`net mask: `) + chalk.bgGreen.whiteBright(this.net.netMask))
            console.log(`- ` + chalk.bgGreen.black(`net gateway: `) + chalk.bgGreen.whiteBright(this.net.gateway))
            console.log()
            const result = JSON.parse(await Utils.customConfirmAbort())
            if (result.confirm === 'Yes') {
               break
            } else if (result.confirm === 'Abort') {
               Utils.warning(`You chose to abort the installation`)
               process.exit()
            }
         }

         /**
          * disk and partition
          */
         const drives: any = await drivelist.list()
         const aDrives: string[] = []
         drives.forEach((element: { device: string }) => {
            aDrives.push(element.device)
         })
         const partitionTypes = ['simple', 'lvm2']
         while (true) {
            Utils.titles(`install`)
            Utils.warning('get disk configuration')

            const optionsDisk: any = await this.getOptionsDisk(aDrives, partitionTypes, verbose)
            this.disk = JSON.parse(optionsDisk)

            console.log(`- ` + chalk.bgGreen.black(`installation device: `) + chalk.bgGreen.whiteBright(this.disk.installationDevice))
            console.log(`- ` + chalk.bgGreen.black(`partition type: `) + chalk.bgGreen.whiteBright(this.disk.partionType))
            console.log(`- ` + chalk.bgGreen.black(`fs type: `) + chalk.bgGreen.whiteBright(this.disk.fsType))
            console.log()
            const result = JSON.parse(await Utils.customConfirmAbort())
            if (result.confirm === 'Yes') {
               break
            } else if (result.confirm === 'Abort') {
               Utils.warning(`You chose to abort the installation`)
               process.exit()
            }
         }

         /**
          * Conferma finale
          */
         Utils.titles(`install`)
         console.log()
         console.log(`You choose to install the system with the following parameters:`)
         console.log()
         console.log(`- name: ` + chalk.cyanBright(this.users.name))
         console.log(`- fullname: ` + chalk.cyanBright(this.users.fullname))
         console.log(`- user password: ` + chalk.cyanBright(this.users.password))
         console.log(`- autologin: ` + chalk.cyanBright(this.users.autologin))
         console.log(`- root password: ` + chalk.cyanBright(this.users.rootpassword))

         console.log(`- name: ` + chalk.cyanBright(this.host.name))
         console.log(`- domain: ` + chalk.cyanBright(this.host.domain))

         console.log(`- net Interface: ` + chalk.cyanBright(this.net.interface))
         console.log(`- net address type: ` + chalk.cyanBright(this.net.addressType))
         if (this.net.addressType !== 'dhcp') {
            console.log(`- net address: ` + chalk.cyanBright(this.net.address))
            console.log(`- net mask: ` + chalk.cyanBright(this.net.netMask))
            console.log(`- net gateway: ` + chalk.cyanBright(this.net.gateway))
            console.log('- dns: ' + chalk.cyanBright(this.net.dns))
         } else {
            console.log(`- net address: ` + chalk.cyanBright('dhcp (automatic)'))
         }
         console.log(`- installation device: ` + chalk.cyanBright(this.disk.installationDevice))
         console.log(`- partition type: ` + chalk.cyanBright(this.disk.partionType))
         console.log(`- fs type: ` + chalk.cyanBright(this.disk.fsType))
         console.log()
         console.log(chalk.bgRed.white(`This is the last opportunity to abort, the follow operation will destroy the data on the disk`))
         console.log()
         const result = JSON.parse(await Utils.customConfirmAbort())
         if (result.confirm === 'Yes') {
            break
         } else if (result.confirm === 'Abort') {
            Utils.warning(`You chose to abort the installation`)
            process.exit()
         }
      }

      Utils.titles(`install`)
      console.log()
      Utils.warning(`The process of installation is running...`)
      if (fs.existsSync('/sys/firmware/efi/efivars')) {
         this.efi = true
      }

      const diskSize = await this.getDiskSize(this.disk.installationDevice, verbose)
      console.log(`diskSize: ${diskSize}`)

      if (umount) {
         try {
            await this.umountVFS(verbose)
         } catch (error) {
            console.log(`umountVFS: ${error}`)
         }
         try {
            await this.umount4target(verbose)
         } catch (error) {
            console.log(`umount4target: ${error}`)
         }
      }

      const isDiskPrepared: boolean = await this.diskPartition(this.disk.installationDevice, this.disk.partionType, verbose)
      if (isDiskPrepared) {
         try {
            await this.mkfs(verbose)
         } catch (error) {
            console.log(`mkfs: ${error}`)
         }

         try {
            await this.mount4target(verbose)
         } catch (error) {
            console.log(`mount4target: ${error}`)
         }

         try {
            await this.egg2system(verbose)
         } catch (error) {
            console.log(`egg2system: ${error}`)
         }

         try {
            await this.setTimezone(verbose)
         } catch (error) {
            console.log(`setTimezone: ${error}`)
         }

         try {
            await this.fstab(this.disk.installationDevice, verbose)
         } catch (error) {
            console.log(`fstab: ${error}`)
         }

         try {
            await this.name(verbose)
         } catch (error) {
            console.log(`name: ${error}`)
         }

         try {
            await this.resolvConf(verbose)
         } catch (error) {
            console.log(`resolvConf: ${error}`)
         }

         try {
            await this.interfaces(verbose)
         } catch (error) {
            console.log(`interfaces: ${error}`)
         }

         try {
            await this.hosts(verbose)
         } catch (error) {
            console.log(`hosts: ${error}`)
         }

         try {
            await this.mountVFS(verbose)
         } catch (error) {
            console.log(`mountVFS: ${error}`)
         }

         try {
            await this.grubInstall(verbose)
         } catch (error) {
            console.log(`grubInstall: ${error}`)
         }

         try {
            await this.updateInitramfs(verbose)
         } catch (error) {
            console.log(`updateInitramfs: ${error}`)
         }

         try {
            await this.delLiveUser(verbose)
         } catch (error) {
            console.log(`delLiveUser: ${error}`)
         }

         try {
            await this.addUser(this.users.name, this.users.password, this.users.fullname, '', '', '', verbose)
         } catch (error) {
            console.log(`addUser: ${error}`)
         }

         try {
            await this.changePassword('root', this.users.rootpassword, verbose)
         } catch (error) {
            console.log(`changePassword: ${error}`)
         }

         try {
            await this.autologinConfig(this.users.name, verbose)
         } catch (error) {
            console.log(`autologinConfig: ${error}`)
         }

         try {
            await this.removeInstaller(verbose)
         } catch (error) {
            console.log(`removeInstaller: ${error}`)
         }

         try {
            await this.umountVFS(verbose)
         } catch (error) {
            console.log(`umountVFS: ${error}`)
         }

         try {
            await this.umount4target(verbose)
         } catch (error) {
            console.log(`umount4target: ${error}`)
         }


         this.finished()
      }
   }

   /**
    * setTimezone
    */
   async setTimezone(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: setTimezone')
      }

      if (fs.existsSync('/etc/localtime')) {
         const cmd = `chroot ${this.target} unlink /etc/localtime`
         await exec(cmd, echo)
      }
      const cmd = `chroot ${this.target} ln -sf /usr/share/zoneinfo/Europe/Rome /etc/localtime`
      await exec(cmd, echo)
   }

   /**
    * autologinConfig
    * @param oldUser
    * @param newUser
    */
   async autologinConfig(newUser = 'artisan', verbose = false) {
      // const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: autoLoginConfig')
      }
      const oldUser = Utils.getPrimaryUser()
      if (Pacman.packageIsInstalled('lightdm')) {
         shx.sed('-i', `autologin-user=${oldUser}`, `autologin-user=${newUser}`, `${this.target}/etc/lightdm/lightdm.conf`)
      }
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
   async addUser(name = 'live', password = 'evolution', fullName = '', roomNumber = '', workPhone = '', homePhone = '', verbose = false): Promise<void> {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: addUser')
      }

      const cmd = `chroot ${this.target} \
adduser ${name} \
--home /home/${name} \
--shell /bin/bash \
--disabled-password \
--gecos "${fullName},${roomNumber},${workPhone},${homePhone}"`

      await exec(cmd, echo)

      await exec(`echo ${name}:${password} | chroot ${this.target} chpasswd `, echo)

      await exec(`chroot ${this.target} usermod -aG sudo ${name}`, echo)
   }

   /**
    * changePassword
    * @param name
    * @param newPassword
    */
   async changePassword(name = 'live', newPassword = 'evolution', verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: changePassword')
      }
      const cmd = `echo ${name}:${newPassword} | chroot ${this.target} chpasswd `
      await exec(cmd, echo)
   }

   /**
    * delete name
    * @param name
    */
   async delLiveUser(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: delLiveUser')
      }
      if (Utils.isLive()) {
         const user: string = Utils.getPrimaryUser()
         const cmd = `chroot ${this.target} deluser --remove-home ${user}`
         await exec(cmd, echo)
      }
   }

   /**
    * grubInstall()
    * @param target
    * @param options
    */
   async grubInstall(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: grubInstall')
      }
      await exec(`chroot ${this.target} apt update`)
      if (this.efi) {
         await exec(`chroot ${this.target} apt install grub-efi-amd64 --yes`)
      } else {
         await exec(`chroot ${this.target} apt install grub-pc --yes`)
      }
      await exec(`chroot ${this.target} grub-install ${this.disk.installationDevice}`, echo)
      await exec(`chroot ${this.target} update-grub`, echo)
      await exec('sleep 1', echo)
   }

   /**
    * updateInitramfs()
    */
   async updateInitramfs(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: updateInitramfs')
      }

      await exec(`chroot ${this.target}  update-initramfs -u -k $(uname -r)`, echo)
   }

   /**
    * mountVFS()
    */
   async mountVFS(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: mountVFS')
      }

      console.log('mount VFS')
      await exec(`mount -o bind /dev ${this.target}/dev`, echo)
      await exec(`mount -o bind /dev/pts ${this.target}/dev/pts`, echo)
      await exec(`mount -o bind /proc ${this.target}/proc`, echo)
      await exec(`mount -o bind /sys ${this.target}/sys`, echo)
      await exec(`mount -o bind /run ${this.target}/run`, echo)
      console.log('fine mount VFS')
   }

   /**
    * umountVFS()
    * @param target
    */
   async umountVFS(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: umountVFS')
      }

      if (Utils.isMountpoint(`${this.target}/dev/pts`)) {
         await exec(`umount ${this.target}/dev/pts`, echo)
         await exec('sleep 1', echo)
      }

      if (Utils.isMountpoint(`${this.target}/dev`)) {
         await exec(`umount ${this.target}/dev`, echo)
         await exec('sleep 1', echo)
      }

      if (Utils.isMountpoint(`${this.target}/proc`)) {
         await exec(`umount ${this.target}/proc`, echo)
         await exec('sleep 1', echo)
      }

      if (Utils.isMountpoint(`${this.target}/run`)) {
         await exec(`umount ${this.target}/run`, echo)
         await exec('sleep 1', echo)
      }

      if (Utils.isMountpoint(`${this.target}/sys/fs/fuse/connections`)) {
         await exec(`umount ${this.target}/sys/fs/fuse/connections`, echo)
         await exec('sleep 1', echo)
      }

      if (Utils.isMountpoint(`${this.target}/sys`)) {
         await exec(`umount ${this.target}/sys`, echo)
         await exec('sleep 1', echo)
      }
   }

   /**
    * fstab()
    * @param devices
    */
   async fstab(installDevice: string, verbose = false) {
      // const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: fstab')
      }

      const file = `${this.target}/etc/fstab`
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

   async resume(device: string) {
      // Sistemazione di resume
      // /etc/initramfs-tools/conf.d/resume
   }

   /**
    * name()
    * @param options
    */
   async name(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: name')
      }

      const file = `${this.target}/etc/name`
      const text = this.host.name

      await exec(`rm ${file}`, echo)
      fs.writeFileSync(file, text)
   }

   /**
    * resolvConf()
    * @param options
    */
   async resolvConf(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: resolvConf')
      }

      console.log(`tipo di resolv.con: ${this.net.addressType}`)
      if (this.net.addressType === 'static') {
         const file = `${this.target}/etc/resolv.conf`

         let text = ``
         text += `search ${this.host.domain}\n`
         text += `domain ${this.host.domain}\n`
         for (let index = 0; index < this.net.dns.length; ++index) {
            text += `nameserver ${this.net.dns[index]}\n`
         }
         fs.writeFileSync(file, text)
      }
   }

   /**
    *
    * auto lo
    *
    * interfaces()
    * @param options
    */
   async interfaces(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: interfaces')
      }

      if (this.net.addressType === 'static') {
         const file = `${this.target}/etc/network/interfaces`
         let text = ``
         text += `auto lo\n`
         text += `iface lo inet manual\n`
         text += `auto ${this.net.interface}\n`
         text += `iface ${this.net.interface} inet ${this.net.addressType}\n`
         text += `address ${this.net.address}\n`
         text += `netmask ${this.net.netMask}\n`
         text += `gateway ${this.net.gateway}\n`

         fs.writeFileSync(file, text)
      }
   }

   /**
    * hosts()
    * @param options
    */
   async hosts(verbose = false) {
      // const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: hosts')
      }

      const file = `${this.target}/etc/hosts`
      let text = '127.0.0.1 localhost localhost.localdomain\n'
      if (this.net.addressType === 'static') {
         text += `${this.net.address} ${this.host.name} ${this.host.name}.${this.host.domain} pvelocalhost\n`
      } else {
         text += `127.0.1.1 ${this.host.name} ${this.host.name}.${this.host.domain}\n`
      }
      text += `# The following lines are desirable for IPv6 capable hosts\n`
      text += `::1     ip6-localhost ip6-loopback\n`
      text += `fe00::0 ip6-localnet\n`
      text += `ff00::0 ip6-mcastprefix\n`
      text += `ff02::1 ip6-allnodes\n`
      text += `ff02::2 ip6-allrouters\n`
      text += `ff02::3 ip6-allhosts\n`
      fs.writeFileSync(file, text)
   }

   /**
    * 
    */
   async removeInstaller(verbose = false) {
      if (verbose) {
         Utils.warning('hatching: removeInstaller()')
      }
      const file = `${this.target}/usr/bin/penguins-links-add.sh`
      let lines = []
      let content = ''
      if (fs.existsSync(file)) {
         lines = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' }).split('\n')
         for (let i = 0; i < lines.length; i++) {
            if (lines[i]) {
               if (lines[i].search('install') !== -1) {
                  content += lines[i]
               } else {
                  console.log('deleted: ' + lines[i])
               }
            }
            console.log(content)
            fs.writeFileSync(file, content)
         }
      }
   }

   /**
    * egg2system
    * @param devices
    * @param verbose
    */
   async egg2system(verbose = false): Promise<void> {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: egg2system')
      }

      let cmd = ''
      let f = ''
      f += ' --filter="- /cdrom/*"'
      f += ' --filter="- /dev/*"'
      f += ' --filter="- /home/*"'
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
      // in sid (to become Jessie)
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

      cmd = `\
  rsync \
  --archive \
  --delete-before \
  --delete-excluded \
  ${f} \
  / ${this.target}`

      shx.exec(cmd.trim(), {
         async: false
      })
   }

   /**
    *
    * @param devices
    */
   async mkfs(verbose = false): Promise<boolean> {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: mkfs')
      }

      const result = true

      if (this.efi) {
         Utils.warning(`Formatting ${this.devices.efi.name}`)
         await exec(`mkdosfs -F 32 -I ${this.devices.efi.name}`, echo)
      }

      if (this.devices.boot.name !== 'none') {
         if (this.devices.boot.fsType === undefined) {
            this.devices.boot.fsType = `ext2`
            this.devices.boot.mountPoint = '/boot'
         }
         Utils.warning(`Formatting ${this.devices.boot.name} as ${this.devices.boot.fsType}`)
         await exec(`mkfs -t ${this.devices.boot.fsType} ${this.devices.boot.name}`, echo)
      }

      if (this.devices.root.name !== 'none') {
         Utils.warning(`Formatting ${this.devices.root.name}`)
         await exec(`mkfs -t ${this.devices.root.fsType} ${this.devices.root.name}`, echo)
      }

      if (this.devices.data.name !== 'none') {
         Utils.warning(`Formatting ${this.devices.data.name}`)
         await exec(`mkfs -t ${this.devices.data.fsType} ${this.devices.data.name}`, echo)
      }

      if (this.devices.swap.name !== 'none') {
         Utils.warning(`Formatting ${this.devices.swap.name}`)
         await exec(`mkswap ${this.devices.swap.name}`, echo)
      }
      return result
   }

   /**
    *
    * @param devices
    */
   async mount4target(verbose = false): Promise<boolean> {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: mount4target')
      }

      if (!fs.existsSync(this.target)) {
         await exec(`mkdir ${this.target}`, echo)
      }

      // Monto la root
      await exec(`mount ${this.devices.root.name} ${this.target}${this.devices.root.mountPoint}`, echo)
      await exec(`tune2fs -c 0 -i 0 ${this.devices.root.name}`, echo)
      await exec(`rm -rf ${this.target}/lost+found`, echo)

      // boot
      if (this.devices.boot.name !== `none`) {
         await exec(`mkdir ${this.target}/boot -p`)
         await exec(`mount ${this.devices.boot.name} ${this.target}${this.devices.boot.mountPoint}`, echo)
         await exec(`tune2fs -c 0 -i 0 ${this.devices.boot.name}`, echo)
      }

      // data
      if (this.devices.data.name !== `none`) {
         await exec(`mkdir ${this.target}${this.devices.data.mountPoint} -p`)
         await exec(`mount ${this.devices.data.name} ${this.target}${this.devices.data.mountPoint}`, echo)
         await exec(`tune2fs -c 0 -i 0 ${this.devices.data.name}`, echo)
      }

      if (this.efi) {
         if (!fs.existsSync(this.target + this.devices.efi.mountPoint)) {
            await exec(`mkdir ${this.target}${this.devices.efi.mountPoint} -p`, echo)
            await exec(`mount ${this.devices.efi.name} ${this.target}${this.devices.efi.mountPoint}`, echo)
         }
      }
      return true
   }

   /**
    *
    * @param target
    * @param devices
    */
   async umount4target(verbose = false): Promise<boolean> {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: umount4target')
      }

      if (this.efi) {
         await exec(`umount ${this.target}/boot/efi`, echo)
         await exec('sleep 1', echo)
      }

      if (this.devices.data.name !== `none`) {
         await exec(`umount ${this.devices.data.name}`, echo)
      }

      if (this.devices.boot.name !== `none`) {
         await exec(`umount ${this.devices.boot.name}`, echo)
      }

      await exec(`umount ${this.devices.root.name}`, echo)
      await exec('sleep 1', echo)
      return true
   }

   /**
    *
    * @param device
    * @param partitionType
    * @param verbose
    */
   async diskPartition(device: string, partitionType: string, verbose = false): Promise<boolean> {
      let retVal = false
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: diskPartition()')
      }

      if (partitionType === 'simple' && this.efi) {
         await exec(`parted --script ${device} mklabel gpt mkpart primary 0% 1% mkpart primary 1% 95% mkpart primary 95% 100%`, echo)
         await exec(`parted --script ${device} set 1 boot on`, echo)
         await exec(`parted --script ${device} set 1 esp on`, echo)

         this.devices.efi.name = `${device}1`
         this.devices.efi.fsType = 'F 32 -I'
         this.devices.efi.mountPoint = '/boot/efi'

         this.devices.boot.name = `none`

         this.devices.root.name = `${device}2`
         this.devices.root.fsType = 'ext4'
         this.devices.root.mountPoint = '/'

         this.devices.data.name = `none`

         this.devices.swap.name = `${device}3`
         this.devices.swap.fsType = 'swap'

         retVal = true
      } else if (partitionType === 'simple' && !this.efi) {
         await exec(`parted --script ${device} mklabel msdos`, echo)
         await exec(`parted --script --align optimal ${device} mkpart primary 1MiB 95%`, echo)
         await exec(`parted --script ${device} set 1 boot on`, echo)
         await exec(`parted --script --align optimal ${device} mkpart primary 95% 100%`, echo)

         this.devices.efi.name = `none`

         this.devices.boot.name = `none`

         this.devices.root.name = `${device}1`
         this.devices.root.fsType = 'ext4'
         this.devices.root.mountPoint = '/'

         this.devices.data.name = `none`

         this.devices.swap.name = `${device}2`
         this.devices.swap.fsType = 'swap'
         this.devices.swap.mountPoint = 'none'

         retVal = true
      } else if (partitionType === 'lvm2' && this.efi) {
         console.log('LVM2 on UEFI: to be implemented!')
         process.exit(0)
      } else if (partitionType === 'lvm2' && !this.efi) {
         // Preparo tabella partizioni
         await exec(`parted --script ${device} mklabel msdos`)

         // Creo partizioni
         await exec(`parted --script ${device} mkpart primary ext2 1 512`)
         await exec(`parted --script --align optimal ${device} set 1 boot on`)
         await exec(`parted --script --align optimal ${device} mkpart primary ext2 512 100%`)
         await exec(`parted --script ${device} set 2 lvm on`)

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

         this.devices.boot.name = `${device}1`
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
      }
      return retVal
   }

   /**
    * Rimuove il lvm pve
    * @param verbose
    */
   async lvmRemove(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: diskPartition')
      }
      await exec('lvremove /dev/pve/swap', echo)
      await exec('lvremove /dev/pve/data', echo)
      await exec('lvremove /dev/pve/root', echo)
      await exec('vgremove /dev/pve', echo)
      await exec('pvremove /dev/sda2', echo)
      await exec('rm /TARGET -rf', echo)
   }

   /**
    *
    * @param device
    */
   async isRotational(device: string, verbose = false): Promise<boolean> {
      // const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: isRotational')
      }

      device = device.substring(4)
      console.log(`device: ${device}`)
      let response: any
      let retVal = false

      response = shx.exec(`cat /sys/block/${device}/queue/rotational`, { silent: verbose }).stdout.trim()
      if (response === '1') {
         retVal = true
      }
      return retVal
   }

   /**
    *
    * @param device
    */
   async getDiskSize(device: string, verbose = false): Promise<number> {
      // const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: getDiskSize')
      }
      let size = 0
      try {
         const info = diskusage.checkSync(device)
         size = info.total
      } catch (error) {
         Utils.warning(`checkSync: ${error}`)
         size = 0
      }
      return size
   }

   /**
    *
    * @param verbose
    */
   async getOptionsUsers(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: getOptionsUsers()')
      }

      return new Promise(function (resolve) {
         const questions: Array<Record<string, any>> = [
            {
               type: 'input',
               name: 'name',
               message: 'user name: ',
               default: 'artisan'
            },
            {
               type: 'input',
               name: 'fullname',
               message: 'user fullname: ',
               default: 'artisan'
            },
            {
               type: 'password',
               name: 'password',
               message: 'Enter a password for the user: ',
               default: 'evolution'
            },
            {
               type: 'list',
               name: 'autologin',
               message: 'Did you want autolongin: ',
               choices: ['Yes', 'No'],
               default: 'Yes'
            },
            {
               type: 'password',
               name: 'rootpassword',
               message: 'Enter a password for root: ',
               default: 'evolution'
            }
         ]

         inquirer.prompt(questions).then(function (options) {
            resolve(JSON.stringify(options))
         })
      })
   }

   /**
    *
    * @param verbose
    */
   async getOptionsHost(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: getOptionsHost()')
      }

      return new Promise(function (resolve) {
         const questions: Array<Record<string, any>> = [
            {
               type: 'input',
               name: 'name',
               message: 'name: ',
               default: os.hostname
            },
            {
               type: 'imput',
               name: 'domain',
               message: 'domain name',
               default: 'lan'
            }
         ]
         inquirer.prompt(questions).then(function (options) {
            resolve(JSON.stringify(options))
         })
      })
   }

   /**
    *
    * @param verbose
    */
   async getOptionsNet(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: getOptionsNet()')
      }

      return new Promise(function (resolve) {
         const questions: Array<Record<string, any>> = [
            {
               type: 'list',
               name: 'interface',
               message: 'Select the network interface: ',
               choices: ifaces
            },
            {
               type: 'list',
               name: 'addressType',
               message: 'Select the network type: ',
               choices: ['dhcp', 'static'],
               default: 'dhcp'
            },
            {
               type: 'input',
               name: 'address',
               message: 'Insert IP address: ',
               default: Utils.netAddress(),
               when: function (answers: any) {
                  return answers.addressType === 'static'
               }
            },
            {
               type: 'input',
               name: 'netMask',
               message: 'Insert netmask: ',
               default: Utils.netMasK(),
               when: function (answers: any) {
                  return answers.addressType === 'static'
               }
            },
            {
               type: 'input',
               name: 'gateway',
               message: 'Insert gateway: ',
               default: Utils.netGateway(),
               when: function (answers: any) {
                  return answers.addressType === 'static'
               }
            },
            {
               type: 'input',
               name: 'dns',
               message: 'Insert DNS: ',
               default: Utils.netDns(),
               when: function (answers: any) {
                  return answers.addressType === 'static'
               }
            }
         ]
         inquirer.prompt(questions).then(function (options) {
            resolve(JSON.stringify(options))
         })
      })
   }

   /**
    *
    * @param driveList
    * @param partitionTypes
    * @param verbose
    */
   async getOptionsDisk(driveList: string[], partitionTypes: string[], verbose = false): Promise<any> {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: getOptionsDisk()')
      }

      return new Promise(function (resolve) {
         const questions: Array<Record<string, any>> = [
            {
               type: 'list',
               name: 'installationDevice',
               message: 'Select the installation disk: ',
               choices: driveList
            },
            {
               type: 'list',
               name: 'partionType',
               message: 'Select partition type: ',
               choices: partitionTypes
            },
            {
               type: 'list',
               name: 'fsType',
               message: 'Select format type: ',
               choices: ['ext2', 'ext3', 'ext4'],
               default: 'ext4'
            }
         ]

         inquirer.prompt(questions).then(function (options) {
            resolve(JSON.stringify(options))
         })
      })
   }

   /**
    * only show the result
    */
   finished() {
      Utils.titles()
      Utils.warning(`installation is finished.`)
      console.log('Your system was installed on ' + chalk.cyanBright(this.disk.installationDevice) + '.')
      console.log('Host name was set as ' + chalk.cyanBright(this.host.name) + '.')
      console.log('The user name is ' + chalk.cyanBright(this.users.name) + '.')
      console.log('Enjoy Your new penguin!')
      console.log(`Note: it is recommended to run the command ` + chalk.cyanBright(`sudo update-initramfs -u`) + ` after next reboot.`)
      console.log('Press any key to exit')
      require('child_process').spawnSync('read _ ', {
         shell: true,
         stdio: [0, 1, 2]
      })
   }
}

const ifaces: string[] = fs.readdirSync('/sys/class/net/')
