/**
 * ./src/krill/modules/partition.d/bios-standard.ts (versione unificata)
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * Partiziona un disco per sistemi BIOS, gestendo dinamicamente ext4 (con swap) e btrfs (senza swap).
 */

import { exec } from '../../../../lib/utils.js'
import Sequence from '../../sequence.js'

/**
 * @param this 
 * @param installDevice 
 * @param p 
 * @returns 
 */
export default async function biosStandard(this: Sequence, installDevice = "", p = ""): Promise<boolean> {
    const fsType = this.partitions.filesystemType;

    // 1. Creazione della tabella delle partizioni (comune a entrambi)
    await exec(`parted --script ${installDevice} mklabel msdos`, this.echo)

    // 2. Logica di partizionamento condizionale
    if (fsType === 'btrfs') {
        // --- CASO BTRFS: NESSUNA PARTIZIONE DI SWAP ---
        // Creiamo un'unica partizione che occupa tutto il disco.
        // Lo swap verrà gestito con uno swapfile direttamente su Btrfs.
        await exec(`parted --script --align optimal ${installDevice} mkpart primary "" 1MiB 100%`, this.echo) // Partizione 1: root
        await exec(`parted ${installDevice} set 1 boot on`, this.echo)

        // Imposta i dispositivi per Btrfs
        this.devices.root.name = `${installDevice}${p}1`
        this.devices.swap.name = 'none' // Nessuna partizione di swap

    } else {
        // --- CASO EXT4 (o default): CON PARTIZIONE DI SWAP ---
        // Comportamento standard con partizione di swap.
        await exec(`parted --script --align optimal ${installDevice} mkpart primary linux-swap 1MiB ${this.swapSize + 1}MiB`, this.echo) // Partizione 1: swap
        await exec(`parted --script --align optimal ${installDevice} mkpart primary "" ${this.swapSize + 1}MiB 100%`, this.echo)     // Partizione 2: root
        await exec(`parted ${installDevice} set 2 boot on`, this.echo)

        // Imposta i dispositivi per ext4
        this.devices.swap.name = `${installDevice}${p}1`
        this.devices.swap.fsType = 'swap'
        this.devices.swap.mountPoint = 'none'
        
        this.devices.root.name = `${installDevice}${p}2`
    }

    // 3. Impostazioni finali comuni
    this.devices.root.fsType = fsType
    this.devices.root.mountPoint = '/'

    // BOOT/DATA/EFI non sono usati in questo schema
    this.devices.boot.name = 'none'
    this.devices.data.name = 'none'
    this.devices.efi.name = 'none'

    return true
}
