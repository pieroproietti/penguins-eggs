/**
 * ./src/classes/ovary.d/cros_image.ts
 * penguins-eggs v.26.2.x / ecmascript 2020
 * author: Piero Proietti
 * license: MIT
 *
 * Produces CrOS-compatible disk images with signed kernel partitions.
 *
 * This module creates images that can be:
 *   1. dd'd directly to a USB drive and booted via depthcharge (dev mode)
 *   2. Flashed via cros flash
 *   3. Used with Brunch framework
 *
 * The image contains:
 *   - A signed kernel partition (KERN-A) with vmlinuz + cmdline
 *   - A rootfs partition (ROOT-A) with the squashfs live filesystem
 *   - A STATE partition for persistence
 *   - An EFI-SYSTEM partition for UEFI fallback boot
 *
 * Kernel signing uses vboot dev keys by default (works in dev mode).
 * Custom keys can be provided for verified boot on managed devices.
 */

import fs from 'node:fs'
import path from 'node:path'

import { exec } from '../../lib/utils.js'
import Utils from '../utils.js'

// Default vboot dev key paths (from vboot-utils package)
const VBOOT_DEVKEYS = {
  keyblock: '/usr/share/vboot/devkeys/kernel.keyblock',
  signprivate: '/usr/share/vboot/devkeys/kernel_data_key.vbprivk',
}

// Alternative key paths (Chromebrew, Gentoo Prefix)
const VBOOT_DEVKEYS_ALT = [
  { keyblock: '/usr/local/share/vboot/devkeys/kernel.keyblock', signprivate: '/usr/local/share/vboot/devkeys/kernel_data_key.vbprivk' },
  { keyblock: '/usr/share/vboot/devkeys/kernel.keyblock', signprivate: '/usr/share/vboot/devkeys/kernel_data_key.vbprivk' },
]

export interface CrosImageOptions {
  /** Path to vmlinuz kernel image */
  vmlinuz: string
  /** Kernel command line for live boot */
  cmdline: string
  /** Path to the squashfs rootfs */
  squashfs: string
  /** Output image path */
  outputImage: string
  /** Target architecture: 'x86_64' or 'arm64' */
  arch: 'x86_64' | 'arm64'
  /** Image size in MB (default: auto-calculated from squashfs + 2GB overhead) */
  imageSizeMB?: number
  /** Custom vboot keyblock path (default: dev keys) */
  keyblock?: string
  /** Custom vboot sign private key path (default: dev keys) */
  signprivate?: string
  /** Include EFI boot support (default: true for x86_64) */
  efi?: boolean
  /** Verbose output */
  verbose?: boolean
}

/**
 * Find vboot dev keys on the system.
 */
function findVbootKeys(): { keyblock: string; signprivate: string } | null {
  if (fs.existsSync(VBOOT_DEVKEYS.keyblock) && fs.existsSync(VBOOT_DEVKEYS.signprivate)) {
    return VBOOT_DEVKEYS
  }

  for (const alt of VBOOT_DEVKEYS_ALT) {
    if (fs.existsSync(alt.keyblock) && fs.existsSync(alt.signprivate)) {
      return alt
    }
  }

  return null
}

/**
 * Check if futility (vboot signing tool) is available.
 */
export function hasFutility(): boolean {
  return Utils.commandExists('futility')
}

/**
 * Check if cgpt is available.
 */
export function hasCgpt(): boolean {
  return Utils.commandExists('cgpt')
}

/**
 * Pack and sign a kernel for a CrOS kernel partition.
 *
 * Uses `futility vbutil_kernel --pack` which is the same tool
 * submarine uses in its Makefile.
 *
 * @param vmlinuz - Path to kernel bzImage
 * @param cmdline - Kernel command line string
 * @param outputKpart - Output .kpart file path
 * @param arch - Target architecture
 * @param keyblock - Path to keyblock file
 * @param signprivate - Path to signing private key
 * @param echo - Verbose output
 */
export async function signKernel(
  vmlinuz: string,
  cmdline: string,
  outputKpart: string,
  arch: 'x86_64' | 'arm64',
  keyblock: string,
  signprivate: string,
  echo: object
): Promise<void> {
  if (!hasFutility()) {
    throw new Error('futility not found. Install vboot-utils: emerge vboot-reference || crew install vboot_utils')
  }

  // Write cmdline to temp file (futility reads from file)
  const cmdlineFile = '/tmp/eggs-cros-cmdline.txt'
  fs.writeFileSync(cmdlineFile, cmdline)

  // futility vbutil_kernel --pack is the standard way to create a signed kernel partition.
  // This is exactly what submarine's Makefile does.
  const archFlag = arch === 'arm64' ? 'arm' : 'x86'
  const cmd = [
    'futility vbutil_kernel',
    '--pack', outputKpart,
    '--keyblock', keyblock,
    '--signprivate', signprivate,
    '--config', cmdlineFile,
    '--bootloader', cmdlineFile,  // bootloader stub (can be empty/cmdline)
    '--vmlinuz', vmlinuz,
    '--version', '1',
    '--arch', archFlag,
  ].join(' ')

  await exec(cmd, echo)

  // Cleanup
  fs.unlinkSync(cmdlineFile)
}

/**
 * Create a CrOS-compatible disk image.
 *
 * Layout:
 *   Partition 1: STATE (ext4, 1GB minimum)
 *   Partition 2: KERN-A (signed kernel, 32MB)
 *   Partition 3: ROOT-A (squashfs rootfs)
 *   Partition 12: EFI-SYSTEM (FAT32, 64MB, x86_64 only)
 */
export async function createCrosImage(options: CrosImageOptions): Promise<void> {
  const echo = Utils.setEcho(options.verbose ?? false)

  // Validate tools
  if (!hasFutility()) {
    throw new Error('futility not found. Install vboot-utils.')
  }
  if (!hasCgpt()) {
    throw new Error('cgpt not found. Install vboot-utils.')
  }

  // Find signing keys
  const keys = options.keyblock && options.signprivate
    ? { keyblock: options.keyblock, signprivate: options.signprivate }
    : findVbootKeys()

  if (!keys) {
    throw new Error('vboot dev keys not found. Install vboot-utils or provide custom keys.')
  }

  // Calculate image size
  const squashfsSize = fs.statSync(options.squashfs).size
  const squashfsSizeMB = Math.ceil(squashfsSize / (1024 * 1024))
  const imageSizeMB = options.imageSizeMB ?? (squashfsSizeMB + 2048) // squashfs + 2GB overhead
  const imageSizeSectors = imageSizeMB * 2048

  const kernSizeMB = 32
  const kernSizeSectors = kernSizeMB * 2048
  const efiSizeMB = 64
  const efiSizeSectors = efiSizeMB * 2048
  const rootSizeSectors = Math.ceil(squashfsSize / 512) + 2048 // squashfs + padding
  const stateSizeSectors = imageSizeSectors - kernSizeSectors - rootSizeSectors - efiSizeSectors - 4096

  Utils.warning(`Creating CrOS image: ${imageSizeMB}MB (rootfs: ${squashfsSizeMB}MB)`)

  // 1. Create sparse image file
  await exec(`fallocate -l ${imageSizeMB}M ${options.outputImage}`, echo)

  // 2. Create CrOS GPT with cgpt
  await exec(`cgpt create ${options.outputImage}`, echo)

  // Add partitions (following submarine's pattern)
  let offset = 2048

  // STATE (partition 1)
  await exec(`cgpt add -i 1 -b ${offset} -s ${stateSizeSectors} -t ${CROS_PART_TYPES.LINUX_FS} -l STATE ${options.outputImage}`, echo)
  offset += stateSizeSectors

  // KERN-A (partition 2) -- signed kernel
  await exec(`cgpt add -i 2 -b ${offset} -s ${kernSizeSectors} -t kernel -P 15 -T 0 -S 1 ${options.outputImage}`, echo)
  const kernOffset = offset
  offset += kernSizeSectors

  // ROOT-A (partition 3) -- squashfs rootfs
  await exec(`cgpt add -i 3 -b ${offset} -s ${rootSizeSectors} -t rootfs -l ROOT-A ${options.outputImage}`, echo)
  const rootOffset = offset
  offset += rootSizeSectors

  // EFI-SYSTEM (partition 12) -- for UEFI fallback
  if (options.efi !== false && options.arch === 'x86_64') {
    await exec(`cgpt add -i 12 -b ${offset} -s ${efiSizeSectors} -t efi -l EFI-SYSTEM ${options.outputImage}`, echo)
  }

  // Write protective MBR
  await exec(`cgpt boot -p ${options.outputImage}`, echo)

  // 3. Sign kernel and write to KERN-A
  const kpartFile = '/tmp/eggs-cros.kpart'
  await signKernel(
    options.vmlinuz,
    options.cmdline,
    kpartFile,
    options.arch,
    keys.keyblock,
    keys.signprivate,
    echo
  )

  // dd signed kernel into KERN-A partition
  await exec(`dd if=${kpartFile} of=${options.outputImage} bs=512 seek=${kernOffset} conv=notrunc`, echo)
  fs.unlinkSync(kpartFile)

  // 4. Write squashfs into ROOT-A partition
  await exec(`dd if=${options.squashfs} of=${options.outputImage} bs=512 seek=${rootOffset} conv=notrunc`, echo)

  Utils.warning(`CrOS image created: ${options.outputImage}`)
}

// Re-export partition types for use by other modules
const CROS_PART_TYPES = {
  CHROMEOS_KERNEL:   'FE3A2A5D-4F32-41A7-B725-ACCC3285A309',
  CHROMEOS_ROOTFS:   '3CB8E202-3B7E-47DD-8A3C-7FF2A13CFCEC',
  CHROMEOS_FIRMWARE:  'CAB6E88E-ABF3-4102-A07A-D4BB9BE3C1D3',
  CHROMEOS_RESERVED: '2E0A753D-9E48-43B0-8337-B15192CB1B5E',
  CHROMEOS_MINIOS:   '09845860-705F-4BB5-B16C-8A8A099CAF52',
  EFI_SYSTEM:        'C12A7328-F81F-11D2-BA4B-00A0C93EC93B',
  LINUX_FS:          '0FC63DAF-8483-4772-8E79-3D69D8477DE4',
  BASIC_DATA:        'EBD0A0A2-B9E5-4433-87C0-68B6B72699C7',
} as const
