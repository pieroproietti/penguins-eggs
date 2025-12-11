/**
 * ./src/krill/modules/mkfs.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import { exec, shx } from '../../../lib/utils.js'
import { InstallationMode, SwapChoice } from '../krill_enums.js'
import Sequence from '../../classes/sequence.js'
import Utils from '../../../classes/utils.js'
import { execFileSync } from 'node:child_process'


/**
 * mkfs
 * 
 * mkfs - create an ext2/ext3/ext4/btrfs
 */
export default async function mkfs(this: Sequence): Promise<boolean> {
  const result = true

  if (this.partitions.installationMode === InstallationMode.Replace) {
    /**
     * we need to define this.devices
     */
    this.devices.root.name = this.partitions.replacedPartition
    this.devices.root.mountPoint = '/'
    this.devices.root.fsType = this.partitions.filesystemType
    this.devices.boot.name = 'none' // OK
    this.devices.data.name = 'none' // OK
    this.partitions.userSwapChoice = SwapChoice.File
    this.devices.swap.name = 'file' // OK
    this.devices.efi.name='none'
    if (this.efi) {
      // usare shx.exec qui
      const efiDetectCmd = `fdisk -l | grep 'EFI System' | awk '{print $1}'`
      const efiName = shx.exec(efiDetectCmd. {silent: true}).stdout.trim()
      if (efiName) {
        this.devices.efi.name = efiName
        this.devices.efi.mountPoint = '/boot/efi'
      } else {
        this.devices.efi.name = 'none'
      }
    }
  }


  if (this.partitions.filesystemType === 'ext4') {

    /**
     * EFI
     */
    if (this.efi) {
      await exec(`mkfs.vfat -F 32 ${this.devices.efi.name} ${this.toNull}`, this.echo)
    }

    // boot
    if (this.devices.boot.name !== 'none') {
      if (this.devices.boot.fsType === undefined) {
        this.devices.boot.fsType = 'ext2'
        this.devices.boot.mountPoint = '/boot'
      }
      // await exec(`mke2fs -Ft ${this.devices.boot.fsType} ${this.devices.boot.name} ${this.toNull}`, this.echo)
      await exec(`mkfs.${this.devices.boot.fsType} -F ${this.devices.boot.name} ${this.toNull}`, this.echo)
    }

    // root 
    if (this.devices.root.name !== 'none') {
      // await exec(`mke2fs -Ft ${this.devices.root.fsType} ${this.devices.root.name} ${this.toNull}`, this.echo)
      await exec(`mkfs.ext4 -F ${this.devices.root.name} ${this.toNull}`, this.echo)
    }

    // data
    if (this.devices.data.name !== 'none') {
    } 
    
    // swap
    if (this.partitions.userSwapChoice === SwapChoice.File) {
      // we'll create it on mount-fs
      
    } else if (this.devices.swap.name !== 'none') {
      await exec(`mkswap ${this.devices.swap.name} ${this.toNull}`, this.echo)
    } 


  } else if (this.partitions.filesystemType === 'btrfs') {
    await exec(`mkfs.btrfs -f btrfs ${this.devices.root.name} ${this.toNull}`, this.echo)
    
    // Monta temporaneamente il volume Btrfs
    await exec(`mount ${this.devices.root.name} /mnt`)
    await exec(`btrfs subvolume create /mnt/@/`)
    await exec(`btrfs subvolume create /mnt/@home`)
    await exec(`btrfs subvolume create /mnt/@cache`)
    await exec(`btrfs subvolume create /mnt/@log`)

    // Smonta /mnt
    await exec(`umount /mnt`)
  }

  return result
}
