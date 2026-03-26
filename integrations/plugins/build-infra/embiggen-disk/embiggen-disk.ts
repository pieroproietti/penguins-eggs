/**
 * plugins/build-infra/embiggen-disk/embiggen-disk.ts
 *
 * Live partition and filesystem resize via embiggen-disk.
 *
 * embiggen-disk (https://github.com/bradfitz/embiggen-disk) resizes a
 * filesystem live (no reboot) by first resizing any layers below it:
 *   GPT/MBR partition table → optional LVM PV/LV → ext4 or Btrfs filesystem
 *
 * All in one command. Requires Linux 3.6+ for BLKPG_RESIZE_PARTITION.
 *
 * Integration modes:
 *
 * 1. POST-INSTALL HOOK: After eggs installs a system to disk, expand the root
 *    partition to fill available space — like cloud-init does for cloud images.
 *
 * 2. RECOVERY SCRIPT: Expand a shrunken root partition after a failed resize
 *    operation or after cloning to a larger disk.
 */

import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

export interface EmbiggenOptions {
  /** Path to embiggen-disk binary. Auto-downloaded if not found. */
  binPath?: string
  /** Cache directory for downloaded binary. Default: /var/cache/eggs/embiggen-disk. */
  binCacheDir?: string
}

export interface ResizeResult {
  /** Device that was resized (e.g. /dev/sda1 or /). */
  device: string
  /** Whether the resize succeeded. */
  success: boolean
  /** Output from embiggen-disk. */
  output: string
}

const EMBIGGEN_VERSION = '0.1.0'
const EMBIGGEN_BASE_URL = 'https://github.com/bradfitz/embiggen-disk/releases/download'

const ARCH_MAP: Record<string, string> = {
  x64:    'linux-amd64',
  arm64:  'linux-arm64',
}

export class EmbiggenDisk {
  private exec: ExecFn
  private verbose: boolean
  private opts: Required<EmbiggenOptions>

  constructor(exec: ExecFn, verbose = false, opts: EmbiggenOptions = {}) {
    this.exec = exec
    this.verbose = verbose
    this.opts = {
      binPath: opts.binPath ?? 'embiggen-disk',
      binCacheDir: opts.binCacheDir ?? '/var/cache/eggs/embiggen-disk',
    }
  }

  /** Check if embiggen-disk is available on PATH or in cache. */
  async isAvailable(): Promise<boolean> {
    const r = await this.exec('command -v embiggen-disk', { capture: true })
    if (r.code === 0) return true
    return fs.existsSync(path.join(this.opts.binCacheDir, 'embiggen-disk'))
  }

  /** Resolve binary path, downloading if necessary. */
  async resolveBin(): Promise<string> {
    const pathCheck = await this.exec('command -v embiggen-disk', { capture: true })
    if (pathCheck.code === 0) return 'embiggen-disk'

    const cached = path.join(this.opts.binCacheDir, 'embiggen-disk')
    if (fs.existsSync(cached)) return cached

    return this.downloadBinary()
  }

  private async downloadBinary(): Promise<string> {
    const arch = ARCH_MAP[process.arch]
    if (!arch) throw new Error(`Unsupported arch for embiggen-disk download: ${process.arch}`)

    fs.mkdirSync(this.opts.binCacheDir, { recursive: true })
    const dest = path.join(this.opts.binCacheDir, 'embiggen-disk')
    const url = `${EMBIGGEN_BASE_URL}/v${EMBIGGEN_VERSION}/embiggen-disk_${arch}`

    if (this.verbose) console.log(`embiggen-disk: downloading from ${url}`)
    await this.downloadFile(url, dest)
    fs.chmodSync(dest, 0o755)
    return dest
  }

  private downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest)
      const request = (u: string) => {
        https.get(u, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            file.close(); request(res.headers.location!); return
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} downloading ${u}`)); return
          }
          res.pipe(file)
          file.on('finish', () => { file.close(); resolve() })
        }).on('error', reject)
      }
      request(url)
    })
  }

  /**
   * Resize a device/filesystem to fill available space.
   *
   * @param device  Device path (e.g. '/dev/sda1') or '/' for the root filesystem.
   *                embiggen-disk handles the full stack: partition → LVM → filesystem.
   */
  async resize(device: string): Promise<ResizeResult> {
    if (process.getuid?.() !== 0) {
      throw new Error('embiggen-disk requires root privileges')
    }

    const bin = await this.resolveBin()
    const result = await this.exec(`"${bin}" "${device}"`, {
      capture: true,
      echo: this.verbose,
    })

    return {
      device,
      success: result.code === 0,
      output: result.data + (result.error ?? ''),
    }
  }

  /**
   * Check available space on a device before resizing.
   * Returns { totalBytes, usedBytes, freeBytes }.
   */
  async checkSpace(device: string): Promise<{ totalBytes: number; usedBytes: number; freeBytes: number }> {
    const r = await this.exec(`lsblk -b -o SIZE,NAME "${device}" | head -2 | tail -1`, { capture: true })
    const totalBytes = parseInt(r.data.trim().split(/\s+/)[0], 10) || 0

    const df = await this.exec(`df -B1 "${device}" | tail -1`, { capture: true })
    const parts = df.data.trim().split(/\s+/)
    const usedBytes = parseInt(parts[2], 10) || 0
    const freeBytes = parseInt(parts[3], 10) || 0

    return { totalBytes, usedBytes, freeBytes }
  }

  /**
   * Detect if a disk has unallocated space after the last partition.
   * Returns the number of unallocated bytes, or 0 if the disk is fully allocated.
   */
  async unallocatedSpace(diskDevice: string): Promise<number> {
    const r = await this.exec(
      `parted -s "${diskDevice}" unit B print free 2>/dev/null | grep "Free Space" | tail -1`,
      { capture: true }
    )
    if (r.code !== 0 || !r.data.trim()) return 0

    // parted output: "  1234B  5678B  4444B  Free Space"
    const match = r.data.trim().match(/(\d+)B\s+Free Space/)
    return match ? parseInt(match[1], 10) : 0
  }
}
