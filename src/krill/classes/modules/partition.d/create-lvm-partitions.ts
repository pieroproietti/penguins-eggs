/**
 * ./src/krill/modules/partition.ts
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

  cmds += `# create root LV\n`
  cmds += `lvcreate -l ${lvmRootSize}FREE -n ${lvmRootName} ${vgName}\n`

  devices.root.name = `/dev/${vgName}/${lvmRootName}`;
  devices.root.fsType = lvmRootFSType;
  devices.root.mountPoint = '/';

  // Create data LV if required
  if (lvmDataMountPoint.trim() !== "") {
    cmds += `# create data\n`
    cmds += `lvcreate -l 100%FREE -n ${lvmDataName} ${vgName}\n`
    devices.data.name = `/dev/${vgName}/${lvmDataName}`;
    devices.data.fsType = lvmDataFSType;
    devices.data.mountPoint = lvmDataMountPoint;
  } else {
    devices.data.name = 'none';
  }

  // Activate VG
  cmds += `# activate VG\n`
  cmds += `vgchange -a y ${vgName}\n`

  fs.writeFileSync(scriptName, cmds)
  await exec(`chmod +x ${scriptName}`)

  await exec(fs.readFileSync(scriptName, 'utf8'), echo)

  return devices;
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
