/**
 * penguins-eggs: hatch.js
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 * https://codeburst.io/how-to-build-a-command-line-app-in-node-js-using-typescript-google-cloud-functions-and-firebase-4c13b1699a27
 *
 */

/**************************************************
 * Struttura del mio iso
 * boot     -> nn
 * EFI      -> nn
 * isolinux -> tutto per boot isolinux
 * live     -> filesystem.squashfs
 *          -> initrd.img
 *          -> vmlinuz
 ************************************************
 * Struttura iso antiX
 * antiX  ->initrd.gz
 *        ->linuzfs
 *        ->vmlinuz
 * boot   ->grub      -> tutto grub
 *        ->isolinux  -> tutto isolinux
 *        ->syslinux  ->
 *        ->uefi-mt   -> mtest32 mtest64
 *        ->memtest
 * EFI    ->BOOT      ->BOOTia32.efi
 *                    ->BOOTia64.efi
 *                    ->grubx64.efi
 * egg-x64-etc...     ->package.list
 *************************************************
 * Struttura di iso-template
 *************************************************
 * tar xf /usr/lib/iso-template/iso-template.tar.gz
 *************************************************
 * antiX  vuota
 * boot   ->grub      -> tutto grub
 *        ->isolinux  -> tutto isolinux
 *        ->syslinux  ->
 *        ->uefi-mt   -> mtest32 mtest64
 *        ->memtest
 * EFI    ->BOOT      ->BOOTia32.efi
 *                    ->BOOTia64.efi
 *                    ->grubx64.efi
 *************************************************
 * inoltre è presente 
 *************************************************
 * template-initrd.gz che pari pari è initrd.gz 
 * e dove sta tutto il sistema di menu iniziale
 *************************************************/

import shell = require('shelljs')
import fs = require('fs')
import os = require('os')
import inquirer = require('inquirer')
import drivelist = require('drivelist')
import Utils from './utils'
import { IDrivelist, IDevices, IDevice } from '../interfaces'

/**
 * hatch, installazione
 */
export default class Hatching {

  constructor() {
    console.log('constructor di hatching')
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
    const target = '/TARGET'
    const devices = {} as IDevices
    devices.root = {} as IDevice
    devices.swap = {} as IDevice

    const drives: any = await drivelist.list()
    let aDrives: string[]
    drives.forEach((element: { device: string[] }) => {
      aDrives = element.device
    })
    console.log(aDrives)

    const varOptions: any = await this.getOptions(aDrives)
    const options: any = JSON.parse(varOptions)

    devices.root.device = `${options.installationDevice}1`
    devices.root.fsType = 'ext4'
    devices.root.mountPoint = '/'
    devices.swap.device = `${options.installationDevice}2`
    devices.swap.fsType = 'swap'
    devices.swap.mountPoint = 'none'

    const diskSize = this.getDiskSize(options.installationDevice)
    console.log(`diskSize: ${diskSize}`)

    const isDiskPrepared: boolean = await diskPartition(options.installationDevice)
    if (isDiskPrepared) {
      await this.mkfs(devices)
      await this.mount4target(target, devices)
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

      // await Utils.addUser(target, options.username, options.userpassword)
      // await Utils.changePassword(target, 'root', options.rootpassword)
      await this.autologinConfig(target, 'live', options.username)

      await this.delUserLive(target)
      await this.patchPve(target)
      await this.mountVFS(target)
      await this.umount4target(target, devices)
    }
  }

  /**
   * setTimezone
   * @param target
   */
  async setTimezone(target: string) {
    let cmd = `chroot ${target} unlink /etc/localtime`
    Utils.shxExec(cmd)
    cmd = `chroot ${target} ln -sf /usr/share/zoneinfo/Europe/Rome /etc/localtime`
    Utils.shxExec(cmd)
  }

  /**
   * autologinConfig 
   * @param target 
   * @param oldUser 
   * @param newUser 
   */
  static async autologinConfig(target: string, oldUser = 'live', newUser = 'artisan') {
    await Utils.shxExec(`sed -i "/autologin-user/s/=${oldUser}/=${newUser}/" ${target}/etc/lightdm/lightdm.conf`)
  }

  /**
   * delUserLive
   */
  static async delUserLive(target: string) {
    await Utils.shxExec(`chroot ${target} deluser live`)
  }

  /**
   * patchPve patch per proxypve che non crea la directory
   *          e che ricrea i codici di ssh della macchina
   * @param target
   */
  static async patchPve(target: string) {
    // patch per apache2
    await Utils.shxExec(`chroot ${target} mkdir /var/log/apache2`)

    await Utils.shxExec(`chroot ${target} mkdir /var/log/pveproxy`)
    await Utils.shxExec(`chroot ${target} touch /var/log/pveproxy/access.log`)
    await Utils.shxExec(`chroot ${target} chown www-data:www-data /var/log/pveproxy -R`)
    await Utils.shxExec(`chroot ${target} chmod 0664 /var/log/pveproxy/access.log`)
    await Utils.shxExec(`chroot ${target} dpkg-reconfigure openssh-server`)
  }

  /**
   * grubInstall()
   * @param target
   * @param options
   */
  static async grubInstall(target: string, options: any) {
    console.log('grub-install')
    await Utils.shxExec(`chroot ${target} grub-install ${options.installationDevice}`)
    console.log('update-grub')
    await Utils.shxExec(`chroot ${target} update-grub`)
  }

  /**
   * updateInitramfs()
   * @param target
   */
  static async updateInitramfs(target: string) {
    console.log('update-initramfs/n')
    await Utils.shxExec(`chroot ${target}  update-initramfs -u -k $(uname -r)`)
  }

  /**
   * mountVFS()
   * @param target
   */
  static async mountVFS(target: string) {
    console.log('mount VFS')
    await Utils.shxExec(`mount -o bind /dev ${target}/dev`)
    await Utils.shxExec(`mount -o bind /devpts ${target}/dev/pts`)
    await Utils.shxExec(`mount -o bind /proc ${target}/proc`)
    await Utils.shxExec(`mount -o bind /sys ${target}/sys`)
    await Utils.shxExec(`mount -o bind /run ${target}/run`)
  }

  /**
   * umountVFS()
   * @param target
   */
  static async umountVFS(target: string) {
    console.log('umount VFS')
    await Utils.shxExec(`umount ${target}/dev/pts`)
    await Utils.shxExec('sleep 1')
    await Utils.shxExec(`umount ${target}/dev`)
    await Utils.shxExec('sleep 1')
    await Utils.shxExec(`umount ${target}/proc`)
    await Utils.shxExec('sleep 1')
    await Utils.shxExec(`umount ${target}/sys`)
    await Utils.shxExec('sleep 1')
    await Utils.shxExec(`umount ${target}/run`)
    await Utils.shxExec('sleep 1')
  }

  /**
   * fstab()
   * @param target
   * @param devices
   */
  static async fstab(target: string, devices: IDevices, installDevice: string) {
    const file = `${target}/etc/fstab`
    let mountOptsRoot = ''
    let mountOptsSwap = ''

    if (await isRotational(installDevice)) {
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
    // Utils.write(file, text)
  }

  /**
   * hostname()
   * @param target
   * @param options
   */
  static async hostname(target: string, options: any) {
    const file = `${target}/etc/hostname`
    const text = options.hostname

    Utils.shxExec(`rm ${target}/etc/hostname`)
    fs.writeFileSync(file, text)
  }

  /**
   * resolvConf()
   * @param target
   * @param options
   */
  static async resolvConf(target: string, options: any) {
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
  static async interfaces(target: string, options: any) {
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
  static async hosts(target: string, options: any) {
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
  static async egg2system(target: string): Promise<void> {
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
    f += ' --filter="- /TARGET"'

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
    shell.exec(cmd.trim(), {
      async: false,
    })
  }

  static async mkfs(devices: IDevices): Promise<boolean> {
    const result = true
    // devices.root.fsType=`ext4`
    await Utils.shxExec(`mkfs -t ${devices.root.fsType} ${devices.root.device}`)
    await Utils.shxExec(`mkswap ${devices.swap.device}`)
    return result
  }

  static async mount4target(target: string, devices: IDevices): Promise<boolean> {
    await Utils.shxExec(`mkdir ${target}`)
    await Utils.shxExec(`mount ${devices.root.device} ${target}`)
    await Utils.shxExec(`tune2fs -c 0 -i 0 ${devices.root.device}`)
    await Utils.shxExec(`rm -rf ${target}/lost+found`)

    return true
  }

  static async umount4target(target: string, devices: IDevices): Promise<boolean> {
    console.log('umount4target')

    await Utils.shxExec(`umount ${devices.root.device} ${target}`)
    await Utils.shxExec('sleep 1')
    return true
  }

  static async diskPartition(device: string) {
    await Utils.shxExec(`parted --script ${device} mklabel msdos`)
    await Utils.shxExec(`parted --script --align optimal ${device} mkpart primary 1MiB 95%`)
    await Utils.shxExec(`parted --script ${device} set 1 boot on`)
    await Utils.shxExec(`parted --script --align optimal ${device} mkpart primary 95% 100%`)
    return true
  }

  static async isRotational(device: string): Promise<boolean> {
    let response: any
    let retVal = false

    response = await Utils.shxExec(`cat /sys/block/${device}/queue/rotational`)
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

    response = await Utils.shxExec(`parted -s ${device} unit b print free | grep Free | awk '{print $3}' | cut -d "M" -f1`)
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
          default: driveList[0]
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