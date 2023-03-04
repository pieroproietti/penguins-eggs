/**
 * krill: module fstab
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import {exec} from '../../lib/utils'
import Utils from '../../classes/utils'
import shx from 'shelljs'

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
    text = ''
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

  const fstab = this.installTarget + '/etc/fstab'
  let mountOptsRoot = ''
  let mountOptsBoot = ''
  let mountOptsData = ''
  let mountOptsEfi = ''
  let mountOptsSwap = ''

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

  text += `# ${this.devices.swap.name} ${this.devices.swap.mountPoint} ${this.devices.swap.fsType} ${mountOptsSwap}\n`
  text += `UUID=${Utils.uuid(this.devices.swap.name)} ${this.devices.swap.mountPoint} ${this.devices.swap.fsType} ${mountOptsSwap}\n`
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

  response = shx.exec(`cat /sys/block/${device}/queue/rotational`, {silent: true}).stdout.trim()
  if (response === '1') {
    retVal = true
  }

  return retVal
}

