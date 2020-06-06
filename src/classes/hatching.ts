/* eslint-disable valid-jsdoc */
/* eslint-disable quotes */
/* eslint-disable no-console */

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

const exec = require('../lib/utils').exec
const { checkSync } = require('diskusage')

/**
 * hatch, installazione
 */
export default class Hatching {

  efi = false

  devices = {} as IDevices

  target = '/tmp/TARGET'


  /**
   * question
   */
  async questions(verbose = false, umount = false) {
    let retval = false
    const echo = Utils.setEcho(verbose)
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

    // const echo = Utils.setEcho(verbose)
    if (verbose) {
      Utils.warning('>>>hatching: install')
    }

    this.devices.efi = {} as IDevice
    this.devices.boot = {} as IDevice
    this.devices.root = {} as IDevice
    this.devices.data = {} as IDevice
    this.devices.swap = {} as IDevice

    /**
     * users configuration
     */
    Utils.titles(`install`)
    Utils.warning('get options users')
    const optionsUsers: any = await this.getOptionsUsers(verbose)
    const users: any = JSON.parse(optionsUsers)

    Utils.titles(`install`)
    Utils.warning('get options users')
    console.log(`- ` + chalk.bgGreen.black(`username: `) + chalk.bgGreen.whiteBright(users.username))
    console.log(`- ` + chalk.bgGreen.black(`userfullname: `) + chalk.bgGreen.whiteBright(users.userfullname))
    console.log(`- ` + chalk.bgGreen.black(`user password: `) + chalk.bgGreen.whiteBright(users.userpassword))
    console.log(`- ` + chalk.bgGreen.black(`autologin: `) + chalk.bgGreen.whiteBright(users.autologin))
    console.log(`- ` + chalk.bgGreen.black(`root password: `) + chalk.bgGreen.whiteBright(users.rootpassword))
    console.log()
    if (!await Utils.customConfirm(`Please, confirm.`)) {
      Utils.warning(`You chose to abort the installation`)
      process.exit()
    }

    /**
     * host configuration
     */
    Utils.titles(`install`)
    Utils.warning('get options host')
    const optionsHost: any = await this.getOptionsHost(verbose)
    const host: any = JSON.parse(optionsHost)

    Utils.titles(`install`)
    Utils.warning('get options host')
    console.log(`- ` + chalk.bgGreen.black(`hostname: `) + chalk.bgGreen.whiteBright(host.hostname))
    console.log(`- ` + chalk.bgGreen.black(`domain: `) + chalk.bgGreen.whiteBright(host.domain))
    console.log()
    if (!await Utils.customConfirm(`Please, confirm.`)) {
      Utils.warning(`You chose to abort the installation`)
      process.exit()
    }

    /**
     * net configuration
     */
    Utils.titles(`install`)
    Utils.warning('get options net')
    const optionsNet: any = await this.getOptionsNet(verbose)
    const net: any = JSON.parse(optionsNet)

    Utils.titles(`install`)
    Utils.warning('get options net')
    console.log(`- ` + chalk.bgGreen.black(`net Interface: `) + chalk.bgGreen.whiteBright(net.netInterface))
    console.log(`- ` + chalk.bgGreen.black(`net address type: `) + chalk.bgGreen.whiteBright(net.netAddressType))
    console.log(`- ` + chalk.bgGreen.black(`net address: `) + chalk.bgGreen.whiteBright(net.netAddress))
    console.log(`- ` + chalk.bgGreen.black(`net mask: `) + chalk.bgGreen.whiteBright(net.netMask))
    console.log(`- ` + chalk.bgGreen.black(`net gateway: `) + chalk.bgGreen.whiteBright(net.netGateway))
    console.log()
    if (!await Utils.customConfirm(`Please, confirm.`)) {
      Utils.warning(`You chose to abort the installation`)
      process.exit()
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
    Utils.titles(`install`)
    Utils.warning('get options disk and partition type')

    const optionsDisk: any = await this.getOptionsDisk(aDrives, partitionTypes, verbose)
    const disk: any = JSON.parse(optionsDisk)

    console.log(`- ` + chalk.bgGreen.black(`installation device: `) + chalk.bgGreen.whiteBright(disk.installationDevice))
    console.log(`- ` + chalk.bgGreen.black(`partition type: `) + chalk.bgGreen.whiteBright(disk.partionType))
    console.log(`- ` + chalk.bgGreen.black(`fs type: `) + chalk.bgGreen.whiteBright(disk.fsType))
    console.log()
    if (!await Utils.customConfirm(`Please, confirm.`)) {
      Utils.warning(`You chose to abort the installation`)
      process.exit()
    }


    /**
     * Conferma finale
     */
    Utils.titles(`install`)
    console.log()
    console.log(`You choose to install the system with the following parameters:`)
    console.log()
    console.log(`- username: ` + chalk.cyanBright(users.username))
    console.log(`- userfullname: ` + chalk.cyanBright(users.userfullname))
    console.log(`- user password: ` + chalk.cyanBright(users.userpassword))
    console.log(`- autologin: ` + chalk.cyanBright(users.autologin))
    console.log(`- root password: ` + chalk.cyanBright(users.rootpassword))

    console.log(`- hostname: ` + chalk.cyanBright(host.hostname))
    console.log(`- domain: ` + chalk.cyanBright(host.domain))

    console.log(`- net Interface: ` + chalk.cyanBright(net.netInterface))
    console.log(`- net address type: ` + chalk.cyanBright(net.netAddressType))
    console.log(`- net address: ` + chalk.cyanBright(net.netAddress))
    console.log(`- net mask: ` + chalk.cyanBright(net.netMask))
    console.log(`- net gateway: ` + chalk.cyanBright(net.netGateway))


    console.log(`- installation device: ` + chalk.cyanBright(disk.installationDevice))
    console.log(`- partition type: ` + chalk.cyanBright(disk.partionType))
    console.log(`- fs type: ` + chalk.cyanBright(disk.fsType))
    console.log()
    if (!await Utils.customConfirm(`Please, confirm.`)) {
      Utils.warning(`You chose to abort the installation`)
      process.exit()
    }


    Utils.titles(`install`)
    console.log()
    Utils.warning(`The process of installation is running..,`)

    if (fs.existsSync('/sys/firmware/efi/efivars')) {
      this.efi = true
    }

    const diskSize = await this.getDiskSize(disk.installationDevice, verbose)
    console.log(`diskSize: ${diskSize}`)

    if (umount) {
      await this.umountVFS(verbose)
      await this.umount4target(verbose)
    }

    const isDiskPrepared: boolean = await this.diskPartition(disk.installationDevice, disk.partionType, verbose)
    if (isDiskPrepared) {
      await this.mkfs(verbose)
      await this.mount4target(verbose)
      await this.egg2system(verbose)
      await this.setTimezone(verbose)
      await this.fstab(disk.installationDevice, verbose)
      await this.hostname(host, verbose)
      await this.resolvConf(net, verbose)
      await this.interfaces(net, verbose)
      await this.hosts(host, verbose)
      await this.mountVFS(verbose)
      await this.grubInstall(disk, verbose)
      await this.updateInitramfs(verbose)
      await this.delLiveUser(verbose)
      await this.addUser(users.username, users.userpassword, users.fullName, '', '', '', verbose)
      await this.changePassword('root', users.rootpassword, verbose)
      await this.autologinConfig(users.username, verbose)
      await this.umountVFS(verbose)
      await this.umount4target(verbose)
      this.finished(disk.installationDevice, host.hostname, users.username)
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
      let cmd = `chroot ${this.target} unlink /etc/localtime`
      await exec(cmd, echo)
    }
    let cmd = `chroot ${this.target} ln -sf /usr/share/zoneinfo/Europe/Rome /etc/localtime`
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
   * @param username
   * @param password
   * @param fullName
   * @param roomNumber
   * @param workPhone
   * @param homePhone
   */
  async addUser(username = 'live', password = 'evolution', fullName = '', roomNumber = '', workPhone = '', homePhone = '', verbose = false) {
    const echo = Utils.setEcho(verbose)
    if (verbose) {
      Utils.warning('hatching: addUser')
    }

    const cmd = `chroot ${this.target} \
adduser ${username} \
--home /home/${username} \
--shell /bin/bash \
--disabled-password \
--gecos "${fullName},${roomNumber},${workPhone},${homePhone}"`

    await exec(cmd, echo)

    await exec(`echo ${username}:${password} | chroot ${this.target} chpasswd `, echo)

    await exec(`chroot ${this.target} usermod -aG sudo ${username}`, echo)
  }

  /**
   * changePassword
   * @param username
   * @param newPassword
   */
  async changePassword(username = 'live', newPassword = 'evolution', verbose = false) {
    const echo = Utils.setEcho(verbose)
    if (verbose) {
      Utils.warning('hatching: changePassword')
    }
    const cmd = `echo ${username}:${newPassword} | chroot ${this.target} chpasswd `
    await exec(cmd, echo)
  }

  /**
   * delete username
   * @param username
   */
  async delLiveUser(verbose = false) {
    const echo = Utils.setEcho(verbose)
    if (verbose) {
      Utils.warning('hatching: delLiveUser')
    }
    if (Utils.isLive()) {
      const user: string = Utils.getPrimaryUser()
      let cmd = `chroot ${this.target} deluser --remove-home ${user}`
      await exec(cmd, echo)
    }
  }

  /**
   * grubInstall()
   * @param target
   * @param options
   */
  async grubInstall(options: any, verbose = false) {
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
    await exec(`chroot ${this.target} grub-install ${options.installationDevice}`, echo)
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

    if(this.devices.boot.name !== `none`){
      text += `# ${this.devices.boot.name} ${this.devices.boot.mountPoint} ${this.devices.boot.fsType} ${mountOptsBoot}\n`
      text += `UUID=${Utils.uuid(this.devices.boot.name)} ${this.devices.boot.mountPoint} ${this.devices.root.fsType} ${mountOptsBoot}\n`
    }

    if(this.devices.data.name !== `none`){
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
   * hostname()
   * @param options
   */
  async hostname(options: any, verbose = false) {
    const echo = Utils.setEcho(verbose)
    if (verbose) {
      Utils.warning('hatching: hostname')
    }

    const file = `${this.target}/etc/hostname`
    const text = options.hostname

    await exec(`rm ${file}`, echo)
    fs.writeFileSync(file, text)
  }

  /**
   * resolvConf()
   * @param options
   */
  async resolvConf(options: any, verbose = false) {
    const echo = Utils.setEcho(verbose)
    if (verbose) {
      Utils.warning('hatching: resolvConf')
    }

    console.log(`tipo di resolv.con: ${options.netAddressType}`)
    if (options.netAddressType === 'static') {
      const file = `${this.target}/etc/resolv.conf`

      let text = ``
      text += `search ${options.domain}\n`
      text += `domain ${options.domain}\n`
      text += `nameserver ${options.netDns}\n`
      text += `nameserver 8.8.8.8\n`
      text += `nameserver 8.8.4.4\n`
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
  async interfaces(options: any, verbose = false) {
    const echo = Utils.setEcho(verbose)
    if (verbose) {
      Utils.warning('hatching: interfaces')
    }

    if (options.netAddressType === 'static') {
      const file = `${this.target}/etc/network/interfaces`
      let text = ``
      text += `auto lo\n`
      text += `iface lo inet manual\n`
      text += `auto ${options.netInterface}\n`
      text += `iface ${options.netInterface} inet ${options.netAddressType}\n`
      text += `address ${options.netAddress}\n`
      text += `netmask ${options.netMask}\n`
      text += `gateway ${options.netGateway}\n`

      fs.writeFileSync(file, text)
    }
  }

  /**
   * hosts()
   * @param options
   */
  async hosts(options: any, verbose = false) {
    // const echo = Utils.setEcho(verbose)
    if (verbose) {
      Utils.warning('hatching: hosts')
    }

    const file = `${this.target}/etc/hosts`
    let text = '127.0.0.1 localhost localhost.localdomain\n'
    if (options.netAddressType === 'static') {
      text += `${options.netAddress} ${options.hostname} ${options.hostname}.${options.domain} pvelocalhost\n`
    } else {
      text += `127.0.1.1 ${options.hostname} ${options.hostname}.${options.domain}\n`
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
      async: false,
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
      Utils.warning(`Formatting ${this.devices.boot.name} as ${this.devices.boot.fsType}`)
      if (this.devices.boot.fsType === undefined) {
        this.devices.boot.fsType = `ext2`
      }
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
    if(this.devices.boot.name !== `none`){
      await exec (`mkdir ${this.target}/boot -p`)
      await exec(`mount ${this.devices.boot.name} ${this.target}${this.devices.boot.mountPoint}`, echo)
      await exec(`tune2fs -c 0 -i 0 ${this.devices.boot.name}`, echo)
    }

    // data
    if(this.devices.data.name !== `none`){
      await exec (`mkdir ${this.target}${this.devices.data.mountPoint} -p`)
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

    if(this.devices.data.name !== `none`){
      await exec(`umount ${this.devices.data.name}`, echo)
    }

    if(this.devices.boot.name !== `none`){
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
      Utils.warning('hatching: diskPartition')
    }

    Utils.warning(` we are going to partitioning your device ` + chalk.green(device) + ` in ` + chalk.green(partitionType) + `.`)
    console.log(`This is a uefi system: ` + chalk.green(this.efi) + `.`)
    console.log()
    console.log(chalk.bgRed.white(`This is the last opportunity to abort, the follow operation will destroy the data on the disk`))

    if (!await Utils.customConfirm(`Please, confirm.`)) {
      Utils.warning(`You chose to abort the installation`)
      process.exit()
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
      console.log('to be implemented!')
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
      const lvmByteSize: number = Number(shx.exec(`cat /proc/partitions | grep ${lvmPartname}| awk '{print $3}' | grep "[0-9]"`).stdout.trim())
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
    try {
      const info = await checkSync(device)
      return info.total
    } catch (err) {
      Utils.warning(err)
      return 0
    }
  }

  /**
   * 
   * @param verbose 
   */
  async getOptionsUsers(verbose = false) {
    const echo = Utils.setEcho(verbose)
    if (verbose) {
      Utils.warning('hatching: getOptions')
    }

    return new Promise(function (resolve) {
      const questions: Array<Record<string, any>> = [
        {
          type: 'input',
          name: 'username',
          message: 'user name: ',
          default: 'artisan',
        },
        {
          type: 'input',
          name: 'userfullname',
          message: 'user full name: ',
          default: 'artisan',
        },
        {
          type: 'password',
          name: 'userpassword',
          message: 'Enter a password for the user: ',
          default: 'evolution',
        },
        {
          type: 'list',
          name: 'autologin',
          message: 'Did you want autolongin: ',
          choices: ['Yes', 'No'],
          default: 'Yes',
        },
        {
          type: 'password',
          name: 'rootpassword',
          message: 'Enter a password for root: ',
          default: 'evolution',
        },
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
      Utils.warning('hatching: getOptions')
    }

    return new Promise(function (resolve) {
      const questions: Array<Record<string, any>> = [
        {
          type: 'input',
          name: 'hostname',
          message: 'hostname: ',
          default: os.hostname,
        },
        {
          type: 'imput',
          name: 'domain',
          message: 'domain name',
          default: 'lan',
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
      Utils.warning('hatching: getOptions')
    }

    return new Promise(function (resolve) {
      const questions: Array<Record<string, any>> = [
        {
          type: 'list',
          name: 'netInterface',
          message: 'Select the network interface: ',
          choices: ifaces,
        },
        {
          type: 'list',
          name: 'netAddressType',
          message: 'Select the network type: ',
          choices: ['dhcp', 'static'],
          default: 'dhcp',
        },
        {
          type: 'input',
          name: 'netAddress',
          message: 'Insert IP address: ',
          default: '192.168.61.100',
          when: function (answers: any) {
            return answers.netAddressType === 'static'
          },
        },
        {
          type: 'input',
          name: 'netMask',
          message: 'Insert netmask: ',
          default: '255.255.255.0',
          when: function (answers: any) {
            return answers.netAddressType === 'static'
          },
        },
        {
          type: 'input',
          name: 'netGateway',
          message: 'Insert gateway: ',
          default: Utils.netGateway(),
          when: function (answers: any) {
            return answers.netAddressType === 'static'
          },
        },
        {
          type: 'input',
          name: 'netDns',
          message: 'Insert DNS: ',
          default: Utils.netDns(),
          when: function (answers: any) {
            return answers.netAddressType === 'static'
          },
        },
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
      Utils.warning('hatching: getOptions')
    }

    return new Promise(function (resolve) {
      const questions: Array<Record<string, any>> = [
        {
          type: 'list',
          name: 'installationDevice',
          message: 'Select the installation disk: ',
          choices: driveList,
        },
        {
          type: 'list',
          name: 'partionType',
          message: 'Select partition type: ',
          choices: partitionTypes,
        },
        {
          type: 'list',
          name: 'fsType',
          message: 'Select format type: ',
          choices: ['ext2', 'ext3', 'ext4'],
          default: 'ext4',
        },
      ]

      inquirer.prompt(questions).then(function (options) {
        resolve(JSON.stringify(options))
      })
    })
  }

  /**
   * only show the result
   */
  finished(installationDevice: string, hostname: string, username: string) {
    Utils.titles()
    Utils.warning(`installation is finished.`)
    console.log('Your system was installed on ' + chalk.cyanBright(installationDevice) + '.')
    console.log('Host name was set as ' + chalk.cyanBright(hostname) + '.')
    console.log('The user name is ' + chalk.cyanBright(username) + '.')
    console.log('Enjoy Your new penguin!')
  }
}

const ifaces: string[] = fs.readdirSync('/sys/class/net/')
