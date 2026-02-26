/**
 * ./src/krill/classes/sequence.d/cros_partition.ts
 * penguins-eggs v.26.2.x / ecmascript 2020
 * author: Piero Proietti
 * license: MIT
 *
 * ChromiumOS partition layout management via cgpt.
 *
 * CrOS uses a 12-partition GPT layout with A/B root slots:
 *   1  STATE        (stateful, ext4, user data + /usr/local)
 *   2  KERN-A       (kernel A, signed, depthcharge loads this)
 *   3  ROOT-A       (rootfs A, ext2, dm-verity protected)
 *   4  KERN-B       (kernel B, signed, fallback)
 *   5  ROOT-B       (rootfs B, ext2, fallback)
 *   6  KERN-C       (kernel C, miniOS/recovery)
 *   7  ROOT-C       (rootfs C, miniOS/recovery -- Brunch uses this)
 *   8  OEM          (OEM customization)
 *   9  reserved     (alignment)
 *  10  reserved     (alignment)
 *  11  RWFW         (read-write firmware)
 *  12  EFI-SYSTEM   (EFI system partition, FAT32)
 *
 * cgpt is the ChromeOS GPT tool from vboot_reference.
 * It understands CrOS-specific partition type GUIDs and attributes
 * (priority, tries, successful flags on kernel partitions).
 */

import fs from 'node:fs'

import { exec } from '../../../lib/utils.js'
import Utils from '../../../classes/utils.js'

// CrOS partition type GUIDs (standard form, as cgpt expects)
export const CROS_PART_TYPES = {
  CHROMEOS_KERNEL:   'FE3A2A5D-4F32-41A7-B725-ACCC3285A309',
  CHROMEOS_ROOTFS:   '3CB8E202-3B7E-47DD-8A3C-7FF2A13CFCEC',
  CHROMEOS_FIRMWARE:  'CAB6E88E-ABF3-4102-A07A-D4BB9BE3C1D3',
  CHROMEOS_RESERVED: '2E0A753D-9E48-43B0-8337-B15192CB1B5E',
  CHROMEOS_MINIOS:   '09845860-705F-4BB5-B16C-8A8A099CAF52',
  EFI_SYSTEM:        'C12A7328-F81F-11D2-BA4B-00A0C93EC93B',
  LINUX_FS:          '0FC63DAF-8483-4772-8E79-3D69D8477DE4',
  BASIC_DATA:        'EBD0A0A2-B9E5-4433-87C0-68B6B72699C7',
} as const

/**
 * Standard CrOS partition layout.
 * Sizes in 512-byte sectors. Offsets computed at creation time.
 */
export interface CrosPartitionEntry {
  index: number
  label: string
  type: string
  sizeSectors: number
  // Kernel partition attributes
  priority?: number
  tries?: number
  successful?: number
}

/**
 * Default CrOS partition table for a 16GB+ disk.
 * STATE partition fills remaining space.
 */
export function defaultCrosLayout(diskSizeSectors: number): CrosPartitionEntry[] {
  const MB = (n: number) => n * 2048 // sectors per MB

  // Fixed-size partitions
  const kernSize = MB(32)    // 32MB per kernel partition
  const rootSize = MB(4096)  // 4GB per rootfs partition
  const oemSize = MB(16)     // 16MB OEM
  const rwfwSize = MB(8)     // 8MB RW firmware
  const efiSize = MB(64)     // 64MB EFI
  const reservedSize = MB(1) // 1MB reserved (alignment)
  const miniosKernSize = MB(64)  // 64MB miniOS kernel
  const miniosRootSize = MB(512) // 512MB miniOS rootfs

  const fixedTotal = (kernSize * 2) + (rootSize * 2) + miniosKernSize + miniosRootSize +
    oemSize + (reservedSize * 2) + rwfwSize + efiSize

  // STATE gets the rest (minimum 1GB)
  const stateSize = Math.max(MB(1024), diskSizeSectors - fixedTotal - 2048) // 2048 for GPT headers

  return [
    { index: 1,  label: 'STATE',      type: CROS_PART_TYPES.LINUX_FS,           sizeSectors: stateSize },
    { index: 2,  label: 'KERN-A',     type: CROS_PART_TYPES.CHROMEOS_KERNEL,    sizeSectors: kernSize,      priority: 15, tries: 0, successful: 1 },
    { index: 3,  label: 'ROOT-A',     type: CROS_PART_TYPES.CHROMEOS_ROOTFS,    sizeSectors: rootSize },
    { index: 4,  label: 'KERN-B',     type: CROS_PART_TYPES.CHROMEOS_KERNEL,    sizeSectors: kernSize,      priority: 0,  tries: 0, successful: 0 },
    { index: 5,  label: 'ROOT-B',     type: CROS_PART_TYPES.CHROMEOS_ROOTFS,    sizeSectors: rootSize },
    { index: 6,  label: 'KERN-C',     type: CROS_PART_TYPES.CHROMEOS_MINIOS,    sizeSectors: miniosKernSize, priority: 0,  tries: 0, successful: 0 },
    { index: 7,  label: 'ROOT-C',     type: CROS_PART_TYPES.CHROMEOS_ROOTFS,    sizeSectors: miniosRootSize },
    { index: 8,  label: 'OEM',        type: CROS_PART_TYPES.LINUX_FS,           sizeSectors: oemSize },
    { index: 9,  label: 'reserved',   type: CROS_PART_TYPES.CHROMEOS_RESERVED,  sizeSectors: reservedSize },
    { index: 10, label: 'reserved',   type: CROS_PART_TYPES.CHROMEOS_RESERVED,  sizeSectors: reservedSize },
    { index: 11, label: 'RWFW',       type: CROS_PART_TYPES.CHROMEOS_FIRMWARE,  sizeSectors: rwfwSize },
    { index: 12, label: 'EFI-SYSTEM', type: CROS_PART_TYPES.EFI_SYSTEM,         sizeSectors: efiSize },
  ]
}

/**
 * Check if cgpt is available on the system.
 */
export function hasCgpt(): boolean {
  return Utils.commandExists('cgpt')
}

/**
 * Create a CrOS GPT partition table on a device or image file.
 *
 * @param device - Block device path or image file (e.g., /dev/sda or /tmp/cros.img)
 * @param layout - Partition layout entries
 * @param echo - Verbose output
 */
export async function createCrosPartitionTable(
  device: string,
  layout: CrosPartitionEntry[],
  echo: object
): Promise<void> {
  if (!hasCgpt()) {
    throw new Error('cgpt not found. Install vboot-utils: emerge vboot-reference || crew install vboot_utils')
  }

  // Create fresh GPT
  await exec(`cgpt create ${device}`, echo)

  // Add each partition
  let nextSector = 2048 // Start after GPT header + alignment
  for (const part of layout) {
    let cmd = `cgpt add -i ${part.index} -b ${nextSector} -s ${part.sizeSectors} -t ${part.type} -l "${part.label}" ${device}`
    await exec(cmd, echo)

    // Set kernel partition attributes if applicable
    if (part.priority !== undefined) {
      await exec(`cgpt add -i ${part.index} -P ${part.priority} -T ${part.tries ?? 0} -S ${part.successful ?? 0} ${device}`, echo)
    }

    nextSector += part.sizeSectors
  }

  // Finalize: write protective MBR
  await exec(`cgpt boot -p ${device}`, echo)
}

/**
 * Read the existing CrOS partition layout from a device.
 * Parses `cgpt show` output.
 *
 * @param device - Block device or image file
 * @returns Array of partition info objects
 */
export async function readCrosPartitionTable(device: string): Promise<Array<{
  index: number
  start: number
  size: number
  type: string
  label: string
}>> {
  if (!hasCgpt()) {
    throw new Error('cgpt not found')
  }

  const { stdout } = await exec(`cgpt show -q ${device}`, { capture: true }) as any
  const lines = (stdout || '').trim().split('\n').filter((l: string) => l.trim())
  const partitions = []

  for (const line of lines) {
    // cgpt show -q format: start size index label
    const parts = line.trim().split(/\s+/)
    if (parts.length >= 4) {
      partitions.push({
        index: parseInt(parts[2], 10),
        start: parseInt(parts[0], 10),
        size: parseInt(parts[1], 10),
        type: '',  // Would need cgpt show -i N -t to get type
        label: parts.slice(3).join(' '),
      })
    }
  }

  return partitions
}

/**
 * Write a signed kernel partition to a CrOS device.
 * Uses futility vbutil_kernel to pack and sign.
 *
 * @param device - Target device
 * @param partIndex - Partition index (2 for KERN-A, 4 for KERN-B)
 * @param kpartFile - Path to the signed .kpart file
 * @param echo - Verbose output
 */
export async function writeKernelPartition(
  device: string,
  partIndex: number,
  kpartFile: string,
  echo: object
): Promise<void> {
  // Get partition offset
  const { stdout } = await exec(`cgpt show -i ${partIndex} -b ${device}`, { capture: true }) as any
  const startSector = parseInt((stdout || '').trim(), 10)

  if (isNaN(startSector) || startSector === 0) {
    throw new Error(`Cannot read start sector for partition ${partIndex} on ${device}`)
  }

  await exec(`dd if=${kpartFile} of=${device} bs=512 seek=${startSector} conv=notrunc`, echo)

  // Set partition as bootable
  await exec(`cgpt add -i ${partIndex} -P 15 -T 0 -S 1 ${device}`, echo)
}

/**
 * Format the STATE partition (ext4) and ROOT partitions (ext2/ext4).
 *
 * @param device - Block device (e.g., /dev/sda)
 * @param echo - Verbose output
 */
export async function formatCrosPartitions(device: string, echo: object): Promise<void> {
  // STATE (partition 1) - ext4
  await exec(`mkfs.ext4 -F -L STATE ${device}1`, echo)

  // ROOT-A (partition 3) - ext4 (we use ext4 instead of ext2 for live systems)
  await exec(`mkfs.ext4 -F -L ROOT-A ${device}3`, echo)

  // ROOT-B (partition 5) - leave empty for now
  // EFI-SYSTEM (partition 12) - FAT32
  if (fs.existsSync(`${device}12`)) {
    await exec(`mkfs.vfat -F 32 -n EFI-SYSTEM ${device}12`, echo)
  }
}
