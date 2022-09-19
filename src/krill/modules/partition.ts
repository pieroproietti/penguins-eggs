/**
 * krill: module partitions
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import { IPartitions } from '../../interfaces/i-partitions'
import Sequence from '../krill-sequence'
import { exec } from '../../lib/utils'
import Utils from '../../classes/utils'
import shx from 'shelljs'
import os from 'os'

/**
 * 
 * @param this 
 */
export default async function partition(this: Sequence): Promise<boolean> {
    let echoYes = Utils.setEcho(true)

    let retVal = false

    const installDevice = this.partitions.installationDevice

    /**
     * Support for NVMe 
     * 
     * /dev/sda1 = /dev/nvme0n1p1
     */
    let p = ''
    if (installDevice.includes('nvme')) {
        p = 'p'
    }

    const installMode = this.partitions.installationMode
    let swapSize = Math.round(os.totalmem()/1024/1024) * 1024
     
    if (this.partitions.userSwapChoice === 'none') {
        swapSize = 0
    } else if (this.partitions.userSwapChoice === 'small') {

    } else if (this.partitions.userSwapChoice === 'suspend') {
        swapSize *= 2
    } else if (this.partitions.userSwapChoice === 'file') {
        swapSize = 0
    }

    if (installMode === 'standard' && !this.efi) {


        /**
         * ===========================================================================================
         * BIOS: working
         * ===========================================================================================
         */
        await exec(`parted --script ${installDevice} mklabel msdos`, this.echo)
        await exec(`parted --script --align optimal ${installDevice} mkpart primary linux-swap       1MiB    ${swapSize+1}MiB`, this.echo) //dev/sda1 swap
        await exec(`parted --script --align optimal ${installDevice} mkpart primary ext4 ${swapSize+1}MiB                100%`, this.echo) //dev/sda2 root
        await exec(`parted ${installDevice} set 1 boot on`, this.echo)
        await exec(`parted ${installDevice} set 1 esp on`, this.echo)

        // SWAP

        this.devices.swap.name = `${installDevice}${p}1`
        this.devices.swap.fsType = 'swap'
        this.devices.swap.mountPoint = 'none'

        // ROOT
        this.devices.root.name = `${installDevice}${p}2`
        this.devices.root.fsType = 'ext4'
        this.devices.root.mountPoint = '/'

        // BOOT/DATA/EFI
        this.devices.boot.name = `none`
        this.devices.data.name = `none`
        this.devices.efi.name = `none`

        retVal = true

    } else if (installMode === 'full-encrypted' && !this.efi) {

        /**
         * ===========================================================================================
         * BIOS: full-encrypt: 
         * ===========================================================================================
         */
        await exec(`parted --script ${installDevice} mklabel msdos`, this.echo)
        await exec(`parted --script --align optimal ${installDevice} mkpart primary ext4         1MiB        512MiB`, this.echo) // sda1
        await exec(`parted --script --align optimal ${installDevice} mkpart primary linux-swap 512MiB        ${swapSize+512}MiB`, this.echo) // sda2
        await exec(`parted --script --align optimal ${installDevice} mkpart primary ext4 ${swapSize+512}MiB                100%`, this.echo) // sda3
        await exec(`parted --script ${installDevice} set 1 boot on`, this.echo) // sda1
        await exec(`parted --script ${installDevice} set 1 esp on`, this.echo) // sda1

        // BOOT 512M
        this.devices.boot.name = `${installDevice}${p}1` // 'boot' 
        this.devices.boot.fsType = 'ext4'
        this.devices.boot.mountPoint = '/boot'

        // SWAP 8G
        // this.redraw(<Install message={`Formatting LUKS ${installDevice}2`} percent={0} />)
        let crytoSwap = await exec(`cryptsetup -y -v luksFormat --type luks2 ${installDevice}${p}2`, echoYes)
        if (crytoSwap.code !== 0) {
            Utils.warning(`Error: ${crytoSwap.code} ${crytoSwap.data}`)
            process.exit(1)
        }
        // this.redraw(<Install message={`Opening ${installDevice}${p}2 as swap_crypted`} percent={0} />)
        let crytoSwapOpen = await exec(`cryptsetup luksOpen --type luks2 ${installDevice}${p}2 swap_crypted`, echoYes)
        if (crytoSwapOpen.code !== 0) {
            Utils.warning(`Error: ${crytoSwapOpen.code} ${crytoSwapOpen.data}`)
            process.exit(1)
        }
        this.devices.swap.name = '/dev/mapper/swap_crypted'
        this.devices.swap.cryptedFrom = `${installDevice}${p}2`
        this.devices.swap.fsType = 'swap'
        this.devices.swap.mountPoint = 'none'

        // ROOT
        // this.redraw(<Install message={`Formatting LUKS ${installDevice}${p}3`} percent={0} />)
        let crytoRoot = await exec(`cryptsetup -y -v luksFormat --type luks2 ${installDevice}${p}3`, echoYes)
        if (crytoRoot.code !== 0) {
            Utils.warning(`Error: ${crytoRoot.code} ${crytoRoot.data}`)
            process.exit(1)
        }
        // this.redraw(<Install message={`Opening ${installDevice}${p}3 as root_crypted`} percent={0} />)
        let crytoRootOpen = await exec(`cryptsetup luksOpen --type luks2 ${installDevice}${p}3 root_crypted`, echoYes)
        if (crytoRootOpen.code !== 0) {
            Utils.warning(`Error: ${crytoRootOpen.code} ${crytoRootOpen.data}`)
            process.exit(1)
        }
        this.devices.root.name = '/dev/mapper/root_crypted'
        this.devices.root.cryptedFrom = `${installDevice}${p}3`
        this.devices.root.fsType = 'ext4'
        this.devices.root.mountPoint = '/'

        // BOOT/DATA/EFI
        this.devices.data.name = `none`
        this.devices.efi.name = `none`

        retVal = true

    } else if (installMode === 'standard' && this.efi) {

        /**
         * ===========================================================================================
         * UEFI: working
         * ===========================================================================================
         */
        await exec(`parted --script ${installDevice} mklabel gpt`, this.echo)
        await exec(`parted --script ${installDevice} mkpart efi  fat32      34s                256MiB`, this.echo) // sda1 EFI
        await exec(`parted --script ${installDevice} mkpart swap linux-swap 256MiB ${swapSize+256}Mib`, this.echo) // sda2 swap
        await exec(`parted --script ${installDevice} mkpart root ext4 ${swapSize+256}MiB         100%`, this.echo) // sda3 root
        await exec(`parted --script ${installDevice} set 1 boot on`, this.echo) // sda1
        await exec(`parted --script ${installDevice} set 1 esp on`, this.echo) // sda1

        this.devices.efi.name = `${installDevice}${p}1`
        this.devices.efi.fsType = 'F 32 -I'
        this.devices.efi.mountPoint = '/boot/efi'
        this.devices.boot.name = `none`

        this.devices.swap.name = `${installDevice}${p}2`
        this.devices.swap.fsType = 'swap'

        this.devices.root.name = `${installDevice}${p}3`
        this.devices.root.fsType = 'ext4'
        this.devices.root.mountPoint = '/'

        // BOOT/DATA/EFI
        this.devices.boot.name = `none`
        this.devices.data.name = `none`
        // this.devices.efi.name = `none`

        retVal = true

    } else if (installMode === 'full-encrypted' && this.efi) {

        /**
         * ===========================================================================================
         * UEFI, full-encrypt
         * ===========================================================================================
         */
        await exec(`parted --script ${installDevice} mklabel gpt`, this.echo)
        await exec(`parted --script ${installDevice} mkpart efi fat32               34s               256MiB`, this.echo) // sda1 EFI
        await exec(`parted --script ${installDevice} mkpart boot ext4             256MiB              768MiB`, this.echo) // sda2 boot
        await exec(`parted --script ${installDevice} mkpart swap linux-swap       768MiB  ${swapSize+768}MiB`, this.echo) // sda3 swap
        await exec(`parted --script ${installDevice} mkpart root ext4 ${swapSize+768}MiB                100%`, this.echo) // sda4 root
        await exec(`parted --script ${installDevice} set 1 boot on`, this.echo) // sda1
        await exec(`parted --script ${installDevice} set 1 esp on`, this.echo) // sda1

        // EFI 256M
        this.devices.efi.name = `${installDevice}${p}1` // 'efi' 
        this.devices.efi.fsType = 'F 32 -I'
        this.devices.efi.mountPoint = '/boot/efi'

        // BOOT 512M
        this.devices.boot.name = `${installDevice}${p}2` // 'boot' 
        this.devices.boot.fsType = 'ext4'
        this.devices.boot.mountPoint = '/boot'

        /**
         *  cryptsetup return codes are: 
         * 
         * 1 wrong parameters, 
         * 2 no permission (bad passphrase), 
         * 3 out of memory, 
         * 4 wrong device specified, 
         * 5 device already exists or device is busy.
         * 
         * sometime due scarce memory 2GB, we can have the process killed
         */

        // SWAP 8G
        // redraw(<Install message={`Formatting LUKS ${installDevice}${p}3`} percent={0} />)
        let crytoSwap = await exec(`cryptsetup -y -v luksFormat --type luks2 ${installDevice}${p}3`, echoYes)
        if (crytoSwap.code !== 0) {
            Utils.warning(`Error: ${crytoSwap.code} ${crytoSwap.data}`)
            process.exit(1)
        }
        // this.redraw(<Install message={`Opening ${installDevice}${p}3 as swap_crypted`} percent={0} />)
        let crytoSwapOpen = await exec(`cryptsetup luksOpen --type luks2 ${installDevice}${p}3 swap_crypted`, echoYes)
        if (crytoSwapOpen.code !== 0) {
            Utils.warning(`Error: ${crytoSwapOpen.code} ${crytoSwapOpen.data}`)
            process.exit(1)
        }
        this.devices.swap.name = '/dev/mapper/swap_crypted'
        this.devices.swap.cryptedFrom = `${installDevice}${p}3`
        this.devices.swap.fsType = 'swap'
        this.devices.swap.mountPoint = 'none'

        // ROOT
        // this.redraw(<Install message={`Formatting LUKS ${installDevice}${p}4`} percent={0} />)
        let crytoRoot = await exec(`cryptsetup -y -v luksFormat --type luks2 ${installDevice}${p}4`, echoYes)
        if (crytoRoot.code !== 0) {
            Utils.warning(`Error: ${crytoRoot.code} ${crytoRoot.data}`)
            process.exit(1)
        }
        // this.redraw(<Install message={`Opening ${installDevice}${p}4 as root_crypted`} percent={0} />)
        let crytoRootOpen = await exec(`cryptsetup luksOpen --type luks2 ${installDevice}${p}4 root_crypted`, echoYes)
        if (crytoRootOpen.code !== 0) {
            Utils.warning(`Error: ${crytoRootOpen.code} ${crytoRootOpen.data}`)
            process.exit(1)
        }
        this.devices.root.name = '/dev/mapper/root_crypted'
        this.devices.root.cryptedFrom = `${installDevice}${p}4`
        this.devices.root.fsType = 'ext4'
        this.devices.root.mountPoint = '/'


        // BOOT/DATA/EFI
        // this.devices.boot.name = `none`
        this.devices.data.name = `none`
        // this.devices.efi.name = `none`

        retVal = true

    } else if (installMode === 'lvm2' && !this.efi) {

        /**
        * ===========================================================================================
        * PROXMOX VE: BIOS and lvm2
        * ===========================================================================================
        */
        // Creo partizioni
        await exec(`parted --script ${installDevice} mklabel msdos`, this.echo)
        await exec(`parted --script ${installDevice} mkpart primary ext2 1 512`, this.echo) // sda1
        await exec(`parted --script --align optimal ${installDevice} mkpart primary ext2 512 100%`, this.echo) // sda2
        await exec(`parted --script ${installDevice} set 1 boot on`, this.echo) // sda1
        await exec(`parted --script ${installDevice} set 2 lvm on`, this.echo) // sda2

        const partInfo = await lvmPartInfo(installDevice)
        const lvmPartname = partInfo[0]
        const lvmSwapSize = partInfo[1]
        const lvmRootSize = partInfo[2]

        await exec(`pvcreate /dev/${lvmPartname}`, this.echo)
        await exec(`vgcreate pve /dev/${lvmPartname}`, this.echo)
        await exec(`vgchange -an`, this.echo)
        await exec(`lvcreate -L ${lvmSwapSize} -nswap pve`, this.echo)
        await exec(`lvcreate -L ${lvmRootSize} -nroot pve`, this.echo)
        await exec(`lvcreate -l 100%FREE -ndata pve`, this.echo)
        await exec(`vgchange -a y pve`, this.echo)

        this.devices.efi.name = `none`

        this.devices.boot.name = `${installDevice}${p}1`
        this.devices.root.fsType = 'ext2'
        this.devices.root.mountPoint = '/boot'

        this.devices.root.name = `/dev/pve/root`
        this.devices.root.fsType = 'ext4'
        this.devices.root.mountPoint = '/'

        this.devices.data.name = `/dev/pve/data`
        this.devices.data.fsType = 'ext4'
        this.devices.data.mountPoint = '/var/lib/vz'

        this.devices.swap.name = `/dev/pve/swap`

        retVal = true

    } else if (this.partitions.installationMode === 'lvm2' && this.efi) {

        /**
        * ===========================================================================================
        * PROXMOX VE: lvm2 and UEFI 
        * ===========================================================================================
        */
        await exec(`parted --script ${installDevice} mklabel gpt`, this.echo)
        await exec(`parted --script ${installDevice} mkpart efi  fat32    34s   256MiB`, this.echo) // sda1 EFI
        await exec(`parted --script ${installDevice} mkpart boot ext2  256MiB   768MiB`, this.echo) // sda2 boot
        await exec(`parted --script ${installDevice} mkpart lvm  ext4  768MiB     100%`, this.echo) // sda3 lmv2
        await exec(`parted --script ${installDevice} set 1 boot on`, this.echo) // sda1
        await exec(`parted --script ${installDevice} set 1 esp on`, this.echo)  // sda1
        await exec(`parted --script ${installDevice} set 3 lvm on`, this.echo) // sda3

        const partInfo = await lvmPartInfo(installDevice)
        const lvmPartname = partInfo[0]
        const lvmSwapSize = partInfo[1]
        const lvmRootSize = partInfo[2]

        await exec(`pvcreate /dev/${lvmPartname}`, this.echo)
        await exec(`vgcreate pve /dev/${lvmPartname}`, this.echo)
        await exec(`vgchange -an`, this.echo)
        await exec(`lvcreate -L ${lvmSwapSize} -nswap pve`, this.echo)
        await exec(`lvcreate -L ${lvmRootSize} -nroot pve`, this.echo)
        await exec(`lvcreate -l 100%FREE -ndata pve`, this.echo)
        await exec(`vgchange -a y pve`, this.echo)

        this.devices.efi.name = `${installDevice}${p}1`
        this.devices.efi.fsType = 'F 32 -I'
        this.devices.efi.mountPoint = '/boot/efi'

        this.devices.boot.name = `${installDevice}${p}2`
        this.devices.boot.fsType = 'ext4'
        this.devices.boot.mountPoint = '/boot'

        this.devices.root.name = `/dev/pve/root`
        this.devices.root.fsType = 'ext4'
        this.devices.root.mountPoint = '/'

        this.devices.data.name = `/dev/pve/data`
        this.devices.data.fsType = 'ext4'
        this.devices.data.mountPoint = '/var/lib/vz'

        this.devices.swap.name = `/dev/pve/swap`

        retVal = true
    }
    return retVal
}

/**
 * 
 * @param installDevice 
 * @returns 
 */
export async function lvmPartInfo(installDevice = '/dev/sda'): Promise<[string, number, number, number]> {

    // Partizione LVM
    const lvmPartname = shx.exec(`fdisk ${installDevice} -l | grep LVM | awk '{print $1}' | cut -d "/" -f3`).stdout.trim()
    const lvmByteSize = Number(shx.exec(`cat /proc/partitions | grep ${lvmPartname}| awk '{print $3}' | grep "[0-9]"`).stdout.trim())
    const lvmSize = lvmByteSize / 1024

    // La partizione di root viene posta ad 1/4 della partizione LVM, limite max 100 GB
    const lvmSwapSize = 8192
    let lvmRootSize = lvmSize / 8
    if (lvmRootSize < 20480) {
        lvmRootSize = 20480
    }
    const lvmDataSize = lvmSize - lvmRootSize - lvmSwapSize
    return [lvmPartname, lvmSwapSize, lvmRootSize, lvmDataSize]
}
