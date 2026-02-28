/**
 * ./src/classes/ovary.d/android/android-vendor.ts
 * penguins-eggs — Android backend
 * license: MIT
 *
 * Handles Android vendor partition extraction and packaging.
 * The vendor partition contains hardware-specific drivers, firmware,
 * and HAL (Hardware Abstraction Layer) implementations.
 *
 * Vendor blobs can come from:
 *   - A mounted /vendor partition (live system)
 *   - A vendor.img file (sparse or raw ext4)
 *   - Factory images extracted via android-prepare-vendor
 *   - Waydroid vendor images
 */

import fs from 'node:fs'
import path from 'node:path'

import { exec, shx } from '../../../lib/utils.js'
import Utils from '../../utils.js'
import { isSparseImage, mountSystemImage, sparseToRaw, unmountImage } from './android-system-img.js'

export interface IVendorInfo {
  /** Path to vendor root (mounted directory or image file) */
  path: string
  /** Whether vendor is a separate partition or inside /system */
  isSeparate: boolean
  /** Vendor build fingerprint */
  fingerprint: string
  /** Vendor security patch level */
  securityPatch: string
  /** Vendor API level */
  apiLevel: string
  /** Size in bytes */
  size: number
  /** List of HAL implementations found */
  hals: string[]
}

/**
 * Detect and gather vendor partition information.
 */
export function detectVendorInfo(): IVendorInfo {
  const info: IVendorInfo = {
    apiLevel: '',
    fingerprint: '',
    hals: [],
    isSeparate: false,
    path: '',
    securityPatch: '',
    size: 0,
  }

  // Check for separate vendor partition
  const vendorPaths = [
    '/vendor',
    '/system/vendor',
    '/mnt/vendor',
  ]

  for (const vp of vendorPaths) {
    if (fs.existsSync(vp) && fs.existsSync(path.join(vp, 'build.prop'))) {
      info.path = vp
      info.isSeparate = vp === '/vendor'
      break
    }
  }

  // Check for vendor image files
  if (!info.path) {
    const imgPaths = [
      '/var/lib/waydroid/images/vendor.img',
      '/mnt/runtime/vendor.img',
    ]

    for (const ip of imgPaths) {
      if (fs.existsSync(ip)) {
        info.path = ip
        info.isSeparate = true
        break
      }
    }
  }

  if (!info.path) {
    return info
  }

  // Read vendor build.prop
  const vendorBuildProp = info.path.endsWith('.img')
    ? '' // can't read from image without mounting
    : path.join(info.path, 'build.prop')

  if (vendorBuildProp && fs.existsSync(vendorBuildProp)) {
    try {
      const data = fs.readFileSync(vendorBuildProp, 'utf8')
      for (const line of data.split('\n')) {
        const trimmed = line.trim()
        if (trimmed.startsWith('ro.vendor.build.fingerprint=')) {
          info.fingerprint = trimmed.split('=')[1] || ''
        } else if (trimmed.startsWith('ro.vendor.build.security_patch=')) {
          info.securityPatch = trimmed.split('=')[1] || ''
        } else if (trimmed.startsWith('ro.vendor.build.version.sdk=')) {
          info.apiLevel = trimmed.split('=')[1] || ''
        }
      }
    } catch {
      // permission denied
    }
  }

  // Detect HAL implementations
  info.hals = detectHals(info.path)

  // Get size
  info.size = getDirectorySize(info.path)

  return info
}

/**
 * Scan vendor directory for HAL (Hardware Abstraction Layer) implementations.
 * HALs are shared libraries in /vendor/lib64/hw/ or defined in VINTF manifests.
 */
function detectHals(vendorPath: string): string[] {
  const hals: string[] = []

  // Check hw/ directories for HAL .so files
  const hwDirs = [
    path.join(vendorPath, 'lib64', 'hw'),
    path.join(vendorPath, 'lib', 'hw'),
  ]

  for (const hwDir of hwDirs) {
    if (fs.existsSync(hwDir)) {
      try {
        const files = fs.readdirSync(hwDir)
        for (const file of files) {
          if (file.endsWith('.so')) {
            // Extract HAL name: e.g., "gralloc.default.so" → "gralloc"
            const halName = file.split('.')[0]
            if (!hals.includes(halName)) {
              hals.push(halName)
            }
          }
        }
      } catch {
        // permission denied
      }
    }
  }

  // Check VINTF manifest for HIDL/AIDL HALs
  const vintfPaths = [
    path.join(vendorPath, 'etc', 'vintf', 'manifest.xml'),
    path.join(vendorPath, 'etc', 'vintf', 'compatibility_matrix.xml'),
  ]

  for (const vintfPath of vintfPaths) {
    if (fs.existsSync(vintfPath)) {
      try {
        const data = fs.readFileSync(vintfPath, 'utf8')
        // Simple regex to extract HAL names from VINTF XML
        const halMatches = data.matchAll(/<name>([\w.]+)<\/name>/g)
        for (const match of halMatches) {
          const halName = match[1]
          if (!hals.includes(halName)) {
            hals.push(halName)
          }
        }
      } catch {
        // permission denied
      }
    }
  }

  return hals.sort()
}

/**
 * Get total size of a directory in bytes.
 */
function getDirectorySize(dirPath: string): number {
  if (dirPath.endsWith('.img')) {
    try {
      return fs.statSync(dirPath).size
    } catch {
      return 0
    }
  }

  const result = shx.exec(`du -sb ${dirPath} 2>/dev/null | cut -f1`, { silent: true })
  return Number.parseInt(result.stdout.trim(), 10) || 0
}

/**
 * Extract vendor blobs from a vendor.img file to a directory.
 * Handles both sparse and raw ext4 images.
 */
export async function extractVendorImage(
  vendorImgPath: string,
  outputDir: string,
  verbose = false
): Promise<string> {
  await exec(`mkdir -p ${outputDir}`)

  let imgToMount = vendorImgPath

  // Convert sparse to raw if needed
  if (isSparseImage(vendorImgPath)) {
    const rawPath = path.join(path.dirname(vendorImgPath), 'vendor.raw.img')
    await sparseToRaw(vendorImgPath, rawPath, verbose)
    imgToMount = rawPath
  }

  // Mount and copy
  const mountPoint = '/tmp/eggs-vendor-mount'
  await mountSystemImage(imgToMount, mountPoint, verbose)

  try {
    Utils.warning(`extracting vendor blobs to ${outputDir}`)
    await exec(`cp -a ${mountPoint}/* ${outputDir}/`, Utils.setEcho(verbose))
  } finally {
    await unmountImage(mountPoint)
    // Clean up raw conversion if we made one
    if (imgToMount !== vendorImgPath && fs.existsSync(imgToMount)) {
      fs.unlinkSync(imgToMount)
    }
  }

  return outputDir
}

/**
 * Package a vendor directory into a vendor.img (raw ext4).
 */
export async function createVendorImage(
  vendorDir: string,
  outputPath: string,
  verbose = false
): Promise<void> {
  // Calculate size with overhead
  const duResult = shx.exec(`du -sb ${vendorDir} | cut -f1`, { silent: true })
  const dirSize = Number.parseInt(duResult.stdout.trim(), 10) || 0

  if (dirSize === 0) {
    throw new Error(`Cannot determine size of ${vendorDir}`)
  }

  // Add 15% overhead for ext4 metadata
  const imageSize = Math.ceil(dirSize * 1.15)

  Utils.warning(`creating vendor.img (${(imageSize / 1024 / 1024).toFixed(0)} MB)`)

  // Create ext4 image from directory
  // mkfs.ext4 -d populates the image from a directory
  await exec(`dd if=/dev/zero of=${outputPath} bs=1 count=0 seek=${imageSize}`, Utils.setEcho(false))
  const result = await exec(
    `mkfs.ext4 -L vendor -d ${vendorDir} ${outputPath}`,
    Utils.setEcho(verbose)
  )

  if (result.code !== 0) {
    throw new Error('Failed to create vendor.img')
  }
}

/**
 * Copy vendor blobs from a live /vendor mount to a work directory,
 * preserving SELinux contexts and permissions.
 */
export async function snapshotVendor(
  vendorMount: string,
  outputDir: string,
  verbose = false
): Promise<void> {
  if (!fs.existsSync(vendorMount)) {
    throw new Error(`Vendor mount point ${vendorMount} does not exist`)
  }

  await exec(`mkdir -p ${outputDir}`)

  Utils.warning(`snapshotting vendor from ${vendorMount}`)

  // Use tar to preserve SELinux contexts, permissions, and xattrs
  const result = await exec(
    `tar --selinux --xattrs -cf - -C ${vendorMount} . | tar --selinux --xattrs -xf - -C ${outputDir}`,
    Utils.setEcho(verbose)
  )

  if (result.code !== 0) {
    // Fallback without SELinux context preservation
    Utils.warning('tar with SELinux failed, falling back to cp -a')
    await exec(`cp -a ${vendorMount}/* ${outputDir}/`, Utils.setEcho(verbose))
  }
}
