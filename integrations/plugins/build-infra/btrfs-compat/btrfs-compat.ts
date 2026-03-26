/**
 * plugins/build-infra/btrfs-compat/btrfs-compat.ts
 *
 * Btrfs kernel feature compatibility checker for eggs produce.
 *
 * Tracks features from the btrfs-devel kernel tree
 * (https://github.com/kdave/btrfs-devel) to ensure the snapshot plugin,
 * compression backends, and send/receive operations work correctly against
 * the running kernel's Btrfs implementation.
 *
 * Key feature gates:
 *   - Zstd compression (kernel >= 4.14)
 *   - send/receive v2 (kernel >= 6.3) — needed for snapshot diff
 *   - Free space tree (kernel >= 4.9)
 *   - Block group tree (kernel >= 6.1)
 *   - RAID stripe tree (kernel >= 6.7)
 *   - Subvolume quota v2 (kernel >= 6.7)
 *
 * This is an informational/guard plugin — it does not modify kernel source.
 * It reads /proc/version and btrfs feature flags to gate snapshot operations.
 */

import fs from 'node:fs'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

export interface KernelVersion {
  major: number
  minor: number
  patch: number
  raw: string
}

export interface BtrfsFeatureSet {
  /** Zstd compression support (>= 4.14). */
  zstdCompression: boolean
  /** send/receive protocol v2 (>= 6.3). Needed for efficient snapshot diff. */
  sendReceiveV2: boolean
  /** Free space tree (>= 4.9). Faster mount after unclean shutdown. */
  freeSpaceTree: boolean
  /** Block group tree (>= 6.1). Faster mount for large filesystems. */
  blockGroupTree: boolean
  /** RAID stripe tree (>= 6.7). Required for RAID56 with send/receive. */
  raidStripeTree: boolean
  /** Subvolume quota v2 (>= 6.7). More accurate quota accounting. */
  quotaV2: boolean
  /** Verity (fsverity) per-file integrity (>= 5.15). */
  fsverity: boolean
}

export interface BtrfsMountOptions {
  /** Compression algorithm to use. */
  compress?: 'zstd' | 'lzo' | 'zlib' | 'none'
  /** Compression level (zstd: 1-15, zlib: 1-9). */
  compressLevel?: number
  /** Enable free space tree (recommended for kernels >= 4.9). */
  freeSpaceTree?: boolean
  /** Space cache version (v1 or v2). */
  spaceCacheV2?: boolean
  /** Disable CoW for specific directories (e.g. VM images). */
  nodatacow?: boolean
}

export class BtrfsCompat {
  private exec: ExecFn
  private verbose: boolean

  constructor(exec: ExecFn, verbose = false) {
    this.exec = exec
    this.verbose = verbose
  }

  /**
   * Parse the running kernel version from /proc/version.
   */
  async getKernelVersion(): Promise<KernelVersion> {
    const result = await this.exec('uname -r', { capture: true })
    const raw = result.data.trim()
    const match = raw.match(/^(\d+)\.(\d+)\.?(\d*)/)
    if (!match) throw new Error(`Cannot parse kernel version: ${raw}`)
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3] || '0', 10),
      raw,
    }
  }

  /**
   * Check if the running kernel version meets a minimum requirement.
   */
  meetsMinimum(kv: KernelVersion, major: number, minor: number): boolean {
    if (kv.major > major) return true
    if (kv.major === major && kv.minor >= minor) return true
    return false
  }

  /**
   * Detect which Btrfs features are available in the running kernel.
   */
  async detectFeatures(): Promise<BtrfsFeatureSet> {
    const kv = await this.getKernelVersion()

    return {
      zstdCompression: this.meetsMinimum(kv, 4, 14),
      sendReceiveV2: this.meetsMinimum(kv, 6, 3),
      freeSpaceTree: this.meetsMinimum(kv, 4, 9),
      blockGroupTree: this.meetsMinimum(kv, 6, 1),
      raidStripeTree: this.meetsMinimum(kv, 6, 7),
      quotaV2: this.meetsMinimum(kv, 6, 7),
      fsverity: this.meetsMinimum(kv, 5, 15),
    }
  }

  /**
   * Check if a mounted Btrfs filesystem has a specific feature enabled.
   * Reads from /sys/fs/btrfs/<uuid>/features/.
   */
  async isMountedFeatureEnabled(mountpoint: string, feature: string): Promise<boolean> {
    // Get the filesystem UUID
    const uuidResult = await this.exec(
      `btrfs filesystem show "${mountpoint}" 2>/dev/null | grep uuid | awk '{print $NF}'`,
      { capture: true }
    )
    const uuid = uuidResult.data.trim()
    if (!uuid) return false

    const featurePath = `/sys/fs/btrfs/${uuid}/features/${feature}`
    return fs.existsSync(featurePath)
  }

  /**
   * Get the optimal mount options for the running kernel.
   * Returns options that use the best available features.
   */
  async getOptimalMountOptions(): Promise<BtrfsMountOptions> {
    const features = await this.detectFeatures()

    return {
      compress: features.zstdCompression ? 'zstd' : 'lzo',
      compressLevel: features.zstdCompression ? 3 : undefined,
      freeSpaceTree: features.freeSpaceTree,
      spaceCacheV2: features.freeSpaceTree,
    }
  }

  /**
   * Validate that the snapshot plugin can operate correctly on this kernel.
   * Returns a list of warnings (empty = all good).
   */
  async validateSnapshotSupport(): Promise<string[]> {
    const warnings: string[] = []
    const features = await this.detectFeatures()
    const kv = await this.getKernelVersion()

    if (!this.meetsMinimum(kv, 4, 0)) {
      warnings.push(`Kernel ${kv.raw} is very old. Btrfs snapshots require >= 3.6, but many features need >= 4.x.`)
    }

    if (!features.sendReceiveV2) {
      warnings.push(
        `Kernel ${kv.raw}: send/receive v2 not available (requires >= 6.3). ` +
        'Snapshot diff (btrfs-snapshot diff) will use slower v1 protocol.'
      )
    }

    if (!features.freeSpaceTree) {
      warnings.push(
        `Kernel ${kv.raw}: free space tree not available (requires >= 4.9). ` +
        'Mount after unclean shutdown may be slow.'
      )
    }

    // Check btrfs-progs version
    const progs = await this.exec('btrfs --version 2>/dev/null', { capture: true })
    if (progs.code !== 0) {
      warnings.push('btrfs-progs not installed. Install: apt install btrfs-progs')
    } else {
      const progsMatch = progs.data.match(/v(\d+)\.(\d+)/)
      if (progsMatch) {
        const progsMajor = parseInt(progsMatch[1], 10)
        const progsMinor = parseInt(progsMatch[2], 10)
        if (progsMajor < 5 || (progsMajor === 5 && progsMinor < 14)) {
          warnings.push(
            `btrfs-progs ${progs.data.trim()} is old. Upgrade to >= 5.14 for best compatibility.`
          )
        }
      }
    }

    return warnings
  }

  /**
   * Print a human-readable feature compatibility report.
   */
  async report(): Promise<string> {
    const kv = await this.getKernelVersion()
    const features = await this.detectFeatures()
    const warnings = await this.validateSnapshotSupport()

    const tick = (v: boolean) => v ? '✓' : '✗'
    const lines = [
      `Btrfs kernel compatibility report`,
      `  Kernel: ${kv.raw}`,
      ``,
      `  Features:`,
      `    ${tick(features.zstdCompression)}  zstd compression    (>= 4.14)`,
      `    ${tick(features.freeSpaceTree)}  free space tree     (>= 4.9)`,
      `    ${tick(features.blockGroupTree)}  block group tree    (>= 6.1)`,
      `    ${tick(features.sendReceiveV2)}  send/receive v2     (>= 6.3)`,
      `    ${tick(features.raidStripeTree)}  RAID stripe tree    (>= 6.7)`,
      `    ${tick(features.quotaV2)}  quota v2            (>= 6.7)`,
      `    ${tick(features.fsverity)}  fsverity            (>= 5.15)`,
    ]

    if (warnings.length > 0) {
      lines.push(``, `  Warnings:`)
      for (const w of warnings) lines.push(`    ⚠ ${w}`)
    } else {
      lines.push(``, `  No warnings.`)
    }

    return lines.join('\n')
  }
}
