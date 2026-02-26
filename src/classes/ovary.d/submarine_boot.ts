/**
 * ./src/classes/ovary.d/submarine_boot.ts
 * penguins-eggs v.26.2.x / ecmascript 2020
 * author: Piero Proietti
 * license: MIT
 *
 * Submarine bootloader integration for depthcharge-compatible live boot.
 *
 * Submarine (FyraLabs) is a minimal Linux environment that lives in a 16MB
 * kernel partition. Depthcharge loads it, and submarine's u-root initramfs
 * then discovers and kexec's into the real kernel on the rootfs partition.
 *
 * This module:
 *   1. Downloads or locates a pre-built submarine .kpart
 *   2. Creates a CrOS disk image with submarine in KERN-A
 *   3. Places the real kernel + squashfs in ROOT-A
 *   4. Submarine's boot command finds and kexec's the real kernel
 *
 * This approach bypasses the verified boot problem entirely:
 *   - Submarine is signed with dev keys (works in dev mode)
 *   - The real kernel doesn't need to be signed
 *   - Works on both x86_64 and arm64 Chromebooks
 *   - No custom firmware (MrChromebox) required
 */

import fs from 'node:fs'
import path from 'node:path'

import { exec } from '../../lib/utils.js'
import Utils from '../utils.js'

// Submarine release URLs
const SUBMARINE_RELEASES = {
  x86_64: 'https://github.com/FyraLabs/submarine/releases/latest/download/submarine-x86_64.kpart',
  arm64: 'https://github.com/FyraLabs/submarine/releases/latest/download/submarine-arm64.kpart',
} as const

// Nightly builds (from main branch)
const SUBMARINE_NIGHTLY = {
  x86_64: 'https://nightly.link/FyraLabs/submarine/workflows/build/main/submarine-x86_64.zip',
  arm64: 'https://nightly.link/FyraLabs/submarine/workflows/build/main/submarine-arm64.zip',
} as const

// Local cache paths
const SUBMARINE_CACHE_DIR = '/var/cache/penguins-eggs/submarine'

export interface SubmarineBootOptions {
  /** Target architecture */
  arch: 'x86_64' | 'arm64'
  /** Path to the real kernel (vmlinuz) to be placed on rootfs */
  vmlinuz: string
  /** Path to the real initramfs (dracut-generated) */
  initramfs: string
  /** Kernel command line for the real kernel */
  cmdline: string
  /** Path to the squashfs rootfs */
  squashfs: string
  /** Output image path */
  outputImage: string
  /** Image size in MB (auto-calculated if not set) */
  imageSizeMB?: number
  /** Use nightly submarine build instead of release */
  nightly?: boolean
  /** Path to a local submarine .kpart (skip download) */
  localKpart?: string
  /** Verbose output */
  verbose?: boolean
}

/**
 * Get or download the submarine .kpart for the target architecture.
 */
async function getSubmarineKpart(
  arch: 'x86_64' | 'arm64',
  nightly: boolean,
  localKpart: string | undefined,
  echo: object
): Promise<string> {
  // Use local kpart if provided
  if (localKpart && fs.existsSync(localKpart)) {
    return localKpart
  }

  // Check cache
  const cacheFile = path.join(SUBMARINE_CACHE_DIR, `submarine-${arch}.kpart`)
  if (fs.existsSync(cacheFile)) {
    Utils.warning(`Using cached submarine kpart: ${cacheFile}`)
    return cacheFile
  }

  // Download
  fs.mkdirSync(SUBMARINE_CACHE_DIR, { recursive: true })

  if (nightly) {
    const zipUrl = SUBMARINE_NIGHTLY[arch]
    const zipFile = path.join(SUBMARINE_CACHE_DIR, `submarine-${arch}.zip`)
    Utils.warning(`Downloading submarine nightly for ${arch}...`)
    await exec(`curl -L -o ${zipFile} "${zipUrl}"`, echo)
    await exec(`cd ${SUBMARINE_CACHE_DIR} && unzip -o ${zipFile}`, echo)
    fs.unlinkSync(zipFile)
  } else {
    const url = SUBMARINE_RELEASES[arch]
    Utils.warning(`Downloading submarine release for ${arch}...`)
    await exec(`curl -L -o ${cacheFile} "${url}"`, echo)
  }

  if (!fs.existsSync(cacheFile)) {
    throw new Error(`Failed to download submarine kpart for ${arch}`)
  }

  return cacheFile
}

/**
 * Create a CrOS disk image using submarine as the bootloader.
 *
 * Image layout:
 *   Partition 2 (KERN-A): submarine .kpart (16-32MB, signed with dev keys)
 *   Partition 3 (ROOT-A): ext4 containing:
 *     /vmlinuz          -- the real kernel
 *     /initramfs.img    -- dracut initramfs for live boot
 *     /cmdline          -- kernel command line
 *     /live/filesystem.squashfs -- the live rootfs
 *   Partition 1 (STATE): ext4 for persistence (optional)
 *   Partition 12 (EFI-SYSTEM): FAT32 for UEFI fallback (x86_64 only)
 *
 * Boot flow:
 *   1. Depthcharge loads submarine from KERN-A
 *   2. Submarine's u-root initramfs runs `boot` command
 *   3. `boot` scans partitions, finds /vmlinuz on ROOT-A
 *   4. kexec into the real kernel with the real initramfs
 *   5. dracut initramfs mounts squashfs as live rootfs
 */
export async function createSubmarineImage(options: SubmarineBootOptions): Promise<void> {
  const echo = Utils.setEcho(options.verbose ?? false)

  if (!Utils.commandExists('cgpt')) {
    throw new Error('cgpt not found. Install vboot-utils.')
  }

  // 1. Get submarine kpart
  const kpartFile = await getSubmarineKpart(
    options.arch,
    options.nightly ?? false,
    options.localKpart,
    echo
  )

  const kpartSize = fs.statSync(kpartFile).size
  const kpartSizeSectors = Math.ceil(kpartSize / 512) + 2048 // padding

  // 2. Calculate image size
  const squashfsSize = fs.statSync(options.squashfs).size
  const vmlinuzSize = fs.statSync(options.vmlinuz).size
  const initramfsSize = fs.statSync(options.initramfs).size
  const rootContentSize = squashfsSize + vmlinuzSize + initramfsSize + (64 * 1024 * 1024) // 64MB overhead for ext4
  const rootSizeSectors = Math.ceil(rootContentSize / 512)

  const efiSizeSectors = options.arch === 'x86_64' ? 64 * 2048 : 0
  const stateSizeSectors = 1024 * 2048 // 1GB STATE

  const totalSectors = 2048 + stateSizeSectors + kpartSizeSectors + rootSizeSectors + efiSizeSectors + 2048
  const imageSizeMB = options.imageSizeMB ?? Math.ceil(totalSectors / 2048)

  Utils.warning(`Creating submarine boot image: ${imageSizeMB}MB`)
  Utils.warning(`  Submarine kpart: ${Math.ceil(kpartSize / (1024 * 1024))}MB`)
  Utils.warning(`  Root filesystem: ${Math.ceil(rootContentSize / (1024 * 1024))}MB`)

  // 3. Create sparse image
  await exec(`fallocate -l ${imageSizeMB}M ${options.outputImage}`, echo)

  // 4. Create CrOS GPT
  await exec(`cgpt create ${options.outputImage}`, echo)

  let offset = 2048

  // STATE (partition 1)
  await exec(`cgpt add -i 1 -b ${offset} -s ${stateSizeSectors} -t data -l STATE ${options.outputImage}`, echo)
  offset += stateSizeSectors

  // KERN-A (partition 2) -- submarine
  await exec(`cgpt add -i 2 -b ${offset} -s ${kpartSizeSectors} -t kernel -P 15 -T 0 -S 1 ${options.outputImage}`, echo)
  const kernOffset = offset
  offset += kpartSizeSectors

  // ROOT-A (partition 3) -- real kernel + squashfs
  await exec(`cgpt add -i 3 -b ${offset} -s ${rootSizeSectors} -t rootfs -l ROOT-A ${options.outputImage}`, echo)
  const rootOffset = offset
  const rootSizeBytes = rootSizeSectors * 512
  offset += rootSizeSectors

  // EFI-SYSTEM (partition 12)
  if (options.arch === 'x86_64') {
    await exec(`cgpt add -i 12 -b ${offset} -s ${efiSizeSectors} -t efi -l EFI-SYSTEM ${options.outputImage}`, echo)
  }

  // Protective MBR
  await exec(`cgpt boot -p ${options.outputImage}`, echo)

  // 5. Write submarine kpart to KERN-A
  await exec(`dd if=${kpartFile} of=${options.outputImage} bs=512 seek=${kernOffset} conv=notrunc`, echo)

  // 6. Create ROOT-A filesystem with real kernel + squashfs
  // Create a temporary ext4 image for ROOT-A
  const rootImg = '/tmp/eggs-cros-root.img'
  const rootMnt = '/tmp/eggs-cros-root-mnt'

  await exec(`fallocate -l ${rootSizeBytes} ${rootImg}`, echo)
  await exec(`mkfs.ext4 -F -L ROOT-A ${rootImg}`, echo)

  fs.mkdirSync(rootMnt, { recursive: true })
  await exec(`mount -o loop ${rootImg} ${rootMnt}`, echo)

  try {
    // Place kernel and initramfs where submarine's boot command can find them
    // submarine's u-root `boot` scans for /vmlinuz, /boot/vmlinuz, etc.
    fs.copyFileSync(options.vmlinuz, path.join(rootMnt, 'vmlinuz'))
    fs.copyFileSync(options.initramfs, path.join(rootMnt, 'initramfs.img'))

    // Write kernel command line
    fs.writeFileSync(path.join(rootMnt, 'cmdline'), options.cmdline)

    // Create live directory structure for dracut dmsquash-live
    const liveDir = path.join(rootMnt, 'live')
    fs.mkdirSync(liveDir, { recursive: true })
    await exec(`cp ${options.squashfs} ${path.join(liveDir, 'filesystem.squashfs')}`, echo)

    // Create /boot symlinks for submarine compatibility
    const bootDir = path.join(rootMnt, 'boot')
    fs.mkdirSync(bootDir, { recursive: true })
    fs.symlinkSync('/vmlinuz', path.join(bootDir, 'vmlinuz'))
    fs.symlinkSync('/initramfs.img', path.join(bootDir, 'initramfs.img'))
  } finally {
    await exec(`umount ${rootMnt}`, echo)
    fs.rmdirSync(rootMnt)
  }

  // Write ROOT-A image into the disk image
  await exec(`dd if=${rootImg} of=${options.outputImage} bs=512 seek=${rootOffset} conv=notrunc`, echo)
  fs.unlinkSync(rootImg)

  Utils.warning(`Submarine boot image created: ${options.outputImage}`)
  Utils.warning(`Boot flow: depthcharge -> submarine -> kexec -> real kernel -> dracut -> live squashfs`)
}

/**
 * Check if submarine boot is available (tools + kpart).
 */
export function isSubmarineAvailable(arch: 'x86_64' | 'arm64'): boolean {
  if (!Utils.commandExists('cgpt')) return false

  const cacheFile = path.join(SUBMARINE_CACHE_DIR, `submarine-${arch}.kpart`)
  return fs.existsSync(cacheFile)
}

/**
 * Clear the submarine kpart cache.
 */
export function clearSubmarineCache(): void {
  if (fs.existsSync(SUBMARINE_CACHE_DIR)) {
    fs.rmSync(SUBMARINE_CACHE_DIR, { recursive: true })
  }
}
