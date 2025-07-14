/**
 * ./src/krill/modules/partition.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import os from 'node:os'

import Utils from '../../../classes/utils.js'
import { SwapChoice, InstallationMode } from '../krill_enums.js'
import Sequence from '../sequence.js'


/**
 *
 * @param this
 */
export default async function partition(this: Sequence): Promise<boolean> {
  const echoYes = Utils.setEcho(true)

  let retVal = false

  const installDevice = this.partitions.installationDevice
  const replacedPartition = this.partitions.replacedPartition


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

  if (installationMode === InstallationMode.Replace) {
    retVal = true

  } else if (installationMode === InstallationMode.EraseDisk && !this.efi) {
    retVal = await this.partitionBiosStandard(installDevice, p)

  } else if (installationMode === InstallationMode.Luks && !this.efi) {
    retVal = await this.partitionBiosLuks(installDevice, p)

  } else if (installationMode === InstallationMode.EraseDisk && this.efi) {
    retVal = await this.partitionUefiStandard(installDevice, p)

  } else if (installationMode === InstallationMode.Luks && this.efi) {
    retVal = await this.partitionUefiLuks(installDevice, p)

  }

  return retVal
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

