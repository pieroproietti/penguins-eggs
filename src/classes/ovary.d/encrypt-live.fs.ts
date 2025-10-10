/**
 * ./src/classes/ovary.d/edit-live-fs.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'
import os from 'os'
import path from 'node:path'
import shx from 'shelljs'

// classes
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import Pacman from '../pacman.js'
import Systemctl from '../systemctl.js'

import { exec } from '../../lib/utils.js'
import { execSync } from 'node:child_process'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * encryptLiveFs()
 * 
 * SQFS_SIZE=$(stat -c%s "path/to/filesystem.squashfs")
 * CONTAINER_SIZE=$((SQFS_SIZE + 200 * 1024 * 1024)) # Add 200MB overhead
 * dd if=/dev/zero of=LIVE.luks bs=1M count=$((CONTAINER_SIZE / 1024 / 1024))
 * 
 * cryptsetup open encrypted-filesystem.squashfs live_fs
 * mkfs.ext4 /dev/mapper/live_fs
 * mount /dev/mapper/live_fs /mnt
 * mkdir /mnt/live
 * mv /home/eggs/.mnt/filesystem.squashfs /mnt/live/
 * umount /mnt/
 * cryptsetup close live_fs
 * mv encrypted-filesystem.squashfs/home/eggs/.mnt/
 * 
 * InitramfsEnableLuks()
 * 
 */
export async function encryptLiveFs(this: Ovary, clone = false, cryptedclone = false) {
  const live_fs = `${this.settings.iso_work}live/filesystem.squashfs`

  const luksName = 'encrypted.filesystem.squashfs'
  const luksDevice = `/dev/mapper/${luksName}`
  const luksFile = `/tmp/${luksName}`
  const luksMountpoint = `/tmp/mnt/${luksName}`


  // calcolo size
  const sizeString = (await exec(`unsquashfs -s ${live_fs} | grep "Filesystem size" | sed -e 's/.*size //' -e 's/ .*//'`, { capture: true, echo: false })).data
  let size = Number.parseInt(sizeString) + 2048
  console.log('size filesystem.squashfs:', bytesToGB(size), size)

  const luksBlockSize = 512
  const luksBlocks = Math.ceil(size / luksBlockSize)
  size = luksBlockSize * luksBlocks

  // Aggiungo un 20% in più per ottenere luksSize
  const luksSize = Math.ceil(size * 1.2)
  console.log('encrypted.filesystem.squashfs:', bytesToGB(luksSize), luksSize)

  // truncate * 2048 è cruciale
  const truncateAt = luksSize * 2048

  Utils.warning(`Preparing file ${luksFile} for ${luksDevice}, size ${truncateAt}`)
  await exec(`truncate --size ${luksSize} ${luksFile}`, this.echo)

  Utils.warning(`Creating LUKS Volume on ${luksFile}`)
  await exec(`cryptsetup --batch-mode luksFormat ${luksFile}`, Utils.setEcho(true))
  console.log('')

  // open LUKS volume temp
  Utils.warning(`Opening LUKS Volume on ${luksFile}`)
  const { code } = await exec(`cryptsetup luksOpen ${luksFile} ${luksName}`, Utils.setEcho(true))
  if (code != 0) {
    Utils.error(`cryptsetup luksOpen ${luksFile} ${luksName} failed`)
    process.exit(code)
  }

  await exec('udevadm settle', this.echo)

  // formatta ext4 il volume
  await exec(`mkfs.ext4 ${luksDevice}`, this.echo)
  console.log('')

  // mount LUKS volume
  if (!fs.existsSync(luksMountpoint)) {
    Utils.warning(`creating mountpoint ${luksMountpoint}`)
    await exec(`mkdir -p ${luksMountpoint}`, this.echo)
  }

  if (!Utils.isMountpoint(luksMountpoint)) {
    Utils.warning(`mounting volume: ${luksDevice} on ${luksMountpoint}`)
    const { code } = await exec(`mount ${luksDevice} ${luksMountpoint}`, Utils.setEcho(true))
    if (code != 0) {
      Utils.error(`mount ${luksDevice} ${luksMountpoint} failed`)
      process.exit(code)
    }
  }

  Utils.warning(`copyng ${live_fs} to ${luksMountpoint}`)
  await exec(`cp ${live_fs} ${luksMountpoint}`, this.echo)

  Utils.warning(`Umounting ${luksMountpoint}`)
  await exec(`umount ${luksMountpoint}`, this.echo)
  Utils.warning(`Vlosing ${luksMountpoint}`)
  await exec(`cryptsetup luksClose ${luksName}`, this.echo)

    Utils.warning(`copyng ${luksFile} to ${this.settings.iso_work}live/${luksName}`)
}


/**
 * Convert bytes to gigabytes
 */
function bytesToGB(bytes: number): string {
  const gigabytes = bytes / 1_073_741_824
  return gigabytes.toFixed(2) + ' GB'
}
