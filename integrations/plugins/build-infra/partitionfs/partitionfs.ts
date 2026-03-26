/**
 * plugins/build-infra/partitionfs/partitionfs.ts
 *
 * Rootless partition access via partitionfs.
 *
 * partitionfs (https://github.com/madscientist42/partitionfs) is a FUSE
 * filesystem that mounts a disk image and exposes each partition as a
 * numbered file (partition1, partition2, ...) in the mountpoint. Supports
 * MSDOS and GPT partition tables via libparted.
 *
 * This enables rootless access to disk image partitions without losetup or
 * root — completing the rootless build pipeline alongside fuse-overlayfs
 * and squashfuse:
 *
 *   partitionfs (expose partitions) +
 *   squashfuse  (mount squashfs)    +
 *   fuse-overlayfs (overlay)        =
 *   fully rootless ISO build pipeline
 *
 * Also useful in penguins-recovery for rootless inspection of disk images
 * (e.g. examining a backup image without root).
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

export interface PartitionMount {
  /** Mountpoint directory containing partition files. */
  mountpoint: string
  /** Map of partition number → file path (e.g. { 1: '/mnt/pfs/partition1' }). */
  partitions: Record<number, string>
  /** Whether partitionfs was used (vs losetup). */
  usedFuse: boolean
}

export interface PartitionfsOptions {
  /** Allow other users to access the mount. Default: false. */
  allowOther?: boolean
  /** Read-only mount. Default: true. */
  readOnly?: boolean
}

export class Partitionfs {
  private exec: ExecFn
  private verbose: boolean
  private opts: PartitionfsOptions

  constructor(exec: ExecFn, verbose = false, opts: PartitionfsOptions = {}) {
    this.exec = exec
    this.verbose = verbose
    this.opts = { readOnly: true, allowOther: false, ...opts }
  }

  /** Check if partitionfs is available. */
  async isAvailable(): Promise<boolean> {
    const r = await this.exec('command -v partitionfs', { capture: true })
    return r.code === 0
  }

  /** Check if losetup is available (root fallback). */
  async isLosetupAvailable(): Promise<boolean> {
    const r = await this.exec('command -v losetup', { capture: true })
    return r.code === 0
  }

  /**
   * Mount a disk image, exposing each partition as a file.
   *
   * When running as root, uses losetup -P for maximum compatibility.
   * When rootless, uses partitionfs (FUSE).
   *
   * @param imagePath   Path to the disk image (.hdd, .img, .vhd, etc.)
   * @param mountpoint  Directory to mount into
   */
  async mount(imagePath: string, mountpoint: string): Promise<PartitionMount> {
    if (!fs.existsSync(imagePath)) throw new Error(`Image not found: ${imagePath}`)
    fs.mkdirSync(mountpoint, { recursive: true })

    // Prefer losetup when root (more compatible)
    if (process.getuid?.() === 0) {
      return this.mountLosetup(imagePath, mountpoint)
    }

    // Rootless: use partitionfs
    if (!(await this.isAvailable())) {
      throw new Error(
        'partitionfs not found and not running as root.\n' +
        'Install partitionfs: https://github.com/madscientist42/partitionfs\n' +
        'Or run as root to use losetup.'
      )
    }

    return this.mountFuse(imagePath, mountpoint)
  }

  private async mountFuse(imagePath: string, mountpoint: string): Promise<PartitionMount> {
    const fuseArgs: string[] = []
    if (this.opts.readOnly)   fuseArgs.push('-o', 'ro')
    if (this.opts.allowOther) fuseArgs.push('-o', 'allow_other')

    const cmd = `partitionfs ${fuseArgs.join(' ')} "${imagePath}" "${mountpoint}"`
    const result = await this.exec(cmd, { echo: this.verbose })
    if (result.code !== 0) {
      throw new Error(`partitionfs mount failed: ${result.error ?? result.data}`)
    }

    const partitions = this.discoverPartitions(mountpoint)
    if (this.verbose) {
      console.log(`partitionfs: mounted ${imagePath} → ${mountpoint}`)
      for (const [n, p] of Object.entries(partitions)) console.log(`  partition${n}: ${p}`)
    }

    return { mountpoint, partitions, usedFuse: true }
  }

  private async mountLosetup(imagePath: string, mountpoint: string): Promise<PartitionMount> {
    const r = await this.exec(`losetup -f --show -P "${imagePath}"`, { capture: true })
    if (r.code !== 0) throw new Error(`losetup failed: ${r.error ?? r.data}`)
    const loopDev = r.data.trim()

    // Create symlinks in mountpoint for consistency with partitionfs API
    const partitions: Record<number, string> = {}
    const entries = fs.readdirSync('/dev').filter(e => e.startsWith(path.basename(loopDev) + 'p'))
    for (const entry of entries) {
      const match = entry.match(/p(\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10)
        const devPath = `/dev/${entry}`
        const linkPath = path.join(mountpoint, `partition${num}`)
        try { fs.symlinkSync(devPath, linkPath) } catch { /* already exists */ }
        partitions[num] = devPath
      }
    }

    // Store loop device for cleanup
    fs.writeFileSync(path.join(mountpoint, '.loopdev'), loopDev)

    if (this.verbose) console.log(`partitionfs: mounted ${imagePath} via losetup ${loopDev}`)
    return { mountpoint, partitions, usedFuse: false }
  }

  /**
   * Unmount a partition mount.
   */
  async umount(mount: PartitionMount): Promise<void> {
    if (mount.usedFuse) {
      const fusermount = await this.exec('command -v fusermount3', { capture: true })
      const cmd = fusermount.code === 0 ? 'fusermount3' : 'fusermount'
      await this.exec(`${cmd} -u "${mount.mountpoint}"`, { echo: this.verbose })
    } else {
      // losetup cleanup
      const loopDevFile = path.join(mount.mountpoint, '.loopdev')
      if (fs.existsSync(loopDevFile)) {
        const loopDev = fs.readFileSync(loopDevFile, 'utf8').trim()
        await this.exec(`losetup -d "${loopDev}"`, { capture: true })
      }
    }
  }

  /**
   * Mount a specific partition from a disk image for filesystem access.
   * Returns the path to the partition file/device.
   *
   * @param imagePath    Disk image path
   * @param partNum      Partition number (1-based)
   * @param mountpoint   Base mountpoint for partitionfs
   * @param fsMountpoint Where to mount the filesystem
   * @param fsType       Filesystem type (vfat, ext4, squashfs, erofs, etc.)
   */
  async mountPartitionFs(
    imagePath: string,
    partNum: number,
    mountpoint: string,
    fsMountpoint: string,
    fsType: string
  ): Promise<{ partMount: PartitionMount; fsMountpoint: string }> {
    const partMount = await this.mount(imagePath, mountpoint)
    const partPath = partMount.partitions[partNum]
    if (!partPath) throw new Error(`Partition ${partNum} not found in ${imagePath}`)

    fs.mkdirSync(fsMountpoint, { recursive: true })
    const roFlag = this.opts.readOnly ? '-o ro' : ''
    await this.exec(`mount -t ${fsType} ${roFlag} "${partPath}" "${fsMountpoint}"`, { echo: this.verbose })

    return { partMount, fsMountpoint }
  }

  private discoverPartitions(mountpoint: string): Record<number, string> {
    const partitions: Record<number, string> = {}
    if (!fs.existsSync(mountpoint)) return partitions
    for (const entry of fs.readdirSync(mountpoint)) {
      const match = entry.match(/^partition(\d+)$/)
      if (match) {
        partitions[parseInt(match[1], 10)] = path.join(mountpoint, entry)
      }
    }
    return partitions
  }
}
