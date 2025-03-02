/**
 * ./src/krill/modules/partition.d/uefi-lvm.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import { exec } from '../../../../lib/utils.js'
import Sequence from '../../sequence.js'
import createLvmPartitions from './create-lvm-partitions.js'
import { SwapChoice, InstallationMode } from '../../krill-enums.js'

/**
 * 
 * @param this 
 * @param installDevice 
 * @param p 
 * @returns 
 */
export default async function uefiLvm(this: Sequence, installDevice = "", p = ""): Promise<boolean> {
    /**
     * ===========================================================================================
     * UEFI/Lmv2: working
     * ===========================================================================================
     */
    await exec(`parted --script ${installDevice} mklabel gpt`, this.echo)
    await exec(`parted --script ${installDevice} mkpart efi  fat32    34s   256MiB`, this.echo) // sda1 EFI
    await exec(`parted --script ${installDevice} mkpart boot ext2  256MiB   768MiB`, this.echo) // sda2 boot
    await exec(`parted --script ${installDevice} mkpart lvm ${this.partitions.filesystemType} 768MiB     100%`, this.echo) // sda3 lmv2
    await exec(`parted --script ${installDevice} set 1 boot on`, this.echo) // sda1
    await exec(`parted --script ${installDevice} set 1 esp on`, this.echo) // sda1
    await exec(`parted --script ${installDevice} set 3 lvm on`, this.echo) // sda3

    this.devices = await this.createLvmPartitions(installDevice)

    if (this.partitions.userSwapChoice == SwapChoice.File) {
        this.devices.swap.name = '/swapfile'
        this.devices.swap.mountPoint = '/'
    }

    this.devices.efi.name = `${installDevice}${p}1`
    this.devices.efi.fsType = 'F 32 -I'
    this.devices.efi.mountPoint = '/boot/efi'

    this.devices.boot.name = `${installDevice}${p}2`
    this.devices.boot.fsType = 'ext4'
    this.devices.boot.mountPoint = '/boot'

    // BOOT/DATA/EFI
    // this.devices.boot
    this.devices.data.name = 'none'
    // this.devices.efi.name
    // this.devices.root
    this.devices.swap.name = 'none'

    return true
}

