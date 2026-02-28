/**
 * ./src/classes/ovary.d/android/avb-signing.ts
 * penguins-eggs — Android backend
 * license: MIT
 *
 * Android Verified Boot (AVB) 2.0 signing pipeline.
 *
 * AVB ensures the integrity of the boot chain by embedding hash
 * descriptors and signatures in a VBMeta structure. Each partition
 * (boot, system, vendor, etc.) can have its own hash tree or hash
 * descriptor, and VBMeta ties them together with a signature.
 *
 * Tools:
 *   - avbtool (from AOSP): the reference implementation
 *   - avbroot (chenxiaolong): Rust-based, patches existing signed images
 *   - avb-self-signing (AgentOak): scripts for self-signed AVB keys
 */

import fs from 'node:fs'
import path from 'node:path'

import { exec, shx } from '../../../lib/utils.js'
import Utils from '../../utils.js'

export interface IAvbConfig {
  /** Enable AVB signing */
  enabled: boolean
  /** Path to the RSA private key (PEM format) */
  keyPath: string
  /** Signing algorithm */
  algorithm: 'SHA256_RSA2048' | 'SHA256_RSA4096' | 'SHA256_RSA8192' | 'SHA512_RSA4096'
  /** Rollback index (anti-rollback protection) */
  rollbackIndex: number
  /** Partition name for the hash descriptor */
  partitionName: string
  /** Partition size in bytes (needed for hash tree calculation) */
  partitionSize: number
}

export interface IAvbInfo {
  /** Whether AVB is enabled on the running system */
  enabled: boolean
  /** VBMeta digest algorithm */
  algorithm: string
  /** Whether the device is locked */
  locked: boolean
  /** Verification state */
  state: 'green' | 'yellow' | 'orange' | 'red' | 'unknown'
  /** AVB version */
  version: string
}

/**
 * Check which AVB tools are available.
 */
export function hasAvbTools(): { avbroot: boolean; avbtool: boolean } {
  return {
    avbroot: shx.exec('which avbroot', { silent: true }).code === 0,
    avbtool: shx.exec('which avbtool', { silent: true }).code === 0,
  }
}

/**
 * Detect AVB status from the running system.
 */
export function detectAvbStatus(): IAvbInfo {
  const info: IAvbInfo = {
    algorithm: '',
    enabled: false,
    locked: false,
    state: 'unknown',
    version: '',
  }

  // Check kernel cmdline for AVB parameters
  try {
    if (fs.existsSync('/proc/cmdline')) {
      const cmdline = fs.readFileSync('/proc/cmdline', 'utf8')

      if (cmdline.includes('androidboot.verifiedbootstate=')) {
        info.enabled = true
        const stateMatch = cmdline.match(/androidboot\.verifiedbootstate=(\w+)/)
        if (stateMatch) {
          info.state = stateMatch[1] as IAvbInfo['state']
        }
      }

      if (cmdline.includes('androidboot.vbmeta.device_state=locked')) {
        info.locked = true
      }
    }
  } catch {
    // ignore
  }

  // Check for vbmeta partition or file
  const vbmetaPaths = [
    '/dev/block/by-name/vbmeta',
    '/vbmeta.img',
    '/boot/vbmeta.img',
  ]

  for (const vp of vbmetaPaths) {
    if (fs.existsSync(vp)) {
      info.enabled = true
      break
    }
  }

  return info
}

/**
 * Generate a new AVB signing key pair.
 *
 * Creates:
 *   - key.pem (RSA private key)
 *   - key.pk8 (PKCS#8 DER format, for avbtool)
 *   - key.x509.pem (self-signed certificate)
 */
export async function generateAvbKey(
  outputDir: string,
  keySize = 4096,
  verbose = false
): Promise<{ keyPem: string; keyPk8: string; certPem: string }> {
  await exec(`mkdir -p ${outputDir}`)

  const keyPem = path.join(outputDir, 'avb_key.pem')
  const keyPk8 = path.join(outputDir, 'avb_key.pk8')
  const certPem = path.join(outputDir, 'avb_cert.pem')

  Utils.warning(`generating ${keySize}-bit RSA key for AVB signing`)

  // Generate RSA private key
  await exec(
    `openssl genrsa -out ${keyPem} ${keySize}`,
    Utils.setEcho(verbose)
  )

  // Convert to PKCS#8 DER (required by avbtool)
  await exec(
    `openssl pkcs8 -topk8 -inform PEM -outform DER -in ${keyPem} -out ${keyPk8} -nocrypt`,
    Utils.setEcho(verbose)
  )

  // Generate self-signed certificate
  await exec(
    `openssl req -new -x509 -key ${keyPem} -out ${certPem} -days 10000 -subj "/CN=penguins-eggs AVB"`,
    Utils.setEcho(verbose)
  )

  return { certPem, keyPem, keyPk8 }
}

/**
 * Add an AVB hash footer to a partition image using avbtool.
 *
 * This embeds a hash descriptor at the end of the image, which
 * VBMeta references to verify the partition's integrity.
 */
export async function addAvbHashFooter(
  imagePath: string,
  config: IAvbConfig,
  verbose = false
): Promise<void> {
  if (!hasAvbTools().avbtool) {
    throw new Error('avbtool not found. Install from AOSP platform-tools or build from source.')
  }

  if (!fs.existsSync(config.keyPath)) {
    throw new Error(`AVB key not found: ${config.keyPath}`)
  }

  let cmd = `avbtool add_hash_footer`
  cmd += ` --image ${imagePath}`
  cmd += ` --partition_name ${config.partitionName}`
  cmd += ` --partition_size ${config.partitionSize}`
  cmd += ` --algorithm ${config.algorithm}`
  cmd += ` --key ${config.keyPath}`
  cmd += ` --rollback_index ${config.rollbackIndex}`

  Utils.warning(`adding AVB hash footer to ${path.basename(imagePath)}`)
  const result = await exec(cmd, Utils.setEcho(verbose))
  if (result.code !== 0) {
    throw new Error(`avbtool add_hash_footer failed for ${imagePath}`)
  }
}

/**
 * Add an AVB hashtree footer to a partition image.
 * Used for large partitions (system, vendor) where a full hash
 * would be too expensive — uses a dm-verity hash tree instead.
 */
export async function addAvbHashtreeFooter(
  imagePath: string,
  config: IAvbConfig,
  verbose = false
): Promise<void> {
  if (!hasAvbTools().avbtool) {
    throw new Error('avbtool not found.')
  }

  if (!fs.existsSync(config.keyPath)) {
    throw new Error(`AVB key not found: ${config.keyPath}`)
  }

  let cmd = `avbtool add_hashtree_footer`
  cmd += ` --image ${imagePath}`
  cmd += ` --partition_name ${config.partitionName}`
  cmd += ` --partition_size ${config.partitionSize}`
  cmd += ` --algorithm ${config.algorithm}`
  cmd += ` --key ${config.keyPath}`
  cmd += ` --rollback_index ${config.rollbackIndex}`

  Utils.warning(`adding AVB hashtree footer to ${path.basename(imagePath)}`)
  const result = await exec(cmd, Utils.setEcho(verbose))
  if (result.code !== 0) {
    throw new Error(`avbtool add_hashtree_footer failed for ${imagePath}`)
  }
}

/**
 * Create a VBMeta image that references all signed partitions.
 *
 * VBMeta is the root of trust — it contains hash descriptors
 * for all partitions and is itself signed.
 */
export async function createVbmeta(
  outputPath: string,
  partitionImages: Record<string, string>,
  keyPath: string,
  algorithm: IAvbConfig['algorithm'] = 'SHA256_RSA4096',
  verbose = false
): Promise<void> {
  if (!hasAvbTools().avbtool) {
    throw new Error('avbtool not found.')
  }

  let cmd = `avbtool make_vbmeta_image`
  cmd += ` --algorithm ${algorithm}`
  cmd += ` --key ${keyPath}`

  // Include hash descriptors from each partition
  for (const [name, imgPath] of Object.entries(partitionImages)) {
    if (fs.existsSync(imgPath)) {
      cmd += ` --include_descriptors_from_image ${imgPath}`
    }
  }

  cmd += ` --output ${outputPath}`

  Utils.warning('creating vbmeta.img')
  const result = await exec(cmd, Utils.setEcho(verbose))
  if (result.code !== 0) {
    throw new Error('avbtool make_vbmeta_image failed')
  }
}

/**
 * Verify an AVB-signed image.
 */
export async function verifyAvb(imagePath: string, verbose = false): Promise<boolean> {
  if (!hasAvbTools().avbtool) {
    Utils.warning('avbtool not available, skipping AVB verification')
    return false
  }

  const result = await exec(
    `avbtool verify_image --image ${imagePath}`,
    Utils.setEcho(verbose)
  )

  return result.code === 0
}

/**
 * Extract AVB info (footer/vbmeta) from an image.
 */
export async function extractAvbInfo(imagePath: string): Promise<string> {
  if (!hasAvbTools().avbtool) {
    return 'avbtool not available'
  }

  const result = shx.exec(`avbtool info_image --image ${imagePath} 2>/dev/null`, { silent: true })
  return result.code === 0 ? result.stdout : ''
}

/**
 * Sign all partitions and create a complete VBMeta chain.
 * This is the high-level function that signs an entire Android image set.
 */
export async function signImageSet(
  images: {
    boot?: string
    system?: string
    vendor?: string
    vbmeta?: string
  },
  keyPath: string,
  algorithm: IAvbConfig['algorithm'] = 'SHA256_RSA4096',
  verbose = false
): Promise<void> {
  Utils.warning('signing Android image set with AVB')

  // Sign boot.img with hash footer
  if (images.boot && fs.existsSync(images.boot)) {
    const bootSize = fs.statSync(images.boot).size
    // Round up to next 4096 boundary + space for footer
    const partSize = Math.ceil(bootSize / 4096) * 4096 + 65536
    await addAvbHashFooter(images.boot, {
      algorithm,
      enabled: true,
      keyPath,
      partitionName: 'boot',
      partitionSize: partSize,
      rollbackIndex: 0,
    }, verbose)
  }

  // Sign system.img with hashtree footer (dm-verity)
  if (images.system && fs.existsSync(images.system)) {
    const sysSize = fs.statSync(images.system).size
    const partSize = Math.ceil(sysSize / 4096) * 4096 + 4 * 1024 * 1024 // extra for hashtree
    await addAvbHashtreeFooter(images.system, {
      algorithm,
      enabled: true,
      keyPath,
      partitionName: 'system',
      partitionSize: partSize,
      rollbackIndex: 0,
    }, verbose)
  }

  // Sign vendor.img with hashtree footer
  if (images.vendor && fs.existsSync(images.vendor)) {
    const vendorSize = fs.statSync(images.vendor).size
    const partSize = Math.ceil(vendorSize / 4096) * 4096 + 4 * 1024 * 1024
    await addAvbHashtreeFooter(images.vendor, {
      algorithm,
      enabled: true,
      keyPath,
      partitionName: 'vendor',
      partitionSize: partSize,
      rollbackIndex: 0,
    }, verbose)
  }

  // Create VBMeta that references all signed partitions
  const vbmetaPath = images.vbmeta || '/tmp/eggs-vbmeta.img'
  const signedImages: Record<string, string> = {}
  if (images.boot) signedImages.boot = images.boot
  if (images.system) signedImages.system = images.system
  if (images.vendor) signedImages.vendor = images.vendor

  await createVbmeta(vbmetaPath, signedImages, keyPath, algorithm, verbose)
}
