/**
 * ./src/krill/modules/partition.d/bios-standard.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { exec } from '../../../../lib/utils.js'
import Sequence from '../../sequence.js'

/**
 * 
 * @param this 
 * @param installDevice 
 * @param rootPartition 
 * @param espPartition 
 * @returns 
 */
export default async function biosManual(this: Sequence, root = "", esp="none"): Promise<boolean> {

    // SWAP
    this.devices.swap.name = `file`
    this.devices.swap.fsType = 'swap'
    this.devices.swap.mountPoint = 'none'

    // ROOT
    this.devices.root.name = `${root}`
    this.devices.root.fsType = 'ext4'
    this.devices.root.mountPoint = '/'

    // BOOT/DATA/EFI
    this.devices.boot.name = 'none'
    this.devices.data.name = 'none'
    this.devices.efi.name = esp

    return true
}
