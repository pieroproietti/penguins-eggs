/**
 * ./src/krill/modules/mount-fs.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import fs from 'node:fs'
import os from 'node:os'
import { exec } from '../../../lib/utils.js'
import { SwapChoice } from '../krill_enums.js'
import Sequence from '../sequence.js'

/**
 * mountFs
 */
export async function mountFs(this: Sequence): Promise<boolean> {
  if (!fs.existsSync(this.installTarget)) {
    await exec(`mkdir ${this.installTarget} ${this.toNull}`, this.echo)
  }

  // root
  await exec(`mount -t ${this.devices.root.fsType} ${this.devices.root.name} ${this.installTarget}${this.devices.root.mountPoint} ${this.toNull}`, this.echo)
  if ((await exec(`mountpoint -q ${this.installTarget}${this.devices.root.mountPoint}`)).code !== 0) {
    throw new Error(`[Krill ENOSPC Prevention] Failed to mount ${this.devices.root.name} on ${this.installTarget}${this.devices.root.mountPoint}`)
  }
  await exec(`tune2fs -c 0 -i 0 ${this.devices.root.name} ${this.toNull}`, this.echo)
  await exec(`rm -rf ${this.installTarget}/lost+found ${this.toNull}`, this.echo)

  // boot
  if (this.devices.boot.name !== 'none') {
    await exec(`mkdir ${this.installTarget}/boot -p ${this.toNull}`, this.echo)
    await exec(`mount -t ${this.devices.boot.fsType} ${this.devices.boot.name} ${this.installTarget}${this.devices.boot.mountPoint} ${this.toNull}`, this.echo)
    if ((await exec(`mountpoint -q ${this.installTarget}${this.devices.boot.mountPoint}`)).code !== 0) {
      throw new Error(`Failed to mount boot partition ${this.devices.boot.name}`)
    }
    await exec(`tune2fs -c 0 -i 0 ${this.devices.boot.name} ${this.toNull}`, this.echo)
  }

  // data
  if (os.arch() !== 'riscv64') {
    if (this.devices.data.name !== 'none') {
      await exec(`mkdir ${this.installTarget}${this.devices.data.mountPoint} -p ${this.toNull}`, this.echo)
      await exec(`mount -t ${this.devices.data.fsType} ${this.devices.data.name} ${this.installTarget}${this.devices.data.mountPoint} ${this.toNull}`, this.echo)
      if ((await exec(`mountpoint -q ${this.installTarget}${this.devices.data.mountPoint}`)).code !== 0) {
        throw new Error(`Failed to mount data partition ${this.devices.data.name}`)
      }
      await exec(`tune2fs -c 0 -i 0 ${this.devices.data.name} ${this.toNull}`, this.echo)
    }

    // efi
    if (this.efi && !fs.existsSync(this.installTarget + this.devices.efi.mountPoint)) {
      await exec(`mkdir ${this.installTarget}${this.devices.efi.mountPoint} -p ${this.toNull}`, this.echo)

      // utilizzare vfat per evitare errori
      await exec(`mount -t vfat ${this.devices.efi.name} ${this.installTarget}${this.devices.efi.mountPoint} ${this.toNull}`, this.echo)
      if ((await exec(`mountpoint -q ${this.installTarget}${this.devices.efi.mountPoint}`)).code !== 0) {
        throw new Error(`Failed to mount efi partition ${this.devices.efi.name}`)
      }
    }
  }

  // swap file if we need
  if (this.partitions.userSwapChoice === SwapChoice.File) {
    await exec(`fallocate -l 8G ${this.installTarget}/swapfile`)
    await exec(`chmod 600 ${this.devices.root.mountPoint}/swapfile`, this.echo)
    await exec(`mkswap ${this.devices.root.mountPoint}/swapfile`, this.echo)
  }

  return true
}

/**
 * umountFs
 */
export async function umountFs(this: Sequence): Promise<boolean> {
  if (os.arch() !== 'riscv64') {
    // efi
    if (this.efi) {
      await this.umount(this.devices.efi.name)
    }

    // data
    if (this.devices.data.name !== 'none') {
      await this.umount(this.devices.data.name)
    }
  }

  // boot
  if (this.devices.boot.name !== 'none') {
    await this.umount(this.devices.boot.name)
  }

  // root
  await this.umount(this.devices.root.name)

  return true
}
