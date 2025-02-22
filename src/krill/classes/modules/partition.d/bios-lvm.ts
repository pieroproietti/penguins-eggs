/**
 * ./src/krill/modules/partition.d/bios-lvm.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import { exec } from '../../../../lib/utils.js'
import Sequence from '../../sequence.js'
//import createLvmPartitions from './create-lvm-partitions.js'
import { SwapChoice, InstallationMode } from '../../krill-enums.js'

/**
 * 
 * @param this 
 * @param installDevice 
 * @param p 
 * @returns 
 */
export default async function biosLvm(this: Sequence, installDevice = "", p = ""): Promise<boolean> {
  // Creo partizioni
  await exec(`parted --script ${installDevice} mklabel msdos`, this.echo)
  await exec(`parted --script ${installDevice} mkpart primary ext2 1 512`, this.echo) // sda1
  await exec(`parted --script --align optimal ${installDevice} mkpart primary ${this.partitions.filesystemType} 512 100%`, this.echo) // sda2
  await exec(`parted --script ${installDevice} set 1 boot on`, this.echo) // sda1
  await exec(`parted --script ${installDevice} set 2 lvm on`, this.echo) // sda2

  
  this.devices = await this.createLvmPartitions(installDevice)

  if (this.partitions.userSwapChoice == SwapChoice.File) {
    this.devices.swap.name = 'swap.img'
    this.devices.swap.mountPoint = '/'
  }

  this.devices.boot.fsType = 'ext2'
  this.devices.boot.mountPoint = '/boot'
  this.devices.boot.name = `${installDevice}${p}1`
  this.devices.efi.name = 'none'
  
  return true
}
