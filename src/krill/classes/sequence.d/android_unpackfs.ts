/**
 * ./src/krill/classes/sequence.d/android_unpackfs.ts
 * penguins-eggs — Android backend
 * license: MIT
 *
 * Unpacks the Android system image from the live medium to the target.
 *
 * Android ISOs contain system.sfs (squashfs of system.img or raw /system).
 * The unpack process:
 *   1. Mount system.sfs from the ISO
 *   2. If it contains system.img, mount that too
 *   3. Copy the contents to the target /system partition
 *   4. Copy /vendor to the target /vendor partition (if separate)
 *   5. Create empty /data structure
 */

import fs from 'node:fs'
import path from 'node:path'

import { exec } from '../../../lib/utils.js'
import Utils from '../../../classes/utils.js'
import Sequence from '../sequence.js'

/**
 * Unpack Android system from live medium to target partitions.
 */
export async function androidUnpackfs(this: Sequence): Promise<void> {
  const targetRoot = '/tmp/calamares-root-android'
  const systemMount = `${targetRoot}/system`
  const vendorMount = `${targetRoot}/vendor`
  const dataMount = `${targetRoot}/data`

  // Find the system.sfs on the live medium
  const sfsPath = findSystemSfs()
  if (!sfsPath) {
    throw new Error('Cannot find system.sfs on the live medium')
  }

  Utils.warning(`unpacking Android system from ${sfsPath}`)

  // Step 1: Mount system.sfs
  const sfsMountPoint = '/tmp/eggs-android-sfs-mount'
  await exec(`mkdir -p ${sfsMountPoint}`)
  await exec(`mount -o ro,loop ${sfsPath} ${sfsMountPoint}`, this.echo)

  try {
    // Step 2: Determine what's inside the squashfs
    // It could be a raw filesystem tree or contain a system.img
    const innerImg = path.join(sfsMountPoint, 'system.img')
    let systemSource = sfsMountPoint

    if (fs.existsSync(innerImg)) {
      // system.sfs contains system.img — mount it
      const imgMountPoint = '/tmp/eggs-android-img-mount'
      await exec(`mkdir -p ${imgMountPoint}`)
      await exec(`mount -o ro,loop ${innerImg} ${imgMountPoint}`, this.echo)
      systemSource = imgMountPoint
    }

    // Step 3: Copy system contents to target /system partition
    await exec(`mkdir -p ${systemMount}`)
    Utils.warning('copying /system to target')
    await exec(
      `rsync -aHAXS --info=progress2 ${systemSource}/ ${systemMount}/`,
      this.echo
    )

    // Step 4: Handle /vendor
    // Vendor may be inside /system/vendor or a separate partition
    const sourceVendor = path.join(systemSource, 'vendor')
    if (fs.existsSync(sourceVendor) && this.devices.data.mountPoint === '/vendor') {
      await exec(`mkdir -p ${vendorMount}`)
      Utils.warning('copying /vendor to target')
      await exec(
        `rsync -aHAXS --info=progress2 ${sourceVendor}/ ${vendorMount}/`,
        this.echo
      )
    }

    // Step 5: Create /data directory structure
    await exec(`mkdir -p ${dataMount}`)
    Utils.warning('creating /data structure')
    const dataDirs = [
      'app', 'data', 'media', 'misc', 'local', 'system',
      'user', 'user_de', 'dalvik-cache',
    ]
    for (const dir of dataDirs) {
      await exec(`mkdir -p ${dataMount}/${dir}`)
    }

    // Set permissions on /data (Android expects 0771)
    await exec(`chmod 0771 ${dataMount}`)

    // Cleanup inner mount if used
    if (fs.existsSync(path.join(sfsMountPoint, 'system.img'))) {
      await exec(`umount /tmp/eggs-android-img-mount`).catch(() => {})
    }
  } finally {
    // Cleanup sfs mount
    await exec(`umount ${sfsMountPoint}`).catch(() => {})
  }
}

/**
 * Find system.sfs on the live medium.
 * Checks common mount points for the ISO/USB live medium.
 */
function findSystemSfs(): string {
  const candidates = [
    '/mnt/runtime/system.sfs',
    '/cdrom/system.sfs',
    '/run/live/medium/system.sfs',
    '/lib/live/mount/medium/system.sfs',
    '/mnt/cdrom/system.sfs',
    '/mnt/usb/system.sfs',
    // Android-x86 convention
    '/mnt/runtime/system.sfs',
    '/mnt/runtime/system.efs',
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  // Search /mnt for any system.sfs
  if (fs.existsSync('/mnt')) {
    try {
      const result = require('child_process')
        .execSync('find /mnt -name "system.sfs" -maxdepth 3 2>/dev/null')
        .toString()
        .trim()
      if (result) {
        return result.split('\n')[0]
      }
    } catch { /* ignore */ }
  }

  return ''
}
