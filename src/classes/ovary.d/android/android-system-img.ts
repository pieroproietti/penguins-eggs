/**
 * ./src/classes/ovary.d/android/android-system-img.ts
 * penguins-eggs — Android backend
 * license: MIT
 *
 * Handles Android system.img and super.img (dynamic partitions).
 * Supports sparse image conversion, mounting, and extraction.
 */

import fs from 'node:fs'
import path from 'node:path'

import { readBuildProp } from '../../../android/prop-reader.js'
import { exec, shx } from '../../../lib/utils.js'
import Utils from '../../utils.js'

export interface IAndroidPartitionInfo {
  /** Whether the system uses dynamic partitions (super.img) */
  hasDynamicPartitions: boolean
  /** Whether the system uses A/B slots */
  hasABSlots: boolean
  /** Current slot suffix (_a, _b, or empty) */
  slotSuffix: string
  /** Detected partition paths */
  partitions: {
    system: string
    vendor: string
    product: string
    systemExt: string
    data: string
    boot: string
  }
}

/**
 * Detect the Android partition layout from the running system.
 */
export function detectPartitionLayout(): IAndroidPartitionInfo {
  const hasDynParts = readBuildProp('ro.boot.dynamic_partitions') === 'true'
  const slotSuffix = readBuildProp('ro.boot.slot_suffix') || ''
  const hasABSlots = slotSuffix !== ''

  const findPartition = (name: string): string => {
    const candidates = [
      `/${name}`,
      `/system/${name}`,
      `/mnt/${name}`,
    ]

    for (const c of candidates) {
      if (fs.existsSync(c)) {
        return c
      }
    }

    return ''
  }

  return {
    hasDynamicPartitions: hasDynParts,
    hasABSlots,
    slotSuffix,
    partitions: {
      boot: findPartition('boot') || '/boot',
      data: findPartition('data'),
      product: findPartition('product'),
      system: findPartition('system') || '/system',
      systemExt: findPartition('system_ext'),
      vendor: findPartition('vendor'),
    },
  }
}

/**
 * Check if a file is a sparse Android image.
 * Sparse images start with the magic bytes 0x3aff26ed.
 */
export function isSparseImage(imagePath: string): boolean {
  if (!fs.existsSync(imagePath)) {
    return false
  }

  try {
    const fd = fs.openSync(imagePath, 'r')
    const buf = Buffer.alloc(4)
    fs.readSync(fd, buf, 0, 4, 0)
    fs.closeSync(fd)

    // Android sparse image magic: 0xed26ff3a (little-endian)
    return buf[0] === 0xed && buf[1] === 0x26 && buf[2] === 0xff && buf[3] === 0x3a
  } catch {
    return false
  }
}

/**
 * Convert a sparse Android image to a raw ext4 image.
 * Requires `simg2img` tool.
 */
export async function sparseToRaw(sparseImg: string, rawImg: string, verbose = false): Promise<void> {
  if (shx.exec('which simg2img', { silent: true }).code !== 0) {
    throw new Error('simg2img not found. Install android-sdk-libsparse-utils or android-tools-fsutils.')
  }

  Utils.warning(`converting sparse image to raw: ${path.basename(sparseImg)}`)
  const result = await exec(`simg2img ${sparseImg} ${rawImg}`, Utils.setEcho(verbose))
  if (result.code !== 0) {
    throw new Error(`simg2img failed for ${sparseImg}`)
  }
}

/**
 * Convert a raw ext4 image to a sparse Android image.
 * Requires `img2simg` tool.
 */
export async function rawToSparse(rawImg: string, sparseImg: string, verbose = false): Promise<void> {
  if (shx.exec('which img2simg', { silent: true }).code !== 0) {
    throw new Error('img2simg not found. Install android-sdk-libsparse-utils or android-tools-fsutils.')
  }

  Utils.warning(`converting raw image to sparse: ${path.basename(rawImg)}`)
  const result = await exec(`img2simg ${rawImg} ${sparseImg}`, Utils.setEcho(verbose))
  if (result.code !== 0) {
    throw new Error(`img2simg failed for ${rawImg}`)
  }
}

/**
 * Mount an Android system image (handles both sparse and raw).
 * Returns the mount point path.
 */
export async function mountSystemImage(
  imagePath: string,
  mountPoint: string,
  verbose = false
): Promise<string> {
  await exec(`mkdir -p ${mountPoint}`)

  let imgToMount = imagePath

  // If sparse, convert to raw first
  if (isSparseImage(imagePath)) {
    const rawPath = imagePath + '.raw'
    await sparseToRaw(imagePath, rawPath, verbose)
    imgToMount = rawPath
  }

  Utils.warning(`mounting ${path.basename(imgToMount)} at ${mountPoint}`)
  const result = await exec(`mount -o ro,loop ${imgToMount} ${mountPoint}`, Utils.setEcho(verbose))
  if (result.code !== 0) {
    throw new Error(`Failed to mount ${imgToMount}`)
  }

  return mountPoint
}

/**
 * Unmount a previously mounted image.
 */
export async function unmountImage(mountPoint: string): Promise<void> {
  await exec(`umount ${mountPoint}`).catch(() => {})
}

/**
 * Find system.img or system.sfs in common Android-x86 locations.
 */
export function findSystemImage(): string {
  const candidates = [
    // Running system
    '/system',
    // Android-x86 ISO mount points
    '/mnt/runtime/system.sfs',
    '/mnt/runtime/system.img',
    // Waydroid
    '/var/lib/waydroid/images/system.img',
    // Common build output locations
    '/out/target/product/x86_64/system.img',
    '/out/target/product/generic_x86_64/system.img',
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return ''
}

/**
 * Find vendor.img in common locations.
 */
export function findVendorImage(): string {
  const candidates = [
    '/vendor',
    '/mnt/runtime/vendor.img',
    '/var/lib/waydroid/images/vendor.img',
    '/out/target/product/x86_64/vendor.img',
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return ''
}

/**
 * Get the size of a partition or image file in bytes.
 */
export function getImageSize(imagePath: string): number {
  try {
    if (fs.existsSync(imagePath)) {
      const stats = fs.statSync(imagePath)
      if (stats.isFile()) {
        return stats.size
      }

      // For mounted partitions, use df
      const result = shx.exec(`df -B1 ${imagePath} | tail -1 | awk '{print $2}'`, { silent: true })
      if (result.code === 0) {
        return Number.parseInt(result.stdout.trim(), 10) || 0
      }
    }
  } catch {
    // ignore
  }

  return 0
}

/**
 * Create a raw ext4 image from a directory.
 * Useful for creating system.img from a mounted /system.
 */
export async function createExt4Image(
  sourceDir: string,
  outputPath: string,
  label: string,
  verbose = false
): Promise<void> {
  // Calculate needed size (source + 10% overhead)
  const duResult = shx.exec(`du -sb ${sourceDir} | cut -f1`, { silent: true })
  const sourceSize = Number.parseInt(duResult.stdout.trim(), 10) || 0
  const imageSize = Math.ceil(sourceSize * 1.1)

  if (imageSize === 0) {
    throw new Error(`Cannot determine size of ${sourceDir}`)
  }

  Utils.warning(`creating ext4 image: ${path.basename(outputPath)} (${(imageSize / 1024 / 1024).toFixed(0)} MB)`)

  // Create empty image
  await exec(`dd if=/dev/zero of=${outputPath} bs=1 count=0 seek=${imageSize}`, Utils.setEcho(false))

  // Format as ext4
  await exec(`mkfs.ext4 -L ${label} -d ${sourceDir} ${outputPath}`, Utils.setEcho(verbose))
}
