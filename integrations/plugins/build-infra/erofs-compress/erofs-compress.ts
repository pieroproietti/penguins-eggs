/**
 * plugins/build-infra/erofs-compress/erofs-compress.ts
 *
 * EROFS compression backend for eggs produce.
 *
 * EROFS (https://github.com/erofs/erofs-utils) is a read-only compressed
 * filesystem upstream in the Linux kernel since 5.4. It supports LZ4, LZMA,
 * and zstd compression, tail-packing (inlining small file tails with metadata),
 * and — unlike SquashFS — can be used as an overlayfs lower layer, enabling
 * writable live sessions without a separate tmpfs overlay.
 *
 * Used in Android system images, ChromeOS, and embedded Linux.
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

export type ErofsCompressor = 'lz4' | 'lz4hc' | 'lzma' | 'deflate' | 'zstd'

export interface ErofsOptions {
  /** Compression algorithm. Default: lz4hc (best compatibility). */
  compressor?: ErofsCompressor
  /** Compression level (algorithm-specific). */
  level?: number
  /** Enable tail-packing: inline small file tails with metadata. Default: true. */
  tailPacking?: boolean
  /** Enable extended attributes. Default: true. */
  xattr?: boolean
  /** UUID for the filesystem. Auto-generated if not set. */
  uuid?: string
  /** Volume label. */
  label?: string
}

export interface ErofsResult {
  outputPath: string
  inputSizeBytes: number
  outputSizeBytes: number
  compressionRatio: number
  durationMs: number
  checksumSha256: string
}

export class ErofsCompress {
  private exec: ExecFn
  private verbose: boolean
  private opts: Required<ErofsOptions>

  constructor(exec: ExecFn, verbose = false, opts: ErofsOptions = {}) {
    this.exec = exec
    this.verbose = verbose
    this.opts = {
      compressor: opts.compressor ?? 'lz4hc',
      level: opts.level ?? 9,
      tailPacking: opts.tailPacking ?? true,
      xattr: opts.xattr ?? true,
      uuid: opts.uuid ?? '',
      label: opts.label ?? 'eggs-rootfs',
    }
  }

  /**
   * Check if mkfs.erofs is available.
   */
  async isAvailable(): Promise<boolean> {
    const result = await this.exec('command -v mkfs.erofs', { capture: true })
    return result.code === 0
  }

  /**
   * Check if fsck.erofs is available (for verification).
   */
  async isFsckAvailable(): Promise<boolean> {
    const result = await this.exec('command -v fsck.erofs', { capture: true })
    return result.code === 0
  }

  /**
   * Compress a directory into an EROFS image.
   *
   * @param inputDir  Source directory (the live rootfs)
   * @param outputPath  Destination .erofs file
   */
  async compress(inputDir: string, outputPath: string): Promise<ErofsResult> {
    if (!(await this.isAvailable())) {
      throw new Error(
        'mkfs.erofs not found. Install erofs-utils:\n' +
        '  Debian/Ubuntu: apt install erofs-utils\n' +
        '  Arch: pacman -S erofs-utils\n' +
        '  Fedora: dnf install erofs-utils'
      )
    }

    const startMs = Date.now()
    const inputSizeBytes = await this.dirSize(inputDir)

    const args: string[] = []

    // Compression
    args.push(`-z${this.opts.compressor},${this.opts.level}`)

    // Tail-packing (inline small file tails with inode metadata)
    if (this.opts.tailPacking) {
      args.push('-E', 'tail-packing')
    }

    // Extended attributes
    if (!this.opts.xattr) {
      args.push('--no-xattr')
    }

    // UUID
    if (this.opts.uuid) {
      args.push('-U', this.opts.uuid)
    }

    // Label
    if (this.opts.label) {
      args.push('-L', this.opts.label)
    }

    args.push(outputPath, inputDir)

    const cmd = `mkfs.erofs ${args.join(' ')}`
    const result = await this.exec(cmd, { echo: this.verbose })

    if (result.code !== 0) {
      throw new Error(`mkfs.erofs failed (exit ${result.code}): ${result.error ?? result.data}`)
    }

    const outputSizeBytes = fs.statSync(outputPath).size
    const durationMs = Date.now() - startMs
    const checksumSha256 = await this.sha256(outputPath)

    return {
      outputPath,
      inputSizeBytes,
      outputSizeBytes,
      compressionRatio: inputSizeBytes / outputSizeBytes,
      durationMs,
      checksumSha256,
    }
  }

  /**
   * Verify an EROFS image using fsck.erofs.
   */
  async verify(imagePath: string): Promise<boolean> {
    if (!(await this.isFsckAvailable())) {
      console.warn('fsck.erofs not found, skipping verification')
      return true
    }
    const result = await this.exec(`fsck.erofs "${imagePath}"`, { capture: true })
    return result.code === 0
  }

  /**
   * Dump EROFS image metadata (superblock info).
   */
  async dump(imagePath: string): Promise<string> {
    const result = await this.exec(`dump.erofs "${imagePath}"`, { capture: true })
    if (result.code !== 0) {
      throw new Error(`dump.erofs failed: ${result.error ?? result.data}`)
    }
    return result.data
  }

  /**
   * Extract an EROFS image to a directory.
   */
  async extract(imagePath: string, outputDir: string): Promise<void> {
    if (!(await this.isFsckAvailable())) {
      throw new Error('fsck.erofs not found. Install erofs-utils.')
    }
    fs.mkdirSync(outputDir, { recursive: true })
    const result = await this.exec(
      `fsck.erofs --extract="${outputDir}" "${imagePath}"`,
      { echo: this.verbose }
    )
    if (result.code !== 0) {
      throw new Error(`fsck.erofs extract failed: ${result.error ?? result.data}`)
    }
  }

  /**
   * Check if the running kernel supports EROFS (kernel >= 5.4).
   */
  async isKernelSupported(): Promise<boolean> {
    // Check /proc/filesystems for erofs
    const result = await this.exec('grep -q erofs /proc/filesystems', { capture: true })
    if (result.code === 0) return true

    // Try modprobe
    const modprobe = await this.exec('modprobe erofs 2>/dev/null', { capture: true })
    if (modprobe.code === 0) return true

    // Check kernel version (>= 5.4)
    const uname = await this.exec('uname -r', { capture: true })
    const [major, minor] = uname.data.trim().split('.').map(Number)
    return major > 5 || (major === 5 && minor >= 4)
  }

  private async dirSize(dir: string): Promise<number> {
    const result = await this.exec(`du -sb "${dir}"`, { capture: true })
    return parseInt(result.data.split('\t')[0], 10) || 0
  }

  private sha256(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256')
      const stream = fs.createReadStream(filePath)
      stream.on('data', d => hash.update(d))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', reject)
    })
  }
}
