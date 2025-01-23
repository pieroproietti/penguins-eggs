/**
 * ./src/krill/modules/fstab.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import shx from 'shelljs'

import Pacman from '../../classes/pacman.js'
import Utils from '../../classes/utils.js'
import Sequence from '../sequence.js'
import { SwapChoice } from '../../enum/e-krill.js'

/**
 * fstab()
 * @param devices
 */
export default async function fstab(this: Sequence, installDevice: string, crypted = false) {
  let text = ''

  /**
   * crypttab
   */
  if (this.partitions.installationMode === 'full-encrypted') {
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
    text += `#swap_crypted was ${this.devices.swap.cryptedFrom}\n`
    text += `swap_crypted UUID=${Utils.uuid(this.devices.swap.cryptedFrom)} none luks,discard\n`
    text += `#root_crypted was ${this.devices.root.cryptedFrom}\n`
    text += `root_crypted UUID=${Utils.uuid(this.devices.root.cryptedFrom)} none luks,swap\n`

    Utils.write(crypttab, text)
  }

  /**
   * fstab
   */
  if (!Pacman.packageIsInstalled('btrfs-progs')) {
    this.partitions.filesystemType === 'ext4'
  }

  const fstab = this.installTarget + '/etc/fstab'
  let mountOptsRoot = ''
  let mountOptsBoot = ''
  let mountOptsData = ''
  let mountOptsEfi = ''
  let mountOptsSwap = ''

  if (this.partitions.filesystemType === 'ext4') {
    if (await isRotational(installDevice)) {
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

    text = ''
    text += `# ${this.devices.root.name} ${this.devices.root.mountPoint} ${this.devices.root.fsType} ${mountOptsRoot}\n`
    text += `UUID=${Utils.uuid(this.devices.root.name)} ${this.devices.root.mountPoint} ${this.devices.root.fsType} ${mountOptsRoot}\n`

    if (this.devices.boot.name !== 'none') {
      text += `# ${this.devices.boot.name} ${this.devices.boot.mountPoint} ${this.devices.boot.fsType} ${mountOptsBoot}\n`
      text += `UUID=${Utils.uuid(this.devices.boot.name)} ${this.devices.boot.mountPoint} ${this.devices.root.fsType} ${mountOptsBoot}\n`
    }

    if (this.devices.data.name !== 'none') {
      text += `# ${this.devices.data.name} ${this.devices.data.mountPoint} ${this.devices.data.fsType} ${mountOptsData}\n`
      text += `UUID=${Utils.uuid(this.devices.data.name)} ${this.devices.data.mountPoint} ${this.devices.data.fsType} ${mountOptsData}\n`
    }

    if (this.efi) {
      text += `# ${this.devices.efi.name} ${this.devices.efi.mountPoint} vfat ${mountOptsEfi}\n`
      text += `UUID=${Utils.uuid(this.devices.efi.name)} ${this.devices.efi.mountPoint} vfat ${mountOptsEfi}\n`
    }

    if (this.partitions.userSwapChoice == SwapChoice.File) {
      
      let swapFile = ''
      if (this.devices.swap.mountPoint.endsWith('/')) {
        swapFile = `${this.devices.swap.mountPoint}${this.devices.swap.name}`
      } else {
        swapFile = `${this.devices.swap.mountPoint}/${this.devices.swap.name}`
      }

      text += `# ${swapFile} none ${this.devices.swap.fsType} ${mountOptsSwap}\n`
      text += `${swapFile} none ${this.devices.swap.fsType} ${mountOptsSwap}\n`
    } else {
      text += `# ${this.devices.swap.name} ${this.devices.swap.mountPoint} ${this.devices.swap.fsType} ${mountOptsSwap}\n`
      text += `UUID=${Utils.uuid(this.devices.swap.name)} ${this.devices.swap.mountPoint} ${this.devices.swap.fsType} ${mountOptsSwap}\n`
    }
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
  //console.log(text)
  //Utils.pressKeyToExit()
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
