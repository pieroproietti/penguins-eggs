// ./src/krill/sequence.d/spacemit.d/bootloader.ts
import fs from 'node:fs'
import { exec } from '../../../../lib/utils.js'
import Sequence from '../../sequence.js'

export default async function bootloader(this: Sequence): Promise<void> {
    const device = this.partitions.installationDevice
    const p = device.includes('nvme') || device.includes('mmcblk') ? 'p' : ''
    const factoryDir = "/usr/share/penguins-eggs/spacemit"

    // Iniezione binari raw
    await exec(`dd if=${factoryDir}/factory/bootinfo_emmc.bin of=${device} bs=512 count=1 conv=notrunc`)
    await exec(`dd if=${factoryDir}/factory/FSBL.bin of=${device}${p}1 conv=fsync`)
    await exec(`dd if=${factoryDir}/fw_dynamic.itb of=${device}${p}3 conv=fsync`)
    await exec(`dd if=${factoryDir}/u-boot.itb of=${device}${p}4 conv=fsync`)

    // Creazione env_k1-x.txt persistente
    // (Usa il template bootcmd che abbiamo definito prima con root=${device}${p}6)
    const envContent = `...`
    fs.writeFileSync(`${this.installTarget}/boot/env_k1-x.txt`, envContent)
}
