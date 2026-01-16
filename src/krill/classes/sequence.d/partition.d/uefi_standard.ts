/**
 * ./src/krill/modules/partition.d/uefi-standard.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import { exec } from '../../../../lib/utils.js'
import Sequence from '../../sequence.js'

export default async function uefiStandard(this: Sequence, installDevice = '', p = ''): Promise<boolean> {
  await exec(`parted --script ${installDevice} mklabel gpt`, this.echo)

  // Partizione EFI: inizia a 1MiB e ha una dimensione di circa 256MiB
  // Finisce a 257MiB per avere uno spazio netto di 256MiB
  await exec(`parted --script ${installDevice} mkpart efi fat32 1MiB 257MiB`, this.echo)
  await exec(`parted --script ${installDevice} mkpart swap linux-swap 257MiB ${this.swapSize + 257}MiB`, this.echo)
  await exec(`parted --script ${installDevice} mkpart root ext4 ${this.swapSize + 257}MiB 100%`, this.echo)
  await exec(`parted --script ${installDevice} set 1 boot on`, this.echo)
  await exec(`parted --script ${installDevice} set 1 esp on`, this.echo)

  this.devices.efi.name = `${installDevice}${p}1`
  this.devices.efi.fsType = 'F 32 -I'
  this.devices.efi.mountPoint = '/boot/efi'

  this.devices.boot.name = 'none'

  this.devices.swap.name = `${installDevice}${p}2`
  this.devices.swap.fsType = 'swap'
  this.devices.swap.mountPoint = 'none'

  this.devices.root.name = `${installDevice}${p}3`
  this.devices.root.fsType = 'ext4'
  this.devices.root.mountPoint = '/'

  // BOOT/DATA/EFI
  this.devices.boot.name = 'none'
  this.devices.data.name = 'none'

  return true
}
