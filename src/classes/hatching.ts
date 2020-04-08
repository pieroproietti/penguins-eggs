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
const exec = require('../lib/utils').exec

/**
 * hatch, installazione
 */
export default class Hatching {

  efi = false
  target = '/tmp/TARGET'

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
      await this.umountVFS(verbose)
      await this.umount4target(devices, verbose)
    }

    const isDiskPrepared: boolean = await this.diskPartition(options.installationDevice, verbose)
    if (isDiskPrepared) {
      await this.mkfs(devices, verbose)
      await this.mount4target(devices, verbose)
      await this.egg2system(devices, verbose)
      await this.setTimezone(verbose)
      await this.fstab(devices, options.installationDevice, verbose)
      await this.hostname(options, verbose)
      await this.resolvConf(options, verbose)
      await this.interfaces(options, verbose)
      await this.hosts(options, verbose)
      await this.mountVFS(verbose)
      await this.updateInitramfs(verbose)
      await this.grubInstall(options, verbose)
      await this.addUser(options.username, options.userpassword, '', '', '', '', verbose)
      await this.changePassword('root', options.rootpassword, verbose)
      await this.autologinConfig('live', options.username, verbose)
      await this.delUserLive(verbose)
      await this.patchPve(verbose)
      await this.umountVFS(verbose)
      await this.umount4target(devices, verbose)
    }
  }

  /**
   * setTimezone
   */
  async setTimezone(verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: setTimezone')
    }

    let cmd = `chroot ${this.target} unlink /etc/localtime`
    await exec(cmd, echo)
    cmd = `chroot ${this.target} ln -sf /usr/share/zoneinfo/Europe/Rome /etc/localtime`
    await exec(cmd, echo)
  }

  /**
   * autologinConfig
   * @param oldUser
   * @param newUser
   */
  async autologinConfig(oldUser = 'live', newUser = 'artisan', verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: autoLoginConfig')
    }

    shx.sed('-i', `autologin-user=${oldUser}`, `autologin-user=${newUser}`, `${this.target}/etc/lightdm/lightdm.conf`)
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
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: addUser')
    }

    const cmd = `chroot ${this.target} \
adduser ${username} \
--home /home/${username} \
--shell /bin/bash \
--disabled-password \
--gecos "${fullName},${roomNumber},${workPhone},${homePhone}"`

    console.log(cmd)
    await exec(cmd, echo)
    await exec(`echo ${username}:${password} | chroot ${this.target} chpasswd `, echo)
    await exec(`chroot ${this.target} addgroup ${username} sudo`, echo)
  }

  /**
   * changePassword
   * @param username 
   * @param newPassword 
   */
  async changePassword(username = 'live', newPassword = 'evolution', verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: changePassword')
    }

    const cmd = `echo ${username}:${newPassword} | chroot ${this.target} chpasswd `
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
  async delUserLive(verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: delUserLive')
    }
    await exec(`chroot ${this.target} deluser live`, echo)
    //shx.exec(`chroot ${target} deluser live`, { silent: true })
  }

  /**
   * patchPve patch per proxypve che non crea la directory
   *          e che ricrea i codici di ssh della macchina
   */
  async patchPve(verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: patchPve')
    }

    // patch per apache2
    await exec(`chroot ${this.target} mkdir /var/log/apache2`)
    await exec(`chroot ${this.target} mkdir /var/log/pveproxy`, echo)
    await exec(`chroot ${this.target} touch /var/log/pveproxy/access.log`, echo)
    await exec(`chroot ${this.target} chown www-data:www-data /var/log/pveproxy -R`, echo)
    await exec(`chroot ${this.target} chmod 0664 /var/log/pveproxy/access.log`, echo)
    await exec(`chroot ${this.target} dpkg-reconfigure openssh-server`, echo)
  }

  /**
   * grubInstall()
   * @param target
   * @param options
   */
  async grubInstall(options: any, verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: grubInstall')
    }
    await exec (`chroot ${this.target} apt update`)
    if (this.efi){
      await exec(`chroot ${this.target} apt install grub-efi-amd64 --yes`)
    } else {
      await exec (`chroot ${this.target} apt install grub-pc --yes`)
    }
    await exec(`chroot ${this.target} grub-install ${options.installationDevice}`, echo)
    await exec(`chroot ${this.target} update-grub`, echo)
  }

  /**
   * updateInitramfs()
   */
  async updateInitramfs(verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: updateInitramfs')
    }

    console.log('update-initramfs\n')
    await exec(`chroot ${this.target}  update-initramfs -u -k $(uname -r)`, echo)
  }

  /**
   * mountVFS()
   */
  async mountVFS(verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: mountVFS')
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
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: umountVFS')
    }

    await exec(`umount ${this.target}/dev/pts`, echo)
    await exec('sleep 1', echo)
    await exec(`umount ${this.target}/dev`, echo)
    await exec('sleep 1', echo)
    await exec(`umount ${this.target}/proc`, echo)
    await exec('sleep 1', echo)
    await exec(`umount ${this.target}/sys`, echo)
    await exec('sleep 1', echo)
    await exec(`umount ${this.target}/run`, echo)
    await exec('sleep 1', echo)
  }

  /**
   * fstab()
   * @param devices
   */
  async fstab(devices: IDevices, installDevice: string, verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: fstab')
    }

    const file = `${this.target}/etc/fstab`
    let mountOptsRoot = ''
    let mountOptsEfi = ''
    let mountOptsSwap = ''

    if (await this.isRotational(installDevice)) {
      mountOptsRoot = 'defaults,relatime 0 1'
      mountOptsEfi = 'defaults,relatime 0 2'
      mountOptsSwap = 'defaults,relatime 0 2'
    } else {
      mountOptsRoot = 'defaults,noatime 0 1'
      mountOptsEfi = 'defaults,noatime 0 2'
      mountOptsSwap = 'defaults,noatime 0 2'
    }
    let text = ''
    text += `${devices.root.device} ${devices.root.mountPoint} ${devices.root.fsType} ${mountOptsRoot}\n`
    if (this.efi) {
      text += `${devices.efi.device} ${devices.efi.mountPoint} vfat ${mountOptsEfi}\n`
    }
    text += `${devices.swap.device} ${devices.swap.mountPoint} ${devices.swap.fsType} ${mountOptsSwap}\n`
    Utils.write(file, text)
  }

  /**
   * hostname()
   * @param options
   */
  async hostname(options: any, verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: hostname')
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
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: resolvConf')
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
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: interfaces')
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
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: hosts')
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
   * rsync()
   */
  async egg2system(devices: IDevices, verbose = false): Promise<void> {
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

    cmd = `\
  rsync \
  --archive \
  --delete-before \
  --delete-excluded \
  ${f} \
  / ${this.target}`

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
   * @param devices 
   */
  async mount4target(devices: IDevices, verbose = false): Promise<boolean> {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: mount4target')
    }

    if (!fs.existsSync(this.target)) {
      await exec(`mkdir ${this.target}`, echo)
    }
    await exec(`mount ${devices.root.device} ${this.target}${devices.root.mountPoint}`, echo)
    await exec(`tune2fs -c 0 -i 0 ${devices.root.device}`, echo)
    if (this.efi) {
      if (!fs.existsSync(this.target + devices.efi.mountPoint)) {
        await exec(`mkdir ${this.target}${devices.efi.mountPoint} -p`, echo)
      }
      await exec(`mount ${devices.efi.device} ${this.target}${devices.efi.mountPoint}`, echo)
    }
    await exec(`rm -rf ${this.target}/lost+found`, echo)
    return true
  }

  /**
   * 
   * @param target 
   * @param devices 
   */
  async umount4target(devices: IDevices, verbose = false): Promise<boolean> {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('hatching: umount4target')
    }

    if (this.efi) {
      await exec(`umount ${this.target}/boot/efi`, echo)
      await exec('sleep 1', echo)
    }
    await exec(`umount ${devices.root.device}`, echo)
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
      console.log('efi system')
      await exec(`parted --script ${device} mklabel gpt mkpart primary 0% 1% mkpart primary 1% 95% mkpart primary 95% 100%`, echo)
      await exec(`parted --script ${device} set 1 boot on`, echo)
      await exec(`parted --script ${device} set 1 esp on`, echo)
    } else {
      console.log('bios system')
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

    // response = await exec(`cat /sys/block/${device}/queue/rotational`, { capture: true, echo: true })
    response = shx.exec(`cat /sys/block/${device}/queue/rotational`, {silent: verbose}).stdout.trim()
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
