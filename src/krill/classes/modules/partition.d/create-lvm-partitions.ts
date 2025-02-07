/**
 * ./src/krill/modules/partition.d/create-lvm-partitions.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import shx from 'shelljs'
import fs from 'fs'

import Utils from '../../../../classes/utils.js'
import { IDevices, IDevice } from '../../../../interfaces/i-devices.js'
import { SwapChoice, InstallationMode } from '../../krill-enums.js'
import { exec } from '../../../../lib/utils.js'
import Sequence from '../../sequence.js'

/**
 * 
 * @param this 
 * @param installDevice 
 * @returns 
 */
export default async function createLvmPartitions(this: Sequence, installDevice=""): Promise<IDevices> {

  let vgName = this.partitions.lvmOptions.vgName
  let lvmRootName = this.partitions.lvmOptions.lvRootName
  let lvmRootFSType = this.partitions.lvmOptions.lvRootFSType
  let lvmRootSize = this.partitions.lvmOptions.lvRootSize
  let lvmDataName = this.partitions.lvmOptions.lvDataName
  let lvmDataFSType = this.partitions.lvmOptions.lvDataFSType
  let lvmDataMountPoint = this.partitions.lvmOptions.lvDataMountPoint
  let swapSize = this.swapSize
  let swapType = this.partitions.userSwapChoice

  // Default as proxmox if null
  // if (vgName === '') vgName = "pve"
  // if (lvmRootName=== '') lvmRootName = "root"
  // if (lvmRootFSType === '') lvmRootFSType = "ext4"
  // if (lvmRootSize === '') lvmRootSize = "20%"
  // if (lvmDataName === '') lvmDataName = "data"
  // if (lvmDataFSType === '') lvmDataFSType = "ext4"
  // if (lvmDataMountPoint === '') lvmDataMountPoint = "/mnt/data"

  // devices are returnes as Sequence.devices
  let devices = {} as IDevices
  devices.efi = {} as IDevice
  devices.boot = {} as IDevice
  devices.root = {} as IDevice
  devices.data = {} as IDevice
  devices.swap = {} as IDevice


  if (lvmRootFSType === "") {
    lvmRootFSType = "ext4"
  }

  if (lvmDataName === "") {
    lvmDataName = "ext4"    
  }

  const partInfo = await lvmPartInfo(installDevice)
  const lvmPartname: string = partInfo[0]
  const lvmSize: number = partInfo[1]

  let lvmSwapName: string = "swap"
  let lvmSwapSize: number = swapSize
  if (swapType == SwapChoice.File) {
    lvmSwapSize = 0
  }

  // Create removeLvmPartitions
  let scriptName = "removeLvmPartitions"
  let cmds = "#!/bin/bash\n"
  cmds += `\n`
  cmds += `# remove previous lvm2\n`
  cmds += `umount ${installDevice}* 2>/dev/null || true\n`
  cmds += `lvremove --force $(lvs --noheadings -o lv_path ${installDevice} 2>/dev/null) 2>/dev/null || true\n`
  cmds += `vgremove --force $(vgs --noheadings -o vg_name ${installDevice} 2>/dev/null) 2>/dev/null || true\n`
  cmds += `pvremove --force --force ${installDevice}* 2>/dev/null || true\n`
  cmds += `wipefs -a ${installDevice} 2>/dev/null || true\n`
  fs.writeFileSync(scriptName, cmds)
  await exec(`chmod +x ${scriptName}`)

  // Create createLvmPartitions
  scriptName = "createLvmPartitions"
  cmds = "#!/bin/bash\n"

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

  // Create pv
  cmds += `pvcreate /dev/${lvmPartname}\n`

  // create vg
  cmds += `# create vg\n`
  cmds += `vgcreate ${vgName} /dev/${lvmPartname}\n`
  cmds += `vgchange -an\n`

  // Create swap LV if required
  if (lvmSwapSize > 0) {
    cmds += `# create swap LV\n`
    cmds += `lvcreate -L ${lvmSwapSize}G -n ${lvmSwapName} ${vgName}\n`
    devices.swap.name = `/dev/${vgName}/${lvmSwapName}`;
  }
  devices.swap.name = `/dev/${vgName}/${lvmSwapName}`
  devices.swap.fsType = lvmSwapName
  devices.swap.mountPoint = ''

  cmds += `# create root LV\n`
  cmds += `lvcreate -l ${lvmRootSize}FREE -n ${lvmRootName} ${vgName}\n`

  // Create data LV if required
  if (lvmDataMountPoint.trim() !== "") {
    cmds += `# create data\n`
    cmds += `lvcreate -l 100%FREE -n ${lvmDataName} ${vgName}\n`
    devices.data.name = `/dev/${vgName}/${lvmDataName}`
    devices.data.fsType = lvmDataFSType
    devices.data.mountPoint = lvmDataMountPoint
  } else {
    devices.data.name = 'none'
  }

  devices.root.name = `/dev/${vgName}/${lvmRootName}`
  devices.root.fsType = lvmRootFSType
  devices.root.mountPoint = '/'

  // Activate VG
  cmds += `# activate VG\n`
  cmds += `vgchange -a y ${vgName}\n`

  fs.writeFileSync(scriptName, cmds)
  await exec(`chmod +x ${scriptName}`)

  await exec(fs.readFileSync(scriptName, 'utf8'), this.echo)

  return devices
}

/**
 *
 * @param installDevice
 * @returns
 */
async function lvmPartInfo(installDevice: string = '/dev/sda'): Promise<[string, number]> {
  // Partizione LVM
  const lvmPartname = shx.exec(`fdisk ${installDevice} -l | grep LVM | awk '{print $1}' | cut -d "/" -f3`).stdout.trim()
  const lvmByteSize = Number(shx.exec(`cat /proc/partitions | grep ${lvmPartname}| awk '{print $3}' | grep "[0-9]"`).stdout.trim())
  const lvmSize = lvmByteSize / 1024

  return [lvmPartname, lvmSize]
}
