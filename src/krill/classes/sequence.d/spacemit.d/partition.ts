// ./src/krill/sequence.d/spacemit.d/partition.ts
import { exec } from '../../../../lib/utils.js'
import Sequence from '../../sequence.js'

export default async function partition(this: Sequence, device: string, p: string): Promise<boolean> {
    try {
        // Pulizia e inizializzazione GPT
        await exec(`sgdisk -Z ${device}`)
        await exec(`sgdisk -o ${device}`)

        // 4 Partizioni RAW (FSBL, ENV, OpenSBI, U-Boot)
        await exec(`sgdisk -n 1:256:767    -c 1:"fsbl"     -t 1:0700 ${device}`)
        await exec(`sgdisk -n 2:768:895    -c 2:"env"      -t 2:0700 ${device}`)
        await exec(`sgdisk -n 3:2048:4095  -c 3:"opensbi"  -t 3:0700 ${device}`)
        await exec(`sgdisk -n 4:4096:8191  -c 4:"uboot"    -t 4:0700 ${device}`)

        // 2 Partizioni Filesystem (bootfs e rootfs)
        await exec(`sgdisk -n 5:8192:532479 -c 5:"bootfs"   -t 5:0700 ${device}`)
        await exec(`sgdisk -n 6:532480:0    -c 6:"rootfs"   -t 6:0700 ${device}`)

        // Mapping per il resto della sequenza Krill
        this.devices.boot.name = `${device}${p}5`
        this.devices.boot.fsType = 'ext4'

        this.devices.root.name = `${device}${p}6`
        this.devices.root.fsType = 'ext4'

        this.devices.data.name = 'none'
        this.devices.efi.name = 'none'

        return true
    } catch (error) {
        return false
    }
}
