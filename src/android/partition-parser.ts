/**
 * ./src/android/partition-parser.ts
 * penguins-eggs — Android backend
 * license: MIT
 *
 * Handles Android dynamic partitions (super.img).
 *
 * Android 10+ uses a "super" partition that contains logical partitions
 * (system, vendor, product, system_ext, odm) managed by the device-mapper
 * linear target. The layout is described by LP (Logical Partition) metadata
 * stored at the start of super.img.
 *
 * Tools:
 *   - lpdump: reads LP metadata from super.img or running device
 *   - lpmake: creates a super.img from individual partition images
 *   - lpunpack: extracts individual partition images from super.img
 *   - parse-android-dynparts (FuriLabs): alternative parser
 */

import fs from 'node:fs'
import path from 'node:path'

import { exec, shx } from '../lib/utils.js'
import Utils from '../classes/utils.js'

export interface IDynamicPartition {
  /** Partition name (e.g., "system", "vendor") */
  name: string
  /** Partition group (e.g., "main", "google_dynamic_partitions") */
  group: string
  /** Size in bytes */
  size: number
  /** Whether the partition is read-only */
  readonly: boolean
  /** Filesystem type (usually ext4 or erofs) */
  fsType: string
}

export interface ISuperImgMetadata {
  /** Whether this is a valid super.img with LP metadata */
  isValid: boolean
  /** Block device size in bytes */
  blockDeviceSize: number
  /** Metadata slot count (usually 2 for A/B, 1 for legacy) */
  metadataSlotCount: number
  /** Partition group name */
  groupName: string
  /** Maximum group size in bytes */
  groupMaxSize: number
  /** Individual partitions */
  partitions: IDynamicPartition[]
}

/**
 * Check if dynamic partition tools are available.
 */
export function hasDynPartTools(): { lpdump: boolean; lpmake: boolean; lpunpack: boolean } {
  return {
    lpdump: shx.exec('which lpdump', { silent: true }).code === 0,
    lpmake: shx.exec('which lpmake', { silent: true }).code === 0,
    lpunpack: shx.exec('which lpunpack', { silent: true }).code === 0,
  }
}

/**
 * Read LP metadata from a super.img file using lpdump.
 */
export async function readSuperMetadata(superImgPath: string): Promise<ISuperImgMetadata> {
  const metadata: ISuperImgMetadata = {
    blockDeviceSize: 0,
    groupMaxSize: 0,
    groupName: '',
    isValid: false,
    metadataSlotCount: 0,
    partitions: [],
  }

  if (!fs.existsSync(superImgPath)) {
    return metadata
  }

  // Try lpdump first
  if (hasDynPartTools().lpdump) {
    const result = shx.exec(`lpdump ${superImgPath} 2>/dev/null`, { silent: true })
    if (result.code === 0) {
      return parseLpdumpOutput(result.stdout)
    }
  }

  // Fallback: read LP metadata header manually
  return readLpMetadataHeader(superImgPath)
}

/**
 * Parse lpdump text output into structured metadata.
 *
 * Example lpdump output:
 *   Metadata version: 10.2
 *   Metadata size: 1024 bytes
 *   Metadata max size: 65536 bytes
 *   Metadata slot count: 2
 *   Header flags: virtual_ab_device
 *   Partition table:
 *   ---
 *     Name: system_a
 *     Group: main
 *     Attributes: readonly
 *     Extents:
 *       0 .. 2097151 linear super 2048
 *   ---
 *     Name: vendor_a
 *     Group: main
 *     ...
 *   Block device table:
 *   ---
 *     Partition name: super
 *     First sector: 2048
 *     Size: 9663676416 bytes
 *   Group table:
 *   ---
 *     Name: main
 *     Maximum size: 9663676416 bytes
 */
function parseLpdumpOutput(output: string): ISuperImgMetadata {
  const metadata: ISuperImgMetadata = {
    blockDeviceSize: 0,
    groupMaxSize: 0,
    groupName: '',
    isValid: true,
    metadataSlotCount: 0,
    partitions: [],
  }

  const lines = output.split('\n')
  let currentPartition: Partial<IDynamicPartition> | null = null
  let section = '' // 'partition', 'block', 'group'

  for (const line of lines) {
    const trimmed = line.trim()

    // Metadata slot count
    const slotMatch = trimmed.match(/Metadata slot count:\s*(\d+)/)
    if (slotMatch) {
      metadata.metadataSlotCount = Number.parseInt(slotMatch[1], 10)
      continue
    }

    // Section headers
    if (trimmed === 'Partition table:') {
      section = 'partition'
      continue
    }

    if (trimmed === 'Block device table:') {
      section = 'block'
      if (currentPartition?.name) {
        metadata.partitions.push(currentPartition as IDynamicPartition)
        currentPartition = null
      }

      continue
    }

    if (trimmed === 'Group table:') {
      section = 'group'
      continue
    }

    // Separator between entries
    if (trimmed === '---') {
      if (currentPartition?.name) {
        metadata.partitions.push(currentPartition as IDynamicPartition)
      }

      currentPartition = section === 'partition'
        ? { fsType: 'ext4', group: '', name: '', readonly: false, size: 0 }
        : null
      continue
    }

    // Parse partition fields
    if (section === 'partition' && currentPartition) {
      const nameMatch = trimmed.match(/^Name:\s*(.+)/)
      if (nameMatch) {
        currentPartition.name = nameMatch[1]
        continue
      }

      const groupMatch = trimmed.match(/^Group:\s*(.+)/)
      if (groupMatch) {
        currentPartition.group = groupMatch[1]
        continue
      }

      if (trimmed.includes('readonly')) {
        currentPartition.readonly = true
        continue
      }

      // Extent line gives us size: "0 .. N linear super offset"
      const extentMatch = trimmed.match(/^(\d+)\s*\.\.\s*(\d+)\s+linear/)
      if (extentMatch) {
        const sectors = Number.parseInt(extentMatch[2], 10) - Number.parseInt(extentMatch[1], 10) + 1
        currentPartition.size = sectors * 512 // sectors are 512 bytes
        continue
      }
    }

    // Parse block device size
    if (section === 'block') {
      const sizeMatch = trimmed.match(/Size:\s*(\d+)\s*bytes/)
      if (sizeMatch) {
        metadata.blockDeviceSize = Number.parseInt(sizeMatch[1], 10)
        continue
      }
    }

    // Parse group info
    if (section === 'group') {
      const gnameMatch = trimmed.match(/^Name:\s*(.+)/)
      if (gnameMatch) {
        metadata.groupName = gnameMatch[1]
        continue
      }

      const gmaxMatch = trimmed.match(/Maximum size:\s*(\d+)\s*bytes/)
      if (gmaxMatch) {
        metadata.groupMaxSize = Number.parseInt(gmaxMatch[1], 10)
        continue
      }
    }
  }

  // Push last partition if any
  if (currentPartition?.name) {
    metadata.partitions.push(currentPartition as IDynamicPartition)
  }

  return metadata
}

/**
 * Read LP metadata header directly from super.img.
 *
 * LP metadata geometry starts at offset 4096 (LP_METADATA_GEOMETRY_OFFSET).
 * Magic: 0x616c4467 ("gDla" in ASCII, little-endian)
 */
function readLpMetadataHeader(superImgPath: string): ISuperImgMetadata {
  const metadata: ISuperImgMetadata = {
    blockDeviceSize: 0,
    groupMaxSize: 0,
    groupName: '',
    isValid: false,
    metadataSlotCount: 0,
    partitions: [],
  }

  try {
    const fd = fs.openSync(superImgPath, 'r')
    const buf = Buffer.alloc(128)

    // LP_METADATA_GEOMETRY_OFFSET = 4096
    fs.readSync(fd, buf, 0, 128, 4096)
    fs.closeSync(fd)

    // Check magic: 0x616c4467
    const magic = buf.readUInt32LE(0)
    if (magic === 0x616c4467) {
      metadata.isValid = true
      // struct_size at offset 4
      // metadata_max_size at offset 12
      // metadata_slot_count at offset 16
      metadata.metadataSlotCount = buf.readUInt32LE(16)
    }
  } catch {
    // can't read file
  }

  return metadata
}

/**
 * Extract individual partition images from a super.img using lpunpack.
 */
export async function unpackSuperImg(
  superImgPath: string,
  outputDir: string,
  verbose = false
): Promise<string[]> {
  if (!hasDynPartTools().lpunpack) {
    throw new Error('lpunpack not found. Install android-sdk-libsparse-utils or build from AOSP.')
  }

  await exec(`mkdir -p ${outputDir}`)

  Utils.warning(`unpacking super.img to ${outputDir}`)
  const result = await exec(
    `lpunpack ${superImgPath} ${outputDir}`,
    Utils.setEcho(verbose)
  )

  if (result.code !== 0) {
    throw new Error('lpunpack failed')
  }

  // List extracted images
  const extracted: string[] = []
  try {
    const files = fs.readdirSync(outputDir)
    for (const file of files) {
      if (file.endsWith('.img')) {
        extracted.push(path.join(outputDir, file))
      }
    }
  } catch {
    // ignore
  }

  return extracted
}

/**
 * Create a super.img from individual partition images using lpmake.
 *
 * @param partitions Map of partition name → image file path
 * @param outputPath Output super.img path
 * @param deviceSize Total super partition size in bytes
 * @param groupName Partition group name (default: "main")
 * @param metadataSlots Number of metadata slots (2 for A/B, 1 for legacy)
 */
export async function createSuperImg(
  partitions: Record<string, string>,
  outputPath: string,
  deviceSize: number,
  groupName = 'main',
  metadataSlots = 2,
  verbose = false
): Promise<void> {
  if (!hasDynPartTools().lpmake) {
    throw new Error('lpmake not found. Install android-sdk-libsparse-utils or build from AOSP.')
  }

  // Calculate total partition sizes
  let totalSize = 0
  const partArgs: string[] = []

  for (const [name, imgPath] of Object.entries(partitions)) {
    if (!fs.existsSync(imgPath)) {
      throw new Error(`Partition image not found: ${imgPath}`)
    }

    const stats = fs.statSync(imgPath)
    totalSize += stats.size

    partArgs.push(`--partition ${name}:readonly:${stats.size}:${groupName}`)
    partArgs.push(`--image ${name}=${imgPath}`)
  }

  if (totalSize > deviceSize) {
    throw new Error(
      `Total partition size (${(totalSize / 1024 / 1024).toFixed(0)} MB) exceeds ` +
      `device size (${(deviceSize / 1024 / 1024).toFixed(0)} MB)`
    )
  }

  let cmd = `lpmake`
  cmd += ` --device-size ${deviceSize}`
  cmd += ` --metadata-size 65536`
  cmd += ` --metadata-slots ${metadataSlots}`
  cmd += ` --group ${groupName}:${deviceSize}`

  for (const arg of partArgs) {
    cmd += ` ${arg}`
  }

  cmd += ` --output ${outputPath}`

  Utils.warning(`creating super.img (${(deviceSize / 1024 / 1024 / 1024).toFixed(1)} GB)`)
  if (verbose) {
    console.log(`  ${cmd}`)
  }

  const result = await exec(cmd, Utils.setEcho(verbose))
  if (result.code !== 0) {
    throw new Error('lpmake failed to create super.img')
  }
}
