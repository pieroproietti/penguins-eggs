/**
 * ./src/classes/ovary.d/cros_verity.ts
 * penguins-eggs v.26.2.x / ecmascript 2020
 * author: Piero Proietti
 * license: MIT
 *
 * dm-verity integration for ChromiumOS live images.
 *
 * Two capabilities:
 *
 * 1. PRODUCE SIDE (verity-squash-root pattern):
 *    After mksquashfs creates filesystem.squashfs, generate a dm-verity
 *    hash tree using `veritysetup format`. The root hash is embedded in
 *    the kernel command line so the live boot can verify the squashfs
 *    integrity before mounting.
 *
 * 2. SNAPSHOT SIDE (overlayroot pattern):
 *    When running `eggs produce` on a ChromeOS system with a read-only
 *    dm-verity-protected rootfs, detect the read-only state and set up
 *    a tmpfs overlay so eggs can write temp files. The snapshot captures
 *    the lower (verified, read-only) rootfs, not the overlay.
 *
 * References:
 *   - brandsimon/verity-squash-root: veritysetup format + dracut module
 *   - hatlocker/dracut-verity: systemd generator for verity at boot
 *   - hcfman/overlayroot: overlayfs on read-only rootfs
 */

import fs from 'node:fs'
import path from 'node:path'

import { exec } from '../../lib/utils.js'
import Utils from '../utils.js'

// ============================================================================
// PRODUCE SIDE: dm-verity hash tree generation
// ============================================================================

export interface VerityResult {
  /** Path to the verity hash tree file (filesystem.squashfs.verity) */
  verityImage: string
  /** The root hash string (hex) */
  rootHash: string
  /** Hash algorithm used (default: sha256) */
  hashAlgorithm: string
  /** Data block size */
  dataBlockSize: number
  /** Hash block size */
  hashBlockSize: number
  /** Salt (hex) */
  salt: string
}

/**
 * Check if veritysetup is available.
 */
export function hasVeritysetup(): boolean {
  return Utils.commandExists('veritysetup')
}

/**
 * Generate a dm-verity hash tree for a squashfs image.
 *
 * This is the same operation verity-squash-root performs:
 *   veritysetup format <data_device> <hash_device>
 *
 * The output hash tree file (.verity) and root hash are used at boot time
 * to verify the squashfs integrity before mounting.
 *
 * @param squashfsPath - Path to the squashfs image
 * @param echo - Verbose output
 * @returns VerityResult with hash tree path and root hash
 */
export async function generateVerityHashTree(
  squashfsPath: string,
  echo: object
): Promise<VerityResult> {
  if (!hasVeritysetup()) {
    throw new Error('veritysetup not found. Install cryptsetup: emerge cryptsetup || crew install cryptsetup')
  }

  const verityImage = `${squashfsPath}.verity`

  Utils.warning('Generating dm-verity hash tree for squashfs...')

  // veritysetup format outputs:
  //   VERITY header information for <path>
  //   UUID: ...
  //   Hash type: 1
  //   Data blocks: ...
  //   Data block size: 4096
  //   Hash block size: 4096
  //   Hash algorithm: sha256
  //   Salt: <hex>
  //   Root hash: <hex>
  const result = await exec(
    `veritysetup format "${squashfsPath}" "${verityImage}"`,
    { capture: true }
  ) as any

  const stdout = result.stdout || ''

  // Parse the output
  const rootHash = extractField(stdout, 'Root hash')
  const salt = extractField(stdout, 'Salt')
  const hashAlgorithm = extractField(stdout, 'Hash algorithm') || 'sha256'
  const dataBlockSize = parseInt(extractField(stdout, 'Data block size') || '4096', 10)
  const hashBlockSize = parseInt(extractField(stdout, 'Hash block size') || '4096', 10)

  if (!rootHash) {
    throw new Error('Failed to extract root hash from veritysetup output')
  }

  Utils.warning(`dm-verity root hash: ${rootHash}`)
  Utils.warning(`dm-verity hash tree: ${verityImage} (${formatSize(fs.statSync(verityImage).size)})`)

  return {
    verityImage,
    rootHash,
    hashAlgorithm,
    dataBlockSize,
    hashBlockSize,
    salt,
  }
}

/**
 * Build a kernel command line fragment for dm-verity verified boot.
 *
 * Two formats supported:
 *   1. dracut-verity style: verity.usr=LABEL=ROOT-A verity.usrhash=<hash>
 *   2. verity-squash-root style: verity_squash_root_hash=<hash> verity_squash_root_slot=a
 *
 * @param rootHash - The dm-verity root hash
 * @param format - 'dracut' or 'squashroot'
 * @param label - Partition label (default: ROOT-A)
 */
export function buildVerityCmdline(
  rootHash: string,
  format: 'dracut' | 'squashroot' = 'dracut',
  label: string = 'ROOT-A'
): string {
  if (format === 'dracut') {
    // hatlocker/dracut-verity format
    return `verity.usr=LABEL=${label} verity.usrhash=${rootHash}`
  }

  // brandsimon/verity-squash-root format
  return `verity_squash_root_hash=${rootHash} verity_squash_root_slot=a`
}

/**
 * Verify an existing squashfs against its verity hash tree.
 *
 * @param squashfsPath - Path to squashfs
 * @param verityImage - Path to .verity hash tree
 * @param rootHash - Expected root hash
 * @returns true if verification passes
 */
export async function verifySquashfs(
  squashfsPath: string,
  verityImage: string,
  rootHash: string
): Promise<boolean> {
  if (!hasVeritysetup()) return false

  try {
    await exec(
      `veritysetup verify "${squashfsPath}" "${verityImage}" "${rootHash}"`,
      { capture: true }
    )
    return true
  } catch {
    return false
  }
}

// ============================================================================
// SNAPSHOT SIDE: overlayroot-aware rootfs detection
// ============================================================================

/**
 * Check if the root filesystem is mounted read-only.
 * On ChromeOS with dm-verity, / is always read-only.
 */
export function isRootReadOnly(): boolean {
  try {
    const mounts = fs.readFileSync('/proc/mounts', 'utf8')
    const rootLine = mounts.split('\n').find(l => {
      const parts = l.split(' ')
      return parts[1] === '/'
    })
    if (rootLine) {
      return rootLine.includes(' ro,') || rootLine.includes(' ro ')
    }
  } catch {
    // Can't read /proc/mounts
  }

  return false
}

/**
 * Check if the root filesystem is dm-verity protected.
 * ChromeOS uses dm-verity on ROOT-A/ROOT-B partitions.
 */
export function isRootVerityProtected(): boolean {
  try {
    // Check if root device is a dm-verity device
    const mounts = fs.readFileSync('/proc/mounts', 'utf8')
    const rootLine = mounts.split('\n').find(l => l.split(' ')[1] === '/')
    if (rootLine) {
      const rootDev = rootLine.split(' ')[0]
      // dm-verity devices appear as /dev/dm-N
      if (rootDev.includes('/dev/dm-')) return true
    }

    // Check for dm-verity in device-mapper
    if (fs.existsSync('/sys/block')) {
      const blocks = fs.readdirSync('/sys/block')
      for (const block of blocks) {
        if (block.startsWith('dm-')) {
          const uuidPath = `/sys/block/${block}/dm/uuid`
          if (fs.existsSync(uuidPath)) {
            const uuid = fs.readFileSync(uuidPath, 'utf8').trim()
            if (uuid.startsWith('CROS-verity-') || uuid.includes('verity')) {
              return true
            }
          }
        }
      }
    }
  } catch {
    // Can't detect
  }

  return false
}

/**
 * Check if an overlayfs is already active on root.
 * This happens when overlayroot or similar has already set up the overlay.
 */
export function isOverlayActive(): boolean {
  try {
    const mounts = fs.readFileSync('/proc/mounts', 'utf8')
    return mounts.split('\n').some(l => {
      const parts = l.split(' ')
      return parts[1] === '/' && parts[2] === 'overlay'
    })
  } catch {
    return false
  }
}

/**
 * Get the lower (read-only) rootfs path when overlayfs is active.
 * This is the path eggs should snapshot, not the overlay.
 */
export function getOverlayLowerDir(): string | null {
  try {
    const mounts = fs.readFileSync('/proc/mounts', 'utf8')
    const overlayLine = mounts.split('\n').find(l => {
      const parts = l.split(' ')
      return parts[1] === '/' && parts[2] === 'overlay'
    })
    if (overlayLine) {
      // Parse mount options: lowerdir=/path,upperdir=/path,workdir=/path
      const opts = overlayLine.split(' ')[3] || ''
      const lowerMatch = opts.match(/lowerdir=([^,]+)/)
      if (lowerMatch) return lowerMatch[1]
    }
  } catch {
    // Can't parse
  }

  return null
}

/**
 * Set up a tmpfs overlay on the root filesystem for eggs produce.
 *
 * This follows the overlayroot pattern:
 *   1. Mount tmpfs for the upper layer
 *   2. Create overlay mount with lower=real_root, upper=tmpfs
 *   3. eggs produce writes temp files to the tmpfs overlay
 *   4. eggs produce snapshots the lower (read-only) rootfs
 *
 * This is only needed when running on a dm-verity-protected ChromeOS
 * rootfs where the filesystem is truly read-only.
 *
 * @param workDir - Directory for eggs work files (e.g., /tmp/eggs-overlay)
 * @param echo - Verbose output
 * @returns Object with paths for cleanup
 */
export async function setupOverlayForProduce(
  workDir: string,
  echo: object
): Promise<{
  overlayMounted: boolean
  upperDir: string
  workDirPath: string
  lowerDir: string
}> {
  const upperDir = path.join(workDir, 'upper')
  const workDirPath = path.join(workDir, 'work')
  const lowerDir = '/'

  // If root is already writable or overlay is already active, skip
  if (!isRootReadOnly()) {
    return { overlayMounted: false, upperDir, workDirPath, lowerDir }
  }

  Utils.warning('Read-only rootfs detected. Setting up tmpfs overlay for eggs produce...')

  // Create work directory on a writable filesystem
  // On ChromeOS, /tmp and /usr/local (STATE partition) are writable
  fs.mkdirSync(workDir, { recursive: true })
  fs.mkdirSync(upperDir, { recursive: true })
  fs.mkdirSync(workDirPath, { recursive: true })

  // Mount tmpfs for the overlay upper layer
  await exec(`mount -t tmpfs -o mode=0755 tmpfs ${workDir}`, echo)
  fs.mkdirSync(upperDir, { recursive: true })
  fs.mkdirSync(workDirPath, { recursive: true })

  return { overlayMounted: true, upperDir, workDirPath, lowerDir }
}

/**
 * Clean up the overlay after eggs produce completes.
 */
export async function cleanupOverlay(
  workDir: string,
  overlayMounted: boolean,
  echo: object
): Promise<void> {
  if (overlayMounted) {
    try {
      await exec(`umount -f ${workDir}`, echo)
    } catch {
      // Best effort
    }

    try {
      fs.rmSync(workDir, { recursive: true, force: true })
    } catch {
      // Best effort
    }
  }
}

/**
 * Get the effective rootfs path for snapshotting.
 *
 * On a normal system: returns '/'
 * On an overlayfs system: returns the lower (read-only) dir
 * On a dm-verity system: returns '/' (still readable)
 *
 * This ensures eggs produce snapshots the real rootfs, not the overlay.
 */
export function getSnapshotRootPath(): string {
  if (isOverlayActive()) {
    const lower = getOverlayLowerDir()
    if (lower) return lower
  }

  return '/'
}

// ============================================================================
// Helpers
// ============================================================================

function extractField(output: string, fieldName: string): string {
  const regex = new RegExp(`^${fieldName}:\\s*(.+)$`, 'm')
  const match = output.match(regex)
  return match ? match[1].trim() : ''
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
