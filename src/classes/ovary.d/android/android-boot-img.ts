/**
 * ./src/classes/ovary.d/android/android-boot-img.ts
 * penguins-eggs — Android backend
 * license: MIT
 *
 * Handles Android boot.img detection, parsing, and creation.
 * boot.img contains the kernel + ramdisk (initramfs) + optional DTB.
 *
 * For x86 ISO production, we extract kernel and initrd from boot.img.
 * For OTA/fastboot output, we produce a boot.img.
 */

import fs from 'node:fs'
import path from 'node:path'

import { AndroidArch, kernelImageName } from '../../../android/arch-detect.js'
import { exec, shx } from '../../../lib/utils.js'
import Utils from '../../utils.js'

/**
 * Android boot image header info (simplified).
 * Full spec: https://source.android.com/docs/core/architecture/bootloader/boot-image-header
 */
export interface IBootImgInfo {
  /** Path to the boot.img file */
  path: string
  /** Whether this is a valid Android boot image */
  isValid: boolean
  /** Header version (0-4) */
  headerVersion: number
  /** Kernel size in bytes */
  kernelSize: number
  /** Ramdisk size in bytes */
  ramdiskSize: number
  /** Kernel command line */
  cmdline: string
}

/**
 * Find boot.img in common locations.
 */
export function findBootImage(): string {
  const candidates = [
    '/boot.img',
    '/boot/boot.img',
    '/mnt/runtime/boot.img',
    // Build output
    '/out/target/product/x86_64/boot.img',
    '/out/target/product/generic_x86_64/boot.img',
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return ''
}

/**
 * Check if a file is a valid Android boot image.
 * Android boot images start with the magic "ANDROID!" (8 bytes).
 */
export function isAndroidBootImage(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false
  }

  try {
    const fd = fs.openSync(filePath, 'r')
    const buf = Buffer.alloc(8)
    fs.readSync(fd, buf, 0, 8, 0)
    fs.closeSync(fd)

    return buf.toString('ascii') === 'ANDROID!'
  } catch {
    return false
  }
}

/**
 * Extract kernel and ramdisk from an Android boot.img.
 * Requires `unpack_bootimg` (from AOSP) or `abootimg` or manual extraction.
 *
 * Falls back to manual extraction using known header offsets if tools aren't available.
 */
export async function unpackBootImage(
  bootImgPath: string,
  outputDir: string,
  verbose = false
): Promise<{ kernelPath: string; ramdiskPath: string; dtbPath: string }> {
  await exec(`mkdir -p ${outputDir}`)

  // Try unpack_bootimg (AOSP tool, most reliable)
  if (shx.exec('which unpack_bootimg', { silent: true }).code === 0) {
    Utils.warning('unpacking boot.img with unpack_bootimg')
    const result = await exec(
      `unpack_bootimg --boot_img ${bootImgPath} --out ${outputDir}`,
      Utils.setEcho(verbose)
    )
    if (result.code === 0) {
      return {
        dtbPath: fs.existsSync(path.join(outputDir, 'dtb')) ? path.join(outputDir, 'dtb') : '',
        kernelPath: path.join(outputDir, 'kernel'),
        ramdiskPath: path.join(outputDir, 'ramdisk'),
      }
    }
  }

  // Try abootimg (available in Debian/Ubuntu repos)
  if (shx.exec('which abootimg', { silent: true }).code === 0) {
    Utils.warning('unpacking boot.img with abootimg')
    const result = await exec(
      `cd ${outputDir} && abootimg -x ${bootImgPath}`,
      Utils.setEcho(verbose)
    )
    if (result.code === 0) {
      return {
        dtbPath: '',
        kernelPath: path.join(outputDir, 'zImage'),
        ramdiskPath: path.join(outputDir, 'initrd.img'),
      }
    }
  }

  // Try Android boot image editor (cfig)
  if (shx.exec('which boot_image_editor', { silent: true }).code === 0) {
    Utils.warning('unpacking boot.img with boot_image_editor')
    await exec(`boot_image_editor unpack ${bootImgPath} -o ${outputDir}`, Utils.setEcho(verbose))
    // boot_image_editor outputs to a specific structure
    const kernelPath = path.join(outputDir, 'kernel')
    const ramdiskPath = path.join(outputDir, 'ramdisk.img')
    if (fs.existsSync(kernelPath)) {
      return { dtbPath: '', kernelPath, ramdiskPath }
    }
  }

  // Manual extraction: read the boot image header and extract at known offsets
  Utils.warning('no boot image tools found, attempting manual extraction')
  return manualUnpackBootImage(bootImgPath, outputDir)
}

/**
 * Manual boot.img extraction using header offsets.
 * Supports boot image header v0-v2.
 *
 * Header layout (v0/v1):
 *   0x000: magic "ANDROID!" (8 bytes)
 *   0x008: kernel_size (4 bytes, little-endian)
 *   0x00C: kernel_addr (4 bytes)
 *   0x010: ramdisk_size (4 bytes, little-endian)
 *   0x014: ramdisk_addr (4 bytes)
 *   0x018: second_size (4 bytes)
 *   0x01C: second_addr (4 bytes)
 *   0x020: tags_addr (4 bytes)
 *   0x024: page_size (4 bytes, little-endian)
 *   0x028: header_version (4 bytes) [v1+]
 *   0x030: cmdline (512 bytes)
 *
 * Kernel starts at page_size offset.
 * Ramdisk starts at page_size + ceil(kernel_size / page_size) * page_size.
 */
async function manualUnpackBootImage(
  bootImgPath: string,
  outputDir: string
): Promise<{ kernelPath: string; ramdiskPath: string; dtbPath: string }> {
  const fd = fs.openSync(bootImgPath, 'r')
  const header = Buffer.alloc(1648) // enough for the full header
  fs.readSync(fd, header, 0, 1648, 0)

  // Verify magic
  const magic = header.subarray(0, 8).toString('ascii')
  if (magic !== 'ANDROID!') {
    fs.closeSync(fd)
    throw new Error(`${bootImgPath} is not a valid Android boot image`)
  }

  const kernelSize = header.readUInt32LE(8)
  const ramdiskSize = header.readUInt32LE(16)
  const pageSize = header.readUInt32LE(36)

  if (pageSize === 0 || kernelSize === 0) {
    fs.closeSync(fd)
    throw new Error('Invalid boot image header: page_size or kernel_size is 0')
  }

  // Calculate offsets
  const kernelOffset = pageSize
  const kernelPages = Math.ceil(kernelSize / pageSize)
  const ramdiskOffset = pageSize + kernelPages * pageSize

  // Extract kernel
  const kernelBuf = Buffer.alloc(kernelSize)
  fs.readSync(fd, kernelBuf, 0, kernelSize, kernelOffset)
  const kernelPath = path.join(outputDir, 'kernel')
  fs.writeFileSync(kernelPath, kernelBuf)

  // Extract ramdisk
  let ramdiskPath = ''
  if (ramdiskSize > 0) {
    const ramdiskBuf = Buffer.alloc(ramdiskSize)
    fs.readSync(fd, ramdiskBuf, 0, ramdiskSize, ramdiskOffset)
    ramdiskPath = path.join(outputDir, 'ramdisk')
    fs.writeFileSync(ramdiskPath, ramdiskBuf)
  }

  fs.closeSync(fd)

  return { dtbPath: '', kernelPath, ramdiskPath }
}

/**
 * Create an Android boot.img from kernel + ramdisk.
 * Requires `mkbootimg` (from AOSP or droidian).
 */
export async function createBootImage(
  kernelPath: string,
  ramdiskPath: string,
  outputPath: string,
  options: {
    arch?: AndroidArch
    cmdline?: string
    dtbPath?: string
    headerVersion?: number
    pageSize?: number
  } = {},
  verbose = false
): Promise<void> {
  const {
    cmdline = 'androidboot.selinux=permissive',
    dtbPath = '',
    headerVersion = 2,
    pageSize = 2048,
  } = options

  // Check for mkbootimg
  if (shx.exec('which mkbootimg', { silent: true }).code !== 0) {
    throw new Error('mkbootimg not found. Install it from AOSP tools or droidian/mkbootimg.')
  }

  let cmd = `mkbootimg`
  cmd += ` --kernel ${kernelPath}`
  cmd += ` --ramdisk ${ramdiskPath}`
  cmd += ` --cmdline "${cmdline}"`
  cmd += ` --pagesize ${pageSize}`
  cmd += ` --header_version ${headerVersion}`

  if (dtbPath && fs.existsSync(dtbPath)) {
    cmd += ` --dtb ${dtbPath}`
  }

  cmd += ` --output ${outputPath}`

  Utils.warning(`creating boot.img: ${path.basename(outputPath)}`)
  const result = await exec(cmd, Utils.setEcho(verbose))
  if (result.code !== 0) {
    throw new Error('mkbootimg failed')
  }
}
