// ./src/krill/sequence.d/spacemit.d/partition.ts
import { exec } from '../../../../lib/utils.js'
import Sequence from '../../sequence.js'

function detectDeviceType(device: string): string {
  if (device.includes('nvme')) return 'nvme'
  if (/^\/dev\/md\d+/.test(device)) return 'raid'
  if (device.includes('mmcblk')) return 'mmc'
  return 'standard'
}

export default async function partition(this: Sequence): Promise<boolean> {
    const device = this.partitions.installationDevice
    let p: string = ''
    if (detectDeviceType(device) === 'standard') {
      p = ''
    } else if (detectDeviceType(device) === 'mmc') {
      p = 'p'
    } else if (detectDeviceType(device) === 'nvme') {
      p = 'p'
    } else if (detectDeviceType(device) === 'raid') {
      p = 'p'
    }

    try {
        // 1. Pulizia totale e inizializzazione GPT
        // Usiamo comandi separati per essere sicuri che sgdisk applichi i cambiamenti
        await exec(`sgdisk -Z ${device}`)
        await exec(`sgdisk -o ${device}`)

        // 2. Partizioni RAW con allineamento forzato a 1 settore (-a 1)
        // Fondamentale per farle partire dai settori bassi richiesti da SpacemiT
        await exec(`sgdisk -a 1 -n 1:256:767    -c 1:"fsbl"    -t 1:0700 ${device}`)
        await exec(`sgdisk -a 1 -n 2:768:895    -c 2:"env"     -t 2:0700 ${device}`)
        await exec(`sgdisk -a 1 -n 3:2048:4095  -c 3:"opensbi" -t 3:0700 ${device}`)
        await exec(`sgdisk -a 1 -n 4:4096:8191  -c 4:"uboot"   -t 4:0700 ${device}`)

        // 3. Partizioni Filesystem (bootfs e rootfs) sempre con -a 1
        await exec(`sgdisk -a 1 -n 5:8192:532479 -c 5:"bootfs"  -t 5:0700 ${device}`)
        await exec(`sgdisk -a 1 -n 6:532480:0    -c 6:"rootfs"  -t 6:0700 ${device}`)

        // 4. Sincronizzazione e aggiornamento kernel
        await exec(`sync`);
        await exec(`partprobe ${device}`);
        await exec(`udevadm settle`);

        // Mapping per il resto della sequenza Krill
        this.devices.boot.name = `${device}${p}5`
        this.devices.boot.fsType = 'ext4'
        this.devices.boot.mountPoint = '/boot'

        this.devices.root.name = `${device}${p}6`
        this.devices.root.fsType = 'ext4'
        this.devices.root.mountPoint = '/'

        this.devices.data.name = 'none'
        this.devices.efi.name = 'none'

        return true
    } catch (error) {
        // In fase di sviluppo, un console.log qui aiuta a non impazzire
        console.error("Errore durante il partizionamento SpacemiT:", error);
        return false
    }
}
