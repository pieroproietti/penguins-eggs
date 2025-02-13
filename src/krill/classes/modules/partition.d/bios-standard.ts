/**
 * ./src/krill/modules/partition.d/bios-standard.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import { exec } from '../../../../lib/utils.js'
import Sequence from '../../sequence.js'

/**
 * 
 * @param this 
 * @param installDevice 
 * @param p 
 * @returns 
 */
export default async function biosStandard(this: Sequence, installDevice = "", p = ""): Promise<boolean> {
    await exec(`parted --script ${installDevice} mklabel msdos`, this.echo)
    await exec(`parted --script --align optimal ${installDevice} mkpart primary linux-swap       1MiB    ${this.swapSize + 1}MiB`, this.echo) // dev/sda1 swap
    await exec(`parted --script --align optimal ${installDevice} mkpart primary ext4 ${this.swapSize + 1}MiB                100%`, this.echo) // dev/sda2 root
    await exec(`parted ${installDevice} set 2 boot on`, this.echo)
    await exec(`parted ${installDevice} set 2 esp on`, this.echo)

    // SWAP
    this.devices.swap.name = `${installDevice}${p}1`
    this.devices.swap.fsType = 'swap'
    this.devices.swap.mountPoint = 'none'

    // ROOT
    this.devices.root.name = `${installDevice}${p}2`
    this.devices.root.fsType = 'ext4'
    this.devices.root.mountPoint = '/'

    // BOOT/DATA/EFI
    this.devices.boot.name = 'none'
    this.devices.data.name = 'none'
    this.devices.efi.name = 'none'

    return true
}
