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
import getLuksPassphrase from '../../lib/get_luks-passphrase.js'

import Utils from '../../../classes/utils.js'
import { IDevices, IDevice } from '../../../interfaces/i-devices.js'
import { SwapChoice, InstallationMode } from '../../classes/krill-enums.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../../classes/sequence.js'

// React
import React from 'react';
import { render, RenderOptions, Box, Text } from 'ink'
import Install from '../../components/install.js'

/**
 *
 * @param this
 */
export default async function partition(this: Sequence): Promise<boolean> {
  const echoYes = Utils.setEcho(true)

  let retVal = false

  const installDevice = this.partitions.installationDevice


  let p: string = ""
  if (detectDeviceType(installDevice) === "standard") {
    p = ""
  } else if (detectDeviceType(installDevice) === "mmc") {
    p = ""
  } else if (detectDeviceType(installDevice) === "nvme") {
    p = "p"
  } else if (detectDeviceType(installDevice) === "raid") {
    p = "p"
  }

  const installationMode = this.partitions.installationMode
  this.swapSize = Math.round(os.totalmem() / (1024 * 1024 * 1024)) // In GB

  switch (this.partitions.userSwapChoice) {
    case SwapChoice.None: {
      this.swapSize = 0
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


  if (installationMode === InstallationMode.Standard && !this.efi) {
    /**
     * ===========================================================================================
     * BIOS/Stadard: working
     * ===========================================================================================
     */
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


    retVal = true
  } else if (installationMode === InstallationMode.Luks && !this.efi) {
    /**
     * ===========================================================================================
     * BIOS/Luks: working
     * ===========================================================================================
     */
    await exec(`parted --script ${installDevice} mklabel msdos`, this.echo)
    await exec(`parted --script --align optimal ${installDevice} mkpart primary ext4         1MiB        512MiB`, this.echo) // sda1
    await exec(`parted --script --align optimal ${installDevice} mkpart primary ext4         512MiB       100%`, this.echo) // sda3
    await exec(`parted --script ${installDevice} set 1 boot on`, this.echo) // sda1
    await exec(`parted --script ${installDevice} set 1 esp on`, this.echo) // sda1

    // BOOT 512M
    this.devices.boot.name = `${installDevice}${p}1` // 'boot'
    this.devices.boot.fsType = 'ext4'
    this.devices.boot.mountPoint = '/boot'

    // disabilito spinner per introduzione passphrase
    let message = "Creating partitions"
    await redraw(<Install message={message} percent={0} />)
    const passphrase = await getLuksPassphrase('3volution', '3volution')
    await redraw(<Install message={message} percent={0} spinner={this.spinner} />)

    // Aggiungi parametri di sicurezza espliciti
    const cipher = "aes-xts-plain64"
    const keySize = "512"
    const hash = "sha512"

    // ROOT
    const cryptoRoot = await exec(`echo -n "${passphrase}" | cryptsetup --batch-mode --cipher ${cipher} --key-size ${keySize} --hash ${hash} --type luks2 --key-file=- -v luksFormat ${installDevice}${p}2`, this.echo)
    if (cryptoRoot.code !== 0) {
      Utils.warning(`Error: ${cryptoRoot.code} ${cryptoRoot.data}`)
      process.exit(1)
    }

    const cryptoRootOpen = await exec(`echo -n "${passphrase}" | cryptsetup --key-file=- --type luks2 luksOpen ${installDevice}${p}2 root_crypted`, this.echo)
    if (cryptoRootOpen.code !== 0) {
      Utils.warning(`Error: ${cryptoRootOpen.code} ${cryptoRootOpen.data}`)
      process.exit(1)
    }

    this.devices.root.name = '/dev/mapper/root_crypted'
    this.devices.root.cryptedFrom = `${installDevice}${p}2`
    this.devices.root.fsType = 'ext4'
    this.devices.root.mountPoint = '/'

    // BOOT/DATA/EFI
    // this.devices.boot
    this.devices.data.name = 'none'
    this.devices.efi.name = 'none'
    // this.devices.boot
    this.devices.swap.name = 'none'

    retVal = true
  } else if (installationMode === InstallationMode.Standard && this.efi) {
    /**
     * ===========================================================================================
     * UEFI/Standard: working
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
  } else if (installationMode === InstallationMode.Luks && this.efi) {
    /**
     * ===========================================================================================
     * UEFI/Luks: working
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

    // disabilito spinner per introduzione passphrase
    let message = "Creating partitions"
    await redraw(<Install message={message} percent={0} />)
    const passphrase = await getLuksPassphrase('3volution', '3volution')
    await redraw(<Install message={message} percent={0} spinner={this.spinner} />)

    // Aggiungi parametri di sicurezza espliciti
    const cipher = "aes-xts-plain64"
    const keySize = "512"
    const hash = "sha512"

    // SWAP 8G
    const cryptoSwap = await exec(`echo -n "${passphrase}" | cryptsetup --batch-mode --cipher ${cipher} --key-size ${keySize} --hash ${hash} --key-file=- luksFormat ${installDevice}${p}3`, this.echo)
    if (cryptoSwap.code !== 0) {
      Utils.warning(`Error: ${cryptoSwap.code} ${cryptoSwap.data}`)
      process.exit(1)
    }

    const cryptoSwapOpen = await exec(`echo -n "${passphrase}" | cryptsetup --key-file=- luksOpen --type luks2 ${installDevice}${p}3 swap_crypted`, this.echo)
    if (cryptoSwapOpen.code !== 0) {
      Utils.warning(`Error: ${cryptoSwapOpen.code} ${cryptoSwapOpen.data}`)
      process.exit(1)
    }

    // Formatto come swap
    await exec(`mkswap /dev/mapper/swap_crypted`, this.echo)
    await exec(`swapon /dev/mapper/swap_crypted`, this.echo)

    this.devices.swap.name = '/dev/mapper/swap_crypted'
    this.devices.swap.cryptedFrom = `${installDevice}${p}3`
    this.devices.swap.fsType = 'swap'
    this.devices.swap.mountPoint = 'none'

    // ROOT
    const cryptoRoot = await exec(`echo -n "${passphrase}" | cryptsetup --batch-mode --cipher ${cipher} --key-size ${keySize} --hash ${hash} --key-file=- -v luksFormat --type luks2 ${installDevice}${p}4`, this.echo)
    if (cryptoRoot.code !== 0) {
      Utils.warning(`Error: ${cryptoRoot.code} ${cryptoRoot.data}`)
      process.exit(1)
    }

    const cryptoRootOpen = await exec(`echo -n "${passphrase}" | cryptsetup --key-file=- luksOpen --type luks2 ${installDevice}${p}4 root_crypted`, this.echo)
    if (cryptoRootOpen.code !== 0) {
      Utils.warning(`Error: ${cryptoRootOpen.code} ${cryptoRootOpen.data}`)
      process.exit(1)
    }

    this.devices.root.name = '/dev/mapper/root_crypted'
    this.devices.root.cryptedFrom = `${installDevice}${p}4`
    this.devices.root.fsType = 'ext4'
    this.devices.root.mountPoint = '/'

    // BOOT/DATA/EFI
    this.devices.data.name = 'none'

    retVal = true
  } else if (installationMode === InstallationMode.LVM2 && !this.efi) {
    /**
     * ===========================================================================================
     * BIOS/Lvm2: 
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
     * UEFI/Lmv2:
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

  const partInfo = await lvmPartInfo(installDevice)
  const lvmPartname: string = partInfo[0]
  const lvmSize: number = partInfo[1]

  let lvmSwapName: string = "swap"

  let lvmSwapSize: number = swapSize
  if (swapType == SwapChoice.File) {
    lvmSwapSize = 0
  }

  // Calculate root size based on percentage or absolute value
  let lvmRootAbsSize: number;
  if (lvmRootSize.includes("%")) {
    const lvmRootPerc = parseFloat(lvmRootSize.replace('%', ''));
    lvmRootAbsSize = Math.floor((lvmSize * lvmRootPerc) / 100);
  } else {
    lvmRootAbsSize = parseInt(lvmRootSize);
  }
  
  // Determine data size based on user configuration
  let lvmDataSize: number;
  if ((lvmDataName === "" || lvmDataName === "none") && lvmDataMountPoint === "") {
    lvmDataSize = 0;
  } else {
    lvmDataSize = lvmSize - lvmSwapSize - lvmRootAbsSize;
  }

  // Rimuovo da lvmRootSize swap e data
  lvmRootAbsSize = parseInt(lvmRootSize) - lvmSwapSize - lvmDataSize

  // Validate total sizes do not exceed VG size
  const totalSize = lvmSwapSize + lvmRootAbsSize + lvmDataSize;
  if (totalSize > lvmSize) {
    Utils.warning(`Error: Combined size of swap (${lvmSwapSize}G), root (${lvmRootAbsSize}M), and data (${lvmDataSize}G) exceeds VG size ${lvmSize}G`);
    process.exit(1);
  }

  await exec(`pvcreate /dev/${lvmPartname}`, echo);
  await exec(`vgcreate ${vgName} /dev/${lvmPartname}`, echo);
  await exec('vgchange -an', echo);

  // Create swap LV if required
  if (lvmSwapSize > 0) {
    await exec(`lvcreate -L ${lvmSwapSize}G -n ${lvmSwapName} ${vgName}`, echo);
    devices.swap.name = `/dev/${vgName}/${lvmSwapName}`;
  }

  // Create root LV
  await exec(`lvcreate -L ${lvmRootAbsSize}G -n ${lvmRootName} ${vgName}`, echo);
  devices.root.name = `/dev/${vgName}/${lvmRootName}`;
  devices.root.fsType = lvmRootFSType;
  devices.root.mountPoint = '/';

  // Create data LV if required
  if (lvmDataSize > 0) {
    await exec(`lvcreate -l 100%FREE -n ${lvmDataName} ${vgName}`, echo);
    devices.data.name = `/dev/${vgName}/${lvmDataName}`;
    devices.data.fsType = lvmDataFSType;
    devices.data.mountPoint = lvmDataMountPoint;
  } else {
    devices.data.name = 'none';
  }

  // Activate VG
  await exec(`vgchange -a y ${vgName}`, echo);

  return devices;
}

/**
 * 
 * @param device 
 * @returns 
 */
function detectDeviceType(device: string): string {
  if (device.includes('nvme')) return 'nvme'
  if (device.match(/^\/dev\/md\d+/)) return 'raid'
  if (device.includes('mmcblk')) return 'mmc'
  return 'standard'
}



/**
 *
 * @param elem
 */
async function redraw(elem: JSX.Element) {
  let opt: RenderOptions = {}
  opt.patchConsole = false
  opt.debug = true
  console.clear()
  render(elem, opt)
}

/** 

[
  { "boot": ["/dev/sda1", "/boot", "ext2", "512M"]},
  { "swap": ["/dev/mapper/pve/swap", "/", "swap", "4G"]},
  { "root": ["/dev/mapper/pve/root", "/", "ext4", "20%"]},
  { "data": ["/var/lib/vz/", "ext4", "100%"]},
]

[
  { "boot": ["/dev/sda1", "/boot", "ext2", "512M"]},
  { "root": ["/dev/mapper/ubuntu-lg", "/", "ext4", "100%"]},
}


*/
