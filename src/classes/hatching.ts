/**
 * penguins-eggs: hatch.js
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */

import fs = require('fs')
import os = require('os')
import shx = require('shelljs')
import inquirer = require('inquirer')
import drivelist = require('drivelist')
import Utils from './utils'
import { IDevices, IDevice } from '../interfaces'

/**
 * hatch, installazione
 */
export default class Hatching {
  constructor() {
  }

  /**
   * question
   */
  async question() {
    const msg1 = '\nThe process of installation will format your disk and destroy all datas on it.\n Did You are sure?\n'
    const msg2 = '\nWe need to be absolutely sure, did You saved your data before to proced?\n'
    const msg3 = '\nConfirm you want to continue?\n'
    let varResult: any = await this.customConfirm(msg1)

    let result = JSON.parse(varResult)
    if (result.confirm === 'Yes') {
      varResult = await this.customConfirm(msg2)
      result = JSON.parse(varResult)
      if (result.confirm === 'Yes') {
        varResult = await this.customConfirm(msg3)
        result = JSON.parse(varResult)
        if (result.confirm === 'Yes') {
          this.install()
        }
      }
    }
  }

  /**
  * install
  */
  async install() {
    const target = '/tmp/TARGET'
    const devices = {} as IDevices

    devices.uefi = {} as IDevice
    devices.root = {} as IDevice
    devices.swap = {} as IDevice

    const drives: any = await drivelist.list()

    const aDrives: string[] = []

    drives.forEach((element: { device: string }) => {
      aDrives.push(element.device)
    })
    // console.log(aDrives)

    const varOptions: any = await this.getOptions(aDrives)
    const options: any = JSON.parse(varOptions)

    devices.root.device = `${options.installationDevice}1`
    devices.root.fsType = 'fat32'
    devices.root.mountPoint = '/boot/efi'
    devices.root.device = `${options.installationDevice}2`
    devices.root.fsType = 'ext4'
    devices.root.mountPoint = '/'
    devices.swap.device = `${options.installationDevice}2`
    devices.swap.fsType = 'swap'
    devices.swap.mountPoint = 'none'

    const diskSize = this.getDiskSize(options.installationDevice)
    console.log(`diskSize: ${diskSize}`)

    const isDiskPrepared: boolean = this.diskPartitionGpt(options.installationDevice)
    if (isDiskPrepared) {
      await this.mkfs(devices)
      await this.mount4target(target, devices)
      process.exit(0)
      await this.egg2system(target)
      await this.setTimezone(target)
      await this.fstab(target, devices, options.installationDevice)
      await this.hostname(target, options)
      await this.resolvConf(target, options)
      await this.interfaces(target, options)
      await this.hosts(target, options)
      await this.mountVFS(target)
      await this.updateInitramfs(target)
      await this.grubInstall(target, options)
      await this.addUser(target, options.username, options.userpassword)
      await this.changePassword(target, 'root', options.rootpassword)
      await this.autologinConfig(target, 'live', options.username)
      await this.delUserLive(target)
      await this.patchPve(target)
      await this.umountVFS(target)
      await this.umount4target(target, devices)
    }
  }

  /**
   * setTimezone
   * @param target
   */
  async setTimezone(target: string) {
    let cmd = `chroot ${target} unlink /etc/localtime`
    shx.exec(cmd, { silent: true })
    cmd = `chroot ${target} ln -sf /usr/share/zoneinfo/Europe/Rome /etc/localtime`
    shx.exec(cmd, { silent: true })
  }

  /**
   * autologinConfig
   * @param target
   * @param oldUser
   * @param newUser
   */
  async autologinConfig(target: string, oldUser = 'live', newUser = 'artisan') {
    shx.sed('-i', `autologin-user=${oldUser})`, `autologin-user=${newUser}`, `${target}/etc/lightdm/lightdm.conf`)
  }

  /**
   * 
   * @param target 
   * @param username 
   * @param password 
   * @param fullName 
   * @param roomNumber 
   * @param workPhone 
   * @param homePhone 
   */
  async addUser(target = '/tmp/TARGET', username = 'live', password = 'evolution', fullName = '', roomNumber = '', workPhone = '', homePhone = '') {

    const cmd = `sudo chroot ${target} adduser ${username}\
                                  --home /home/${username} \
                                  --shell /bin/bash \
                                  --disabled-password \
                                  --gecos "${fullName},\
                                          ${roomNumber},\
                                          ${workPhone},\
                                          ${homePhone}"`

    console.log(`addUser: ${cmd}`)
    shx.exec(cmd)

    const cmdPass = `echo ${username}:${password} | chroot ${target} chpasswd `
    console.log(`addUser cmdPass: ${cmdPass}`)
    shx.exec(cmdPass)

    const cmdSudo = `chroot ${target} addgroup ${username} sudo`
    console.log(`addUser cmdSudo: ${cmdSudo}`)
    shx.exec(cmdSudo)
  }

  /**
   * changePassword
   * @param target 
   * @param username 
   * @param newPassword 
   */
  async changePassword(target = '/tmp/TARGET',
    username = 'live',
    newPassword = 'evolution') {
    const cmd = `echo ${username}:${newPassword} | chroot ${target} chpasswd `
    console.log(`changePassword: ${cmd}`)
    shx.exec(cmd)
  }

  /**
   * delete username
   * @param username 
   */
  async delUser(username = 'live') {
    const cmd = `deluser ${username}`
    console.log(`delUser: ${cmd}`)
    shx.exec(cmd)
  }

  /**
   * delUserLive
   */
  async delUserLive(target: string) {
    shx.exec(`chroot ${target} deluser live`, { silent: true })
  }

  /**
   * patchPve patch per proxypve che non crea la directory
   *          e che ricrea i codici di ssh della macchina
   * @param target
   */
  async patchPve(target: string) {
    // patch per apache2
    await shx.exec(`chroot ${target} mkdir /var/log/apache2`)
    await shx.exec(`chroot ${target} mkdir /var/log/pveproxy`, { silent: true })
    await shx.exec(`chroot ${target} touch /var/log/pveproxy/access.log`, { silent: true })
    await shx.exec(`chroot ${target} chown www-data:www-data /var/log/pveproxy -R`, { silent: true })
    await shx.exec(`chroot ${target} chmod 0664 /var/log/pveproxy/access.log`, { silent: true })
    await shx.exec(`chroot ${target} dpkg-reconfigure openssh-server`, { silent: true })
  }

  /**
   * grubInstall()
   * @param target
   * @param options
   */
  async grubInstall(target: string, options: any) {
    console.log('grub-install')
    await shx.exec(`chroot ${target} grub-install ${options.installationDevice}`, { silent: true })
    console.log('update-grub')
    await shx.exec(`chroot ${target} update-grub`, { silent: true })
  }

  /**
   * updateInitramfs()
   * @param target
   */
  async updateInitramfs(target: string) {
    console.log('update-initramfs/n')
    await shx.exec(`chroot ${target}  update-initramfs -u -k $(uname -r)`, { silent: true })
  }

  /**
   * mountVFS()
   * @param target
   */
  async mountVFS(target: string) {
    console.log('mount VFS')
    await shx.exec(`mount -o bind /dev ${target}/dev`, { silent: true })
    await shx.exec(`mount -o bind /devpts ${target}/dev/pts`, { silent: true })
    await shx.exec(`mount -o bind /proc ${target}/proc`, { silent: true })
    await shx.exec(`mount -o bind /sys ${target}/sys`, { silent: true })
    await shx.exec(`mount -o bind /run ${target}/run`, { silent: true })
  }

  /**
   * umountVFS()
   * @param target
   */
  async umountVFS(target: string) {
    console.log('umount VFS')
    await shx.exec(`umount ${target}/dev/pts`, { silent: true })
    await shx.exec('sleep 1', { silent: true })
    await shx.exec(`umount ${target}/dev`, { silent: true })
    await shx.exec('sleep 1', { silent: true })
    await shx.exec(`umount ${target}/proc`, { silent: true })
    await shx.exec('sleep 1', { silent: true })
    await shx.exec(`umount ${target}/sys`, { silent: true })
    await shx.exec('sleep 1', { silent: true })
    await shx.exec(`umount ${target}/run`, { silent: true })
    await shx.exec('sleep 1', { silent: true })
  }

  /**
   * fstab()
   * @param target
   * @param devices
   */
  async fstab(target: string, devices: IDevices, installDevice: string) {
    const file = `${target}/etc/fstab`
    let mountOptsRoot = ''
    let mountOptsSwap = ''

    if (await this.isRotational(installDevice)) {
      mountOptsRoot = 'defaults,relatime 0 1'
      mountOptsRoot = 'defaults,relatime 0 2'
    } else {
      mountOptsRoot = 'defaults,noatime,discard 0 1'
      mountOptsSwap = 'defaults,noatime,discard 0 2'
    }
    const text = `\
${devices.root.device} ${devices.root.mountPoint} ${devices.root.fsType} ${mountOptsRoot}
${devices.swap.device} ${devices.swap.mountPoint} ${devices.swap.fsType} ${mountOptsSwap}`
    fs.writeFileSync(file, text)
  }

  /**
   * hostname()
   * @param target
   * @param options
   */
  async hostname(target: string, options: any) {
    const file = `${target}/etc/hostname`
    const text = options.hostname

    shx.exec(`rm ${target}/etc/hostname`, { silent: true })
    fs.writeFileSync(file, text)
  }

  /**
   * resolvConf()
   * @param target
   * @param options
   */
  async resolvConf(target: string, options: any) {
    console.log(`tipo di resolv.con: ${options.netAddressType}`)
    if (options.netAddressType === 'static') {
      const file = `${target}/etc/resolv.conf`
      const text = `
search ${options.domain}
domain ${options.domain}
nameserver ${options.netDns}
nameserver 8.8.8.8
nameserver 8.8.4.4
`
      fs.writeFileSync(file, text)
    }
  }

  /**
   *
   * auto lo
   *
   * interfaces()
   * @param target
   * @param options
   */
  async interfaces(target: string, options: any) {
    if (options.netAddressType === 'static') {
      const file = `${target}/etc/network/interfaces`
      const text = `\
auto lo
iface lo inet manual
auto ${options.netInterface}
iface ${options.netInterface} inet ${options.netAddressType}
    address ${options.netAddress}
    netmask ${options.netMask}
    gateway ${options.netGateway}`

      fs.writeFileSync(file, text)
    }
  }

  /**
   * hosts()
   * @param target
   * @param options
   */
  async hosts(target: string, options: any) {
    const file = `${target}/etc/hosts`
    let text = '127.0.0.1 localhost localhost.localdomain'
    if (options.netAddressType === 'static') {
      text += `
${options.netAddress} ${options.hostname} ${options.hostname}.${options.domain} pvelocalhost`
    } else {
      text += `
127.0.1.1 ${options.hostname} ${options.hostname}.${options.domain}`
    }
    text += `
# The following lines are desirable for IPv6 capable hosts
::1     ip6-localhost ip6-loopback
fe00::0 ip6-localnet
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
ff02::3 ip6-allhosts
`
    fs.writeFileSync(file, text)
  }

  /**
   * rsync()
   * @param target
   */
  async egg2system(target: string): Promise<void> {
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
    f += ' --filter="- /boot/grub/device.map"'
    f += ' --filter="- /boot/grub/grub.cfg"'
    f += ' --filter="- /boot/grub/menu.lst"'

    // etc
    f += ' --filter="- /etc/fstab"'
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
  / ${target}`

    console.log('==========================================')
    console.log('egg2system: copyng...')
    console.log('==========================================')
    shx.exec(cmd.trim(), {
      async: false,
    })
  }

  async mkfs(devices: IDevices): Promise<boolean> {
    const result = true
    // devices.root.fsType=`ext4`
    await shx.exec(`mkfs -t ${devices.root.fsType} ${devices.root.device}`, { silent: true })
    await shx.exec(`mkswap ${devices.swap.device}`, { silent: true })
    return result
  }

  async mount4target(target: string, devices: IDevices): Promise<boolean> {
    shx.exec(`mkdir ${target}`, { silent: true })
    shx.exec(`mount ${devices.root.device} ${target}`, { silent: true })
    shx.exec(`tune2fs -c 0 -i 0 ${devices.root.device}`, { silent: true })
    shx.exec(`mount ${devices.efi.device} ${target}${devices.efi.mountPoint}`, { silent: false })
    shx.exec(`rm -rf ${target}/lost+found`, { silent: true })
    return true
  }

  async umount4target(target: string, devices: IDevices): Promise<boolean> {
    console.log('umount4target')

    await shx.exec(`umount ${devices.root.device} ${target}`, { silent: true })
    await shx.exec('sleep 1', { silent: true })
    return true
  }

  /**
   * 
   * @param device 
   */
  async diskPartition(device: string) {
    shx.exec(`parted --script ${device} mklabel msdos`, { silent: true })
    shx.exec(`parted --script --align optimal ${device} mkpart primary 1MiB 95%`, { silent: true })
    shx.exec(`parted --script ${device} set 1 boot on`, { silent: true })
    shx.exec(`parted --script --align optimal ${device} mkpart primary 95% 100%`, { silent: true })
    return true
  }

  /**
 * 
 * @param device 
 */
  /**
   *   /dev/sda1      4096   618495   614400  300M EFI System (flag= boot esp)
   *   /dev/sda2    618496 49333417 48714922 23,2G Linux filesystem
   *   /dev/sda3  49333418 67103504 17770087  8,5G Linux swap
   */
  diskPartitionGpt(device: string): boolean {
    shx.exec(`parted --script ${device} mklabel gpt mkpart primary 0% 1% mkpart primary 1% 95% mkpart primary 95% 100%`)
    shx.exec(`parted --script --align optimal ${device} mkpart primary 0% 1%`, { silent: true })
    shx.exec(`parted --script ${device} set 1 boot on`, { silent: true })
    shx.exec(`parted --script ${device} set 1 esp on`, { silent: true })
    shx.exec(`parted --script --align optimal ${device} mkpart primary 1% 95%`, { silent: true })
    shx.exec(`parted --script --align optimal ${device} mkpart primary 95% 100%`, { silent: true })
    return true
  }

  
  /**
   * 
   * @param device 
   */
  async isRotational(device: string): Promise<boolean> {
    let response: any
    let retVal = false

    response = await shx.exec(`cat /sys/block/${device}/queue/rotational`, { silent: true })
    if (response == '1') {
      retVal = true
    }
    return retVal
  }

  /**
   *
   * @param device
   */
  async getDiskSize(device: string): Promise<number> {
    let response: string
    let bytes: number

    response = shx.exec(`parted -s ${device} unit b print free | grep Free | awk '{print $3}' | cut -d "M" -f1`, { silent: true })
    response = response.replace('B', '').trim()
    bytes = Number(response)
    return bytes
  }

  /**
   *
   * @param msg
   */
  customConfirm(msg: string): Promise<any> {
    return new Promise(function (resolve) {
      const questions: Array<Record<string, any>> = [
        {
          type: 'list',
          name: 'confirm',
          message: msg,
          choices: ['No', 'Yes'],
          default: 'No',
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
   */
  async getOptions(driveList: string[]): Promise<any> {
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
        {
          type: 'input',
          name: 'hostname',
          message: 'hostname: ',
          default: os.hostname,
        },
        {
          type: 'input',
          name: 'domain',
          message: 'domain name: ',
          default: 'lan',
        },
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
        {
          type: 'list',
          name: 'installationDevice',
          message: 'Select the installation disk: ',
          choices: driveList,
          default: driveList[0],
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
}

var ifaces: string[] = fs.readdirSync('/sys/class/net/')
