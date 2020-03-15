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
import { SSL_OP_EPHEMERAL_RSA } from 'constants'
import { timingSafeEqual } from 'crypto'
const exec = require('../lib/utils').exec

/**
 * hatch, installazione
 */
export default class Hatching {

  efi = false

  constructor() {
  }

  /**
   * question
   */
  async question(verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: question')
    }

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
  async install(verbose = false, umount = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: install')
    }

    const target = '/tmp/TARGET'
    const devices = {} as IDevices

    devices.efi = {} as IDevice
    devices.root = {} as IDevice
    devices.swap = {} as IDevice

    const drives: any = await drivelist.list()

    const aDrives: string[] = []
    drives.forEach((element: { device: string }) => {
      aDrives.push(element.device)
    })
    const varOptions: any = await this.getOptions(aDrives)
    const options: any = JSON.parse(varOptions)

    if (fs.existsSync('/sys/firmware/efi/efivars')) {
      this.efi = true
    }

    console.log(`System EFI: ${this.efi}`)
    
    if (this.efi) {
      devices.efi.device = `${options.installationDevice}1`
      devices.efi.fsType = 'F 32 -I'
      devices.efi.mountPoint = '/boot/efi'

      devices.root.device = `${options.installationDevice}2`
      devices.root.fsType = 'ext4'
      devices.root.mountPoint = '/'

      devices.swap.device = `${options.installationDevice}3`
      devices.swap.fsType = 'swap'
      devices.swap.mountPoint = 'none'
    } else {
      devices.root.device = `${options.installationDevice}1`
      devices.root.fsType = 'ext4'
      devices.root.mountPoint = '/'

      devices.swap.device = `${options.installationDevice}2`
      devices.swap.fsType = 'swap'
      devices.swap.mountPoint = 'none'
    }

    const diskSize = await this.getDiskSize(options.installationDevice, verbose)
    console.log(`diskSize: ${diskSize}`)


    if (umount) {
      await this.umountVFS(target, verbose)
      await this.umount4target(target, devices, verbose)
    }

    const isDiskPrepared: boolean = await this.diskPartition(options.installationDevice, verbose)
    if (isDiskPrepared) {
      await this.mkfs(devices, verbose)
      await this.mount4target(target, devices, verbose)
      await this.egg2system(target, devices, verbose)
      await this.setTimezone(target, verbose)
      await this.fstab(target, devices, options.installationDevice, verbose)
      await this.hostname(target, options, verbose)
      await this.resolvConf(target, options, verbose)
      await this.interfaces(target, options, verbose)
      await this.hosts(target, options, verbose)
      await this.mountVFS(target, verbose)
      await this.updateInitramfs(target, verbose)
      await this.grubInstall(target, options, verbose)
      await this.addUser(target, options.username, options.userpassword, verbose)
      await this.changePassword(target, 'root', options.rootpassword, verbose)
      await this.autologinConfig(target, 'live', options.username, verbose)
      await this.delUserLive(target, verbose)
      await this.patchPve(target, verbose)
      await this.umountVFS(target, verbose)
      await this.umount4target(target, devices, verbose)
    }
  }

  /**
   * setTimezone
   * @param target
   */
  async setTimezone(target: string, verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: setTimezone')
    }

    let cmd = `chroot ${target} unlink /etc/localtime`
    await exec(cmd, echo)
    cmd = `chroot ${target} ln -sf /usr/share/zoneinfo/Europe/Rome /etc/localtime`
    await exec(cmd, echo)
  }

  /**
   * autologinConfig
   * @param target
   * @param oldUser
   * @param newUser
   */
  async autologinConfig(target: string, oldUser = 'live', newUser = 'artisan', verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: autoLoginConfig')
    }

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
  async addUser(target = '/tmp/TARGET', username = 'live', password = 'evolution', fullName = '', roomNumber = '', workPhone = '', homePhone = '', verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: addUser')
    }


    const cmd = `sudo chroot ${target} adduser ${username}\
                                  --home /home/${username} \
                                  --shell /bin/bash \
                                  --disabled-password \
                                  --gecos "${fullName},\
                                          ${roomNumber},\
                                          ${workPhone},\
                                          ${homePhone}"`

    await exec(cmd, echo)
    await exec(`echo ${username}:${password} | chroot ${target} chpasswd `, echo)
    await exec(`chroot ${target} addgroup ${username} sudo`, echo)
  }

  /**
   * changePassword
   * @param target 
   * @param username 
   * @param newPassword 
   */
  async changePassword(target = '/tmp/TARGET', username = 'live', newPassword = 'evolution', verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: changePassword')
    }

    const cmd = `echo ${username}:${newPassword} | chroot ${target} chpasswd `
    await exec(cmd, echo)
  }

  /**
   * delete username
   * @param username 
   */
  async delUser(username = 'live', verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: delUser')
    }

    const cmd = `deluser ${username}`
    await exec(cmd, echo)
  }

  /**
   * delUserLive
   */
  async delUserLive(target: string, verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: delUserLive')
    }

    shx.exec(`chroot ${target} deluser live`, { silent: true })
  }

  /**
   * patchPve patch per proxypve che non crea la directory
   *          e che ricrea i codici di ssh della macchina
   * @param target
   */
  async patchPve(target: string, verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: patchPve')
    }

    // patch per apache2
    await exec(`chroot ${target} mkdir /var/log/apache2`)
    await exec(`chroot ${target} mkdir /var/log/pveproxy`, echo)
    await exec(`chroot ${target} touch /var/log/pveproxy/access.log`, echo)
    await exec(`chroot ${target} chown www-data:www-data /var/log/pveproxy -R`, echo)
    await exec(`chroot ${target} chmod 0664 /var/log/pveproxy/access.log`, echo)
    await exec(`chroot ${target} dpkg-reconfigure openssh-server`, echo)
  }

  /**
   * grubInstall()
   * @param target
   * @param options
   */
  async grubInstall(target: string, options: any, verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: grubInstall')
    }

    await exec(`chroot ${target} grub-install ${options.installationDevice}`, echo)
    await exec(`chroot ${target} update-grub`, echo)
  }

  /**
   * updateInitramfs()
   * @param target
   */
  async updateInitramfs(target: string, verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: updateInitramfs')
    }

    console.log('update-initramfs/n')
    await exec(`chroot ${target}  update-initramfs -u -k $(uname -r)`, echo)
  }

  /**
   * mountVFS()
   * @param target
   */
  async mountVFS(target: string, verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: mountVFS')
    }

    console.log('mount VFS')
    await exec(`mount -o bind /dev ${target}/dev`, echo)
    await exec(`mount -o bind /devpts ${target}/dev/pts`, echo)
    await exec(`mount -o bind /proc ${target}/proc`, echo)
    await exec(`mount -o bind /sys ${target}/sys`, echo)
    await exec(`mount -o bind /run ${target}/run`, echo)
  }

  /**
   * umountVFS()
   * @param target
   */
  async umountVFS(target: string, verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: umountVFS')
    }

    console.log('umount VFS')
    await exec(`umount ${target}/dev/pts`, { silent: true })
    await exec('sleep 1', echo)
    await exec(`umount ${target}/dev`, echo)
    await exec('sleep 1', echo)
    await exec(`umount ${target}/proc`, echo)
    await exec('sleep 1', echo)
    await exec(`umount ${target}/sys`, echo)
    await exec('sleep 1', echo)
    await exec(`umount ${target}/run`, echo)
    await exec('sleep 1', echo)
  }

  /**
   * fstab()
   * @param target
   * @param devices
   */
  async fstab(target: string, devices: IDevices, installDevice: string, verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: fstab')
    }

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
${devices.efi.device} ${devices.efi.mountPoint} fat32 ${mountOptsRoot}
${devices.swap.device} ${devices.swap.mountPoint} ${devices.swap.fsType} ${mountOptsSwap}`

    Utils.write(file, text)
  }

  /**
   * hostname()
   * @param target
   * @param options
   */
  async hostname(target: string, options: any, verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: hostname')
    }

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
  async resolvConf(target: string, options: any, verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: resolvConf')
    }

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
  async interfaces(target: string, options: any, verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: interfaces')
    }

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
  async hosts(target: string, options: any, verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: hosts')
    }

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
  async egg2system(target: string, devices: IDevices, verbose = false): Promise<void> {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: egg2system')
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
    f += ` --filter="- /boot/efi*"` //${devices.efi.mountPoint}


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

  /**
   * 
   * @param devices 
   */
  async mkfs(devices: IDevices, verbose = false): Promise<boolean> {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: mkfs')
    }

    const result = true
    if (this.efi){
      await exec(`mkdosfs -F 32 -I ${devices.efi.device}`, echo)
    }
    await exec(`mkfs -t ${devices.root.fsType} ${devices.root.device}`, echo)
    await exec(`mkswap ${devices.swap.device}`, echo)
    return result
  }

  /**
   * 
   * @param target 
   * @param devices 
   */
  async mount4target(target: string, devices: IDevices, verbose = false): Promise<boolean> {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: mount4target')
    }

    if (!fs.existsSync(target)) {
      await exec(`mkdir ${target}`, echo)
    }
    await exec(`mount ${devices.root.device} ${target}${devices.root.mountPoint}`, echo)
    await exec(`tune2fs -c 0 -i 0 ${devices.root.device}`, echo)
    if (this.efi) {
      if (!fs.existsSync(target + devices.efi.mountPoint)) {
        await exec(`mkdir ${target}${devices.efi.mountPoint} -p`, echo)
      }
      await exec(`mount ${devices.efi.device} ${target}${devices.efi.mountPoint}`, echo)
    }
    await exec(`rm -rf ${target}/lost+found`, echo)
    return true
  }

  /**
   * 
   * @param target 
   * @param devices 
   */
  async umount4target(target: string, devices: IDevices, verbose = false): Promise<boolean> {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: umount4target')
    }

    if (this.efi) {
      await exec(`umount ${target}/boot/efi`, echo)
      await exec('sleep 1', echo)
    }
    await exec(`umount ${devices.root.device} ${target}`, echo)
    await exec('sleep 1', echo)
    return true
  }

  /**
   * 
   * @param device 
   */
  async diskPartition(device: string, verbose = false): Promise<boolean> {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: diskPartition')
    }

    if (this.efi){
      await exec(`parted --script ${device} mklabel gpt mkpart primary 0% 1% mkpart primary 1% 95% mkpart primary 95% 100%`, echo)
      await exec(`parted --script ${device} set 1 boot on`, echo)
      await exec(`parted --script ${device} set 1 esp on`, echo)
    } else {
      await exec(`parted --script ${device} mklabel msdos`, echo)
      await exec(`parted --script --align optimal ${device} mkpart primary 1MiB 95%`, echo)
      await exec(`parted --script ${device} set 1 boot on`, echo)
      await exec(`parted --script --align optimal ${device} mkpart primary 95% 100%`, echo)
    }
    return true
  }


  /**
   * 
   * @param device 
   */
  async isRotational(device: string, verbose = false): Promise<boolean> {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: isRotational')
    }

    device = device.substring(4)
    console.log(`device: ${device}`)
    let response: any
    let retVal = false

    response = await exec(`cat /sys/block/${device}/queue/rotational`, { capture: true, echo: true })
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
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: getDiskSize')
    }

    let bytes: number
    interface IResponse {
      code: number;
      data: string;
    }
    let response = {} as IResponse
    response = await exec(`parted -s ${device} unit b print free | grep Free | awk '{print $3}' | cut -d "M" -f1`, { echo: false, ignore: false, capture: true })
    let data = ''
    if (response.code === 0) {
      data = response.data
      data = data.replace('B', '').trim()
      console.log(data)
    } else {
      data = '0'
    }

    bytes = Number(data)
    return bytes
  }

  /**
   *
   * @param msg
   */
  customConfirm(msg: string, verbose = false): Promise<any> {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: customConfirm')
    }

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
  async getOptions(driveList: string[], verbose = false): Promise<any> {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: getOptions')
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
