/**
 * ./src/krill/modules/partition.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import os from 'node:os'
import shx from 'shelljs'

import Utils from '../../classes/utils.js'
import { IPartitions } from '../../interfaces/i-partitions.js'
import { IDevices, IDevice } from '../../interfaces/i-devices.js'
import { SwapChoice, InstallationMode } from '../enum/e-krill.js'
import { exec } from '../../lib/utils.js'
import Sequence from '../sequence.js'

/**
 *
 * @param this
 */
export default async function partition(this: Sequence): Promise<boolean> {
  const echoYes = Utils.setEcho(true)

  let retVal = false

  const installDevice = this.partitions.installationDevice

  /**
   * Support for NVMe
   *
   * /dev/sda1 = /dev/nvme0n1p1 = /dev/md0p1
   */
  let p = ''
  if (installDevice.includes('nvme') || installDevice.startsWith('/dev/md')) {
    p = 'p'
  }

  const installMode = this.partitions.installationMode
  this.swapSize = Math.round(os.totalmem() / 1_073_741_824) * 1024

  switch (this.partitions.userSwapChoice) {
    case SwapChoice.None: {
      this.swapSize = 256

      break
    }

    case SwapChoice.Small: {
      break
    }

    case SwapChoice.Suspend: {
      this.swapSize *= 2

      break
    }

    case SwapChoice.File: {
      // total mem
      break
    }
    // No default
  }

  /**
   * Quindi, per risolvere questo problema, invece di creare RAID e poi partizionare, è necessario 
   * prima partizionare i dischi e poi raccogliere alcune partizioni in RAID. 
   * Anche se questo è discutibile, suggerisco il seguente schema:
   * 
   * per l'installazione EFI: un ESP (tipo 1) di 511MiB (offset predefinito 1MiB), 
   * poi 512MiB per /boot di tipo Linux RAID, poi il resto per il resto di tipo Linux RAID 
   * (questo è il tipo 29 in fdisk se non sbaglio).
   * 
   * per l'installazione legacy: 1 MiB (tipo 4 - biosgrub), 510 MiB di avvio (RAID) e il resto RAID.
   * 
   * Quindi, si creano due RAID (/boot e il resto) e si seleziona uno degli ESP come “l'ESP”. 
   * 
   * Dopo l'installazione si abilita l'avvio dal secondo disco. Poi si crea LVM sul RAID grande, per contenere
   * i filesystem; si può creare un volume di swap, un volume FS di root (30 GiB sono sufficienti
   * per Debian ed è facile da ingrandire al volo; si noti che tutti i dati saranno collocati 
   * in altri volumi dedicati montati - non è utile memorizzare i dati delle applicazioni nel 
   * volume di root). 
   * 
   * Il resto può essere creato secondo le necessità, durante la vita del sistema.
   */


  if (installMode === InstallationMode.Standard && !this.efi) {
    /**
     * ===========================================================================================
     * BIOS: working
     * ===========================================================================================
     */
    await exec(`parted --script ${installDevice} mklabel msdos`, this.echo)
    await exec(`parted --script --align optimal ${installDevice} mkpart primary linux-swap       1MiB    ${this.swapSize + 1}MiB`, this.echo) // dev/sda1 swap
    await exec(`parted --script --align optimal ${installDevice} mkpart primary ext4 ${this.swapSize + 1}MiB                100%`, this.echo) // dev/sda2 root
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
    this.devices.boot.name = 'none'
    this.devices.data.name = 'none'
    this.devices.efi.name = 'none'


    retVal = true
  } else if (installMode === InstallationMode.FullEncrypted && !this.efi) {
    /**
     * ===========================================================================================
     * BIOS: full-encrypt:
     * ===========================================================================================
     */
    await exec(`parted --script ${installDevice} mklabel msdos`, this.echo)
    await exec(`parted --script --align optimal ${installDevice} mkpart primary ext4         1MiB        512MiB`, this.echo) // sda1
    await exec(`parted --script --align optimal ${installDevice} mkpart primary linux-swap 512MiB        ${this.swapSize + 512}MiB`, this.echo) // sda2
    await exec(`parted --script --align optimal ${installDevice} mkpart primary ext4 ${this.swapSize + 512}MiB                100%`, this.echo) // sda3
    await exec(`parted --script ${installDevice} set 1 boot on`, this.echo) // sda1
    await exec(`parted --script ${installDevice} set 1 esp on`, this.echo) // sda1

    // BOOT 512M
    this.devices.boot.name = `${installDevice}${p}1` // 'boot'
    this.devices.boot.fsType = 'ext4'
    this.devices.boot.mountPoint = '/boot'

    // SWAP 8G
    // this.redraw(<Install message={`Formatting LUKS ${installDevice}2`} percent={0} />)
    // const crytoSwap = await exec(`cryptsetup -y -v luksFormat --type luks2 ${installDevice}${p}2`, echoYes)
    const crytoSwap = await exec(`cryptsetup --batch-mode -v luksFormat --type luks2 ${installDevice}${p}2`, echoYes)
    
    if (crytoSwap.code !== 0) {
      Utils.warning(`Error: ${crytoSwap.code} ${crytoSwap.data}`)
      process.exit(1)
    }

    // this.redraw(<Install message={`Opening ${installDevice}${p}2 as swap_crypted`} percent={0} />)
    const crytoSwapOpen = await exec(`cryptsetup luksOpen --type luks2 ${installDevice}${p}2 swap_crypted`, echoYes)
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
    const crytoRoot = await exec(`cryptsetup -y -v luksFormat --type luks2 ${installDevice}${p}3`, echoYes)
    if (crytoRoot.code !== 0) {
      Utils.warning(`Error: ${crytoRoot.code} ${crytoRoot.data}`)
      process.exit(1)
    }

    // this.redraw(<Install message={`Opening ${installDevice}${p}3 as root_crypted`} percent={0} />)
    const crytoRootOpen = await exec(`cryptsetup luksOpen --type luks2 ${installDevice}${p}3 root_crypted`, echoYes)
    if (crytoRootOpen.code !== 0) {
      Utils.warning(`Error: ${crytoRootOpen.code} ${crytoRootOpen.data}`)
      process.exit(1)
    }

    this.devices.root.name = '/dev/mapper/root_crypted'
    this.devices.root.cryptedFrom = `${installDevice}${p}3`
    this.devices.root.fsType = 'ext4'
    this.devices.root.mountPoint = '/'

    // BOOT/DATA/EFI
    this.devices.data.name = 'none'
    this.devices.efi.name = 'none'

    retVal = true
  } else if (installMode === InstallationMode.Standard && this.efi) {
    /**
     * ===========================================================================================
     * UEFI: working
     * ===========================================================================================
     */
    await exec(`parted --script ${installDevice} mklabel gpt`, this.echo)
    await exec(`parted --script ${installDevice} mkpart efi  fat32      34s                256MiB`, this.echo) // sda1 EFI
    await exec(`parted --script ${installDevice} mkpart swap linux-swap 256MiB ${this.swapSize + 256}Mib`, this.echo) // sda2 swap
    await exec(`parted --script ${installDevice} mkpart root ext4 ${this.swapSize + 256}MiB         100%`, this.echo) // sda3 root
    await exec(`parted --script ${installDevice} set 1 boot on`, this.echo) // sda1
    await exec(`parted --script ${installDevice} set 1 esp on`, this.echo) // sda1

    this.devices.efi.name = `${installDevice}${p}1`
    this.devices.efi.fsType = 'F 32 -I'
    this.devices.efi.mountPoint = '/boot/efi'
    this.devices.boot.name = 'none'

    this.devices.swap.name = `${installDevice}${p}2`
    this.devices.swap.fsType = 'swap'

    this.devices.root.name = `${installDevice}${p}3`
    this.devices.root.fsType = 'ext4'
    this.devices.root.mountPoint = '/'

    // BOOT/DATA/EFI
    this.devices.boot.name = 'none'
    this.devices.data.name = 'none'
    // this.devices.efi.name = `none`

    retVal = true
  } else if (installMode === InstallationMode.FullEncrypted && this.efi) {
    /**
     * ===========================================================================================
     * UEFI, full-encrypt
     * ===========================================================================================
     */
    await exec(`parted --script ${installDevice} mklabel gpt`, this.echo)
    await exec(`parted --script ${installDevice} mkpart efi fat32               34s               256MiB`, this.echo) // sda1 EFI
    await exec(`parted --script ${installDevice} mkpart boot ext4             256MiB              768MiB`, this.echo) // sda2 boot
    await exec(`parted --script ${installDevice} mkpart swap linux-swap       768MiB  ${this.swapSize + 768}MiB`, this.echo) // sda3 swap
    await exec(`parted --script ${installDevice} mkpart root ext4 ${this.swapSize + 768}MiB                100%`, this.echo) // sda4 root
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
    const crytoSwap = await exec(`cryptsetup -y -v luksFormat --type luks2 ${installDevice}${p}3`, echoYes)
    if (crytoSwap.code !== 0) {
      Utils.warning(`Error: ${crytoSwap.code} ${crytoSwap.data}`)
      process.exit(1)
    }

    // this.redraw(<Install message={`Opening ${installDevice}${p}3 as swap_crypted`} percent={0} />)
    const crytoSwapOpen = await exec(`cryptsetup luksOpen --type luks2 ${installDevice}${p}3 swap_crypted`, echoYes)
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
    const crytoRoot = await exec(`cryptsetup -y -v luksFormat --type luks2 ${installDevice}${p}4`, echoYes)
    if (crytoRoot.code !== 0) {
      Utils.warning(`Error: ${crytoRoot.code} ${crytoRoot.data}`)
      process.exit(1)
    }

    // this.redraw(<Install message={`Opening ${installDevice}${p}4 as root_crypted`} percent={0} />)
    const crytoRootOpen = await exec(`cryptsetup luksOpen --type luks2 ${installDevice}${p}4 root_crypted`, echoYes)
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
    this.devices.data.name = 'none'
    // this.devices.efi.name = `none`

    retVal = true
  } else if (installMode === InstallationMode.LVM2 && !this.efi) {
    /**
     * ===========================================================================================
     * BIOS and lvm2
     * ===========================================================================================
     */
    // Creo partizioni
    await exec(`parted --script ${installDevice} mklabel msdos`, this.echo)
    await exec(`parted --script ${installDevice} mkpart primary ext2 1 512`, this.echo) // sda1
    await exec(`parted --script --align optimal ${installDevice} mkpart primary ${this.partitions.filesystemType} 512 100%`, this.echo) // sda2
    await exec(`parted --script ${installDevice} set 1 boot on`, this.echo) // sda1
    await exec(`parted --script ${installDevice} set 2 lvm on`, this.echo) // sda2

    this.devices = await createLvmPartitions(
      installDevice,
      this.partitions.lvmOptions.vgName,
      this.partitions.userSwapChoice,
      this.swapSize,
      this.partitions.lvmOptions.lvRootName,
      this.partitions.lvmOptions.lvRootFSType,
      this.partitions.lvmOptions.lvRootSize,
      this.partitions.lvmOptions.lvDataName,
      this.partitions.lvmOptions.lvDataFSType,
      this.partitions.lvmOptions.lvDataMountPoint,
      this.echo
    )

    if (this.partitions.userSwapChoice == SwapChoice.File) {
      this.devices.swap.name = 'swap.img'
      this.devices.swap.mountPoint = '/'
    }

    this.devices.efi.name = 'none'

    this.devices.boot.name = `${installDevice}${p}1`
    this.devices.boot.fsType = 'ext2'
    this.devices.boot.mountPoint = '/boot'

    retVal = true
  } else if (this.partitions.installationMode === InstallationMode.LVM2 && this.efi) {
    /**
     * ===========================================================================================
     * lvm2 and UEFI
     * ===========================================================================================
     */
    await exec(`parted --script ${installDevice} mklabel gpt`, this.echo)
    await exec(`parted --script ${installDevice} mkpart efi  fat32    34s   256MiB`, this.echo) // sda1 EFI
    await exec(`parted --script ${installDevice} mkpart boot ext2  256MiB   768MiB`, this.echo) // sda2 boot
    await exec(`parted --script ${installDevice} mkpart lvm ${this.partitions.filesystemType} 768MiB     100%`, this.echo) // sda3 lmv2
    await exec(`parted --script ${installDevice} set 1 boot on`, this.echo) // sda1
    await exec(`parted --script ${installDevice} set 1 esp on`, this.echo) // sda1
    await exec(`parted --script ${installDevice} set 3 lvm on`, this.echo) // sda3
      
    this.devices = await createLvmPartitions(
      installDevice,
      this.partitions.lvmOptions.vgName,
      this.partitions.userSwapChoice,
      this.swapSize,
      this.partitions.lvmOptions.lvRootName,
      this.partitions.lvmOptions.lvRootFSType,
      this.partitions.lvmOptions.lvRootSize,
      this.partitions.lvmOptions.lvDataName,
      this.partitions.lvmOptions.lvDataFSType,
      this.partitions.lvmOptions.lvDataMountPoint,
      this.echo
    )

    if (this.partitions.userSwapChoice == SwapChoice.File) {
      this.devices.swap.name = 'swap.img'
      this.devices.swap.mountPoint = '/'
    }

    this.devices.efi.name = `${installDevice}${p}1`
    this.devices.efi.fsType = 'F 32 -I'
    this.devices.efi.mountPoint = '/boot/efi'

    this.devices.boot.name = `${installDevice}${p}2`
    this.devices.boot.fsType = 'ext4'
    this.devices.boot.mountPoint = '/boot'

    retVal = true
  }

  return retVal
}

/**
 *
 * @param installDevice
 * @returns
 */
export async function lvmPartInfo(installDevice: string = '/dev/sda'): Promise<[string, number]> {
  // Partizione LVM
  const lvmPartname = shx.exec(`fdisk ${installDevice} -l | grep LVM | awk '{print $1}' | cut -d "/" -f3`).stdout.trim()
  const lvmByteSize = Number(shx.exec(`cat /proc/partitions | grep ${lvmPartname}| awk '{print $3}' | grep "[0-9]"`).stdout.trim())
  const lvmSize = lvmByteSize / 1024

  return [lvmPartname, lvmSize]
}

/**
 * Create lvm partitions
 *
 * @param installDevice 
 * @param vgName
 * @param swapType
 * @param swapSize
 * @param lvmRootName
 * @param lvmRootFSType
 * @param lvmRootSize
 * @param lvmDataName
 * @param lvmDataFSType
 * @param lvmDataName
 * @param lvmDataMountPoint
 * @param echo
 * @returns
 */
export async function createLvmPartitions(
    installDevice: string,
    vgName: string = "pve",
    swapType: string,
    swapSize: number,
    lvmRootName: string = "root",
    lvmRootFSType: string = "ext4",
    lvmRootSize: string = "20%",
    lvmDataName: string = "data",
    lvmDataFSType: string = "ext4",
    lvmDataMountPoint: string = "/mnt/data",
    echo: object
  ): Promise<IDevices> {

  if (lvmRootFSType == "") {
    lvmRootFSType = "ext4"
  }

  if (lvmDataFSType == "") {
    lvmDataFSType = "ext4"
  }

  let devices = {} as IDevices
  devices.efi = {} as IDevice
  devices.boot = {} as IDevice
  devices.root = {} as IDevice
  devices.data = {} as IDevice
  devices.swap = {} as IDevice

  let lvmSwapName: string = "swap"

  const partInfo = await lvmPartInfo(installDevice)
  const lvmPartname = partInfo[0]
  const lvmSize = partInfo[1]

  let lvmSwapSize = swapSize

  // Swap partition not exists if it is a file
  if (swapType == SwapChoice.File) {
    lvmSwapSize = 0
  }

  let lvmDataSize = String(lvmSize - lvmSwapSize - parseInt(lvmRootSize))

  // Assuming no data partition if data partion options are not specified
  if ((lvmDataName == "" || lvmDataName == "none") && lvmDataMountPoint == "") {
    lvmDataSize = "0"
  }

  // Calculate percentual size of LVM if the size is expressed as percentual
  let lvmRootPercSize: number = 0
  if (lvmRootSize.includes("%")) {
    lvmRootPercSize = parseFloat(lvmRootSize)
    lvmRootSize = String(Math.floor((lvmSize * lvmRootPercSize) / 100))
  } else {
    lvmRootPercSize = ((parseFloat(lvmRootSize) / lvmSize) * 100)
  }

  if (lvmSwapSize + parseInt(lvmRootSize) + parseInt(lvmDataSize) <= lvmSize) {
    await exec(`pvcreate /dev/${lvmPartname}`, echo)
    await exec(`vgcreate ${vgName} /dev/${lvmPartname}`, echo)
    await exec('vgchange -an', echo)

    // Create LVM Swap partition, if exists
    if (lvmSwapSize > 0) {
      await exec(`lvcreate -L ${lvmSwapSize} -n ${lvmSwapName} ${vgName}`, echo)
    }

    // Create LVM root and data partitions
    if (parseInt(lvmDataSize) > 0) {
      // Create LVM root partition
      await exec(`lvcreate -L ${lvmRootSize} -n ${lvmRootName} ${vgName}`, echo)

      // Create LVM data partition using the remaining disk space
      await exec(`lvcreate -l 100%FREE -n ${lvmDataName} ${vgName}`, echo)
    } else {
      // Only root partition
      await exec(`lvcreate -l ${lvmRootPercSize}%FREE -n ${lvmRootName} ${vgName}`, echo)
    }    

    // Activate VG
    await exec(`vgchange -a y ${vgName}`, echo)

    devices.root.name = `/dev/${vgName}/${lvmRootName}`
    devices.root.fsType = lvmRootFSType
    devices.root.mountPoint = '/'

    if (parseInt(lvmDataSize) > 0) {
      devices.data.name = `/dev/${vgName}/${lvmDataName}`
      devices.data.fsType = lvmDataFSType
      devices.data.mountPoint = lvmDataMountPoint
    } else {
      devices.data.name = 'none'
    }

    if (swapType != SwapChoice.File && lvmSwapSize > 0) {
      devices.swap.name = `/dev/${vgName}/${lvmSwapName}`
    }
  } else {
    Utils.warning(`lvmRootSize | ${lvmRootSize}`)
    Utils.warning(`lvmSwapSize | ${lvmSwapSize}`)
    Utils.warning(`lvmDataSize | ${lvmDataSize}`)
    Utils.warning(`Error: size of partitions for swap, root and data exceeds the size of lvm`)
    process.exit(1)
  }

  return devices
}

/**
 * Create lvm partitions for Proxmox virtual environment
 *
 * @param installDevice 
 * @param vgName
 * @param lvmSwapName
 * @param lvmRootName
 * @param lvmRootFSType
 * @param lvmDataName
 * @param lvmDataFSType
 * @param lvmDataMountPoint
 * @param echo
 * 
 * @returns
 */
export async function createProxmoxLvmPartitions(
    installDevice: string,
    vgName: string = "pve",
    lvmRootName: string = "root",
    lvmRootFSType: string = "ext4",
    lvmDataName: string = "data",
    lvmDataFSType: string = "ext4",
    lvmDataMountPoint: string = "/var/lib/vz",
    echo: object
  ): Promise<IDevices> {
    
  let devices = {} as IDevices
  let lvmSwapName: string = "swap"

  const partInfo = await lvmPartInfo(installDevice)
  const lvmPartname = partInfo[0]
  const lvmSize = partInfo[1]

  // La partizione di root viene posta ad 1/4 della partizione LVM, limite max 100 GB
  let lvmRootSize = lvmSize / 8
  if (lvmRootSize < 20_480) {
    lvmRootSize = 20_480
  }

  const lvmSwapSize = 8192
  const lvmDataSize = lvmSize - lvmRootSize - lvmSwapSize

  await exec(`pvcreate /dev/${lvmPartname}`, echo)
  await exec(`vgcreate ${vgName} /dev/${lvmPartname}`, echo)
  await exec('vgchange -an', echo)
  await exec(`lvcreate -L ${lvmSwapSize} -n ${lvmSwapName} ${vgName}`, echo)
  await exec(`lvcreate -L ${lvmRootSize} -n ${lvmRootName} ${vgName}`, echo)
  await exec(`lvcreate -l 100%FREE -n ${lvmDataName} ${vgName}`, echo)
  await exec(`vgchange -a y ${vgName}`, echo)

  devices.root.name = `/dev/${vgName}/${lvmRootName}`
  devices.root.fsType = lvmRootFSType
  devices.root.mountPoint = '/'

  devices.data.name = `/dev/${vgName}/${lvmDataName}`
  devices.data.fsType = lvmDataFSType
  devices.data.mountPoint = lvmDataMountPoint

  devices.swap.name = `/dev/${vgName}/${lvmSwapName}`

  return devices
}
