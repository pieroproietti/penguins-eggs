/**
 * ./src/krill/modules/fstab.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import shx from 'shelljs'
import { InstallationMode } from '../krill_enums.js'

import Pacman from '../../../classes/pacman.js'
import Utils from '../../../classes/utils.js'
import Sequence from '../../classes/sequence.js'
import { SwapChoice } from '../krill_enums.js'

/**
 * fstab()
 * @param devices
 */
export default async function fstab(this: Sequence, installDevice: string, crypted = false) {
  let text = ''

  /**
   * crypttab
   */
  if (this.partitions.installationMode === InstallationMode.Luks) {
    const crypttab = this.installTarget + '/etc/crypttab'
    text += '# /etc/crypttab: mappings for encrypted partitions.\n'
    text += '#\n'
    text += '# Each mapped device will be created in /dev/mapper, so your /etc/fstab\n'
    text += '# should use the /dev/mapper/<name> paths for encrypted devices.\n'
    text += '#\n'
    text += '# See crypttab(5) for the supported syntax.\n'
    text += '#\n'
    text += '# NOTE: You need not list your root (/) partition here, but it must be set up\n'
    text += '#       beforehand by the initramfs (/etc/mkinitcpio.conf). The same applies\n'
    text += '#       to encrypted swap, which should be set up with mkinitcpio-openswap\n'
    text += '#       for resume support.\n'
    text += '#\n'
    text += '# <name>               <device>                         <password> <options>\n'
    text += `#root_crypted was ${this.devices.root.cryptedFrom}\n`
    text += `root_crypted UUID=${Utils.uuid(this.devices.root.cryptedFrom)} none luks,discard\n`
    Utils.write(crypttab, text)
  }



  /**
   * fstab
   */
  if (!Pacman.packageIsInstalled('btrfs-progs')||
        Pacman.packageIsInstalled('btrfsprogs')) {
    this.partitions.filesystemType === 'ext4'
  }

  const fstab = this.installTarget + '/etc/fstab'
  /**
    boot: IDevice
    data: IDevice
    efi: IDevice
    root: IDevice
    swap: IDevice
   */

  let mountOptsBoot = ''
  let mountOptsData = ''
  let mountOptsEfi = ''
  let mountOptsRoot = ''
  let mountOptsSwap = ''

  /**
   * ext4
   */
  if (this.partitions.filesystemType === 'ext4') {
    if (await isRotational(installDevice)) {
      mountOptsBoot = 'defaults,relatime 0 1'
      mountOptsData = 'defaults,relatime 0 1'
      mountOptsEfi = 'defaults,relatime 0 2'
      mountOptsRoot = 'defaults,relatime 0 1'
      mountOptsSwap = 'defaults,relatime 0 2'
    } else {
      mountOptsBoot = 'defaults,noatime 0 1'
      mountOptsData = 'defaults,noatime 0 1'
      mountOptsEfi = 'defaults,noatime 0 2'
      mountOptsRoot = 'defaults,noatime 0 1'
      mountOptsSwap = 'defaults,noatime 0 2'
    }

    /**
     * root must to be defined!
     */
    text += `# root\n`
    text += `# ${this.devices.root.name} ${this.devices.root.mountPoint} ${this.devices.root.fsType} ${mountOptsRoot}\n`
    text += `UUID=${Utils.uuid(this.devices.root.name)} ${this.devices.root.mountPoint} ${this.devices.root.fsType} ${mountOptsRoot}\n`
    text += `\n`

    /**
     * boot can be none or defined!
     */
    if (this.devices.boot.name !== 'none') {
      text += `# boot\n`
      text += `# ${this.devices.boot.name} ${this.devices.boot.mountPoint} ${this.devices.boot.fsType} ${mountOptsBoot}\n`
      text += `UUID=${Utils.uuid(this.devices.boot.name)} ${this.devices.boot.mountPoint} ${this.devices.root.fsType} ${mountOptsBoot}\n`
      text += `\n`
    }

    /**
     * data can be none or defined!
     */
    if (this.devices.data.name !== 'none') {
      text += `# data\n`
      text += `# ${this.devices.data.name} ${this.devices.data.mountPoint} ${this.devices.data.fsType} ${mountOptsData}\n`
      text += `UUID=${Utils.uuid(this.devices.data.name)} ${this.devices.data.mountPoint} ${this.devices.data.fsType} ${mountOptsData}\n`
      text += `\n`
    }


    if (this.efi) {
      /**
       * efi must to be defined
       */
      text += `# efi\n`
      text += `# ${this.devices.efi.name} ${this.devices.efi.mountPoint} vfat ${mountOptsEfi}\n`
      text += `UUID=${Utils.uuid(this.devices.efi.name)} ${this.devices.efi.mountPoint} vfat ${mountOptsEfi}\n`
      text += `\n`
    }

    /**
     * swap can be none, file, defined, undefined
     */
    if (this.devices.swap.name !== undefined) {
      if (this.devices.swap.name !== `none`) {

        if (this.partitions.userSwapChoice == SwapChoice.None) {
          text += `# swap None ${this.partitions.userSwapChoice}\n`
          text += `# no swap configured\n`
          text += `\n`

          // file
        } else if (this.partitions.userSwapChoice == SwapChoice.File) {
          text += `# swap File ${this.partitions.userSwapChoice}\n`
          let swapFile = ``
          text += `# /swapfile none swap sw 0 0\n`
          text += `/swapfile none swap sw 0 0\n`
          text += `\n`

          // others 
        } else {
          text += `# swap ${this.partitions.userSwapChoice}\n`
          text += `# ${this.devices.swap.name} ${this.devices.swap.mountPoint} ${this.devices.swap.fsType} ${mountOptsSwap}\n`
          text += `UUID=${Utils.uuid(this.devices.swap.name)} ${this.devices.swap.mountPoint} ${this.devices.swap.fsType} ${mountOptsSwap}\n`
          text += `\n`
        }
      } else {
        text += `# swap none\n`
      }
    } else {
      text += `# swap undefined\n`
    }

    /**
     * brtfs: TUTTO da rivedere!
     */
  } else if (this.partitions.filesystemType === 'btrfs') {
    const base = '/        btrfs  subvol=/@,defaults 0 0'
    const snapshots = '/.snapshots               btrfs  subvol=/@snapshots,defaults 0 0'
    const home = '/home                     btrfs  subvol=/@home,defaults 0 0'
    const root = '/root                     btrfs  subvol=/@root,defaults 0 0'
    const var_log = '/var/log                  btrfs  subvol=/@var@log,defaults 0 0'
    const var_lib_AccountsService = '/var/lib/AccountsService  btrfs  subvol=/@var@lib@AccountsService,defaults 0 0'
    const var_lib_blueman = '/var/lib/blueman          btrfs  subvol=/@var@lib@blueman,defaults 0 0'
    const tmp = '/tmp                      btrfs  subvol=/@tmp,defaults 0 0'

    text += `# ${this.devices.root.name}  btrfs ${this.devices.root.mountPoint} subvol\n`
    text += `UUID=${Utils.uuid(this.devices.root.name)} ${base}\n`
    text += `# UUID=${Utils.uuid(this.devices.root.name)} ${snapshots}\n`
    text += `# UUID=${Utils.uuid(this.devices.root.name)} ${home}\n`
    text += `# UUID=${Utils.uuid(this.devices.root.name)} ${root}\n`
    text += `# UUID=${Utils.uuid(this.devices.root.name)} ${var_log}\n`
    text += `# UUID=${Utils.uuid(this.devices.root.name)} ${var_lib_AccountsService}\n`
    text += `# UUID=${Utils.uuid(this.devices.root.name)} ${var_lib_blueman}\n`
    text += `# UUID=${Utils.uuid(this.devices.root.name)} ${tmp}\n`
  }
  Utils.write(fstab, text)
}

/**
 * isRotational
 * @param device
 */
async function isRotational(device: string): Promise<boolean> {
  device = device.slice(4)
  let response: any
  let retVal = false

  // Check if the selected disk is a software raid
  if (device.startsWith('md')) {
    // Get the first disk from which the raid is composed
    device = shx.exec(`cat /proc/mdstat | grep ${device} | cut -f 5 -d " " | cut -f 1 -d "["`).stdout.trim()
  }

  response = shx.exec(`cat /sys/block/${device}/queue/rotational`, { silent: true }).stdout.trim()
  if (response === '1') {
    retVal = true
  }

  return retVal
}
