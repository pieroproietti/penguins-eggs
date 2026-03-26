/**
 * plugins/build-infra/dwarfs-compress/dwarfs-compress.ts
 *
 * DwarFS compression backend for eggs produce.
 *
 * DwarFS (https://github.com/mhx/dwarfs) is a read-only FUSE filesystem with
 * compression ratios up to 16x better than SquashFS and near-instant mount
 * times (~24ms). This plugin replaces mksquashfs with mkdwarfs during ISO
 * production and embeds the dwarfs FUSE driver in the initramfs so the live
 * system can mount the compressed rootfs.
 *
 * Static binaries are downloaded from GitHub releases — no host dependency.
 */

import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import crypto from 'node:crypto'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

export type DwarfsCompressor = 'zstd' | 'lzma' | 'brotli' | 'none'

export interface DwarfsOptions {
  /** Compression algorithm. Default: zstd (best speed/ratio balance). */
  compressor?: DwarfsCompressor
  /** Compression level 1-9. Default: 7. */
  level?: number
  /** Number of worker threads. Default: number of CPUs. */
  workers?: number
  /** Enable file categorization (PCM audio → FLAC, incompressible → none). */
  categorize?: boolean
  /** Block size in MiB. Default: 16. */
  blockSizeMib?: number
  /** Path to mkdwarfs binary. Auto-downloaded if not found. */
  mkdwarfsBin?: string
  /** Path to dwarfs FUSE binary. Auto-downloaded if not found. */
  dwarfsBin?: string
  /** Directory to cache downloaded binaries. Default: /var/cache/eggs/dwarfs. */
  binCacheDir?: string
}

export interface DwarfsResult {
  outputPath: string
  inputSizeBytes: number
  outputSizeBytes: number
  compressionRatio: number
  durationMs: number
  checksumSha512: string
}

const DWARFS_VERSION = '0.10.2'
const DWARFS_BASE_URL = `https://github.com/mhx/dwarfs/releases/download/v${DWARFS_VERSION}`

/** Architecture map from Node's process.arch to DwarFS release naming. */
const ARCH_MAP: Record<string, string> = {
  x64: 'Linux-x86_64',
  arm64: 'Linux-aarch64',
  riscv64: 'Linux-riscv64',
}

export class DwarfsCompress {
  private exec: ExecFn
  private verbose: boolean
  private opts: Required<DwarfsOptions>

  constructor(exec: ExecFn, verbose = false, opts: DwarfsOptions = {}) {
    this.exec = exec
    this.verbose = verbose
    this.opts = {
      compressor: opts.compressor ?? 'zstd',
      level: opts.level ?? 7,
      workers: opts.workers ?? 0, // 0 = auto (all CPUs)
      categorize: opts.categorize ?? true,
      blockSizeMib: opts.blockSizeMib ?? 16,
      mkdwarfsBin: opts.mkdwarfsBin ?? 'mkdwarfs',
      dwarfsBin: opts.dwarfsBin ?? 'dwarfs',
      binCacheDir: opts.binCacheDir ?? '/var/cache/eggs/dwarfs',
    }
  }

  /**
   * Check if mkdwarfs is available on PATH or in the cache directory.
   */
  async isMkdwarfsAvailable(): Promise<boolean> {
    // Check PATH first
    const pathCheck = await this.exec('command -v mkdwarfs', { capture: true })
    if (pathCheck.code === 0) return true

    // Check cache
    const cached = path.join(this.opts.binCacheDir, 'mkdwarfs')
    return fs.existsSync(cached)
  }

  /**
   * Resolve the mkdwarfs binary path, downloading if necessary.
   */
  async resolveMkdwarfs(): Promise<string> {
    const pathCheck = await this.exec('command -v mkdwarfs', { capture: true })
    if (pathCheck.code === 0) return 'mkdwarfs'

    const cached = path.join(this.opts.binCacheDir, 'mkdwarfs')
    if (fs.existsSync(cached)) return cached

    return this.downloadBinary('mkdwarfs')
  }

  /**
   * Resolve the dwarfs FUSE binary path, downloading if necessary.
   */
  async resolveDwarfs(): Promise<string> {
    const pathCheck = await this.exec('command -v dwarfs', { capture: true })
    if (pathCheck.code === 0) return 'dwarfs'

    const cached = path.join(this.opts.binCacheDir, 'dwarfs')
    if (fs.existsSync(cached)) return cached

    return this.downloadBinary('dwarfs')
  }

  /**
   * Download a DwarFS static binary from GitHub releases.
   * Uses the universal binary which contains all tools.
   */
  private async downloadBinary(tool: 'mkdwarfs' | 'dwarfs' | 'dwarfsck' | 'dwarfsextract'): Promise<string> {
    const arch = ARCH_MAP[process.arch]
    if (!arch) throw new Error(`Unsupported architecture for DwarFS download: ${process.arch}`)

    fs.mkdirSync(this.opts.binCacheDir, { recursive: true })

    // The universal binary contains all tools
    const universalName = `dwarfs-universal-${DWARFS_VERSION}-${arch}`
    const universalUrl = `${DWARFS_BASE_URL}/${universalName}`
    const universalPath = path.join(this.opts.binCacheDir, universalName)

    if (!fs.existsSync(universalPath)) {
      if (this.verbose) console.log(`Downloading DwarFS universal binary from ${universalUrl}`)
      await this.downloadFile(universalUrl, universalPath)
      fs.chmodSync(universalPath, 0o755)
    }

    // The universal binary is invoked as: dwarfs-universal <tool> [args]
    // Create a wrapper script for each tool
    const wrapperPath = path.join(this.opts.binCacheDir, tool)
    const wrapperContent = `#!/bin/sh\nexec "${universalPath}" ${tool} "$@"\n`
    fs.writeFileSync(wrapperPath, wrapperContent)
    fs.chmodSync(wrapperPath, 0o755)

    if (this.verbose) console.log(`DwarFS ${tool} available at: ${wrapperPath}`)
    return wrapperPath
  }

  private downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest)
      const request = (u: string) => {
        https.get(u, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            file.close()
            request(res.headers.location!)
            return
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} downloading ${u}`))
            return
          }
          res.pipe(file)
          file.on('finish', () => { file.close(); resolve() })
        }).on('error', reject)
      }
      request(url)
    })
  }

  /**
   * Compress a directory into a DwarFS image.
   *
   * @param inputDir  Source directory (the live rootfs)
   * @param outputPath  Destination .dwarfs file
   */
  async compress(inputDir: string, outputPath: string): Promise<DwarfsResult> {
    const mkdwarfs = await this.resolveMkdwarfs()

    const startMs = Date.now()
    const inputSizeBytes = await this.dirSize(inputDir)

    const args: string[] = [
      '-i', inputDir,
      '-o', outputPath,
      '--compress-algo', this.opts.compressor,
      '--compress-level', String(this.opts.level),
      '--block-size-bits', String(Math.log2(this.opts.blockSizeMib * 1024 * 1024)),
    ]

    if (this.opts.workers > 0) {
      args.push('--num-workers', String(this.opts.workers))
    }

    if (this.opts.categorize) {
      args.push('--categorize')
    }

    if (this.verbose) {
      args.push('--progress', 'simple')
    }

    const cmd = `${mkdwarfs} ${args.map(a => `"${a}"`).join(' ')}`
    const result = await this.exec(cmd, { echo: this.verbose })

    if (result.code !== 0) {
      throw new Error(`mkdwarfs failed (exit ${result.code}): ${result.error ?? result.data}`)
    }

    const outputSizeBytes = fs.statSync(outputPath).size
    const durationMs = Date.now() - startMs
    const checksumSha512 = await this.sha512(outputPath)

    return {
      outputPath,
      inputSizeBytes,
      outputSizeBytes,
      compressionRatio: inputSizeBytes / outputSizeBytes,
      durationMs,
      checksumSha512,
    }
  }

  /**
   * Verify a DwarFS image using dwarfsck.
   * Returns true if the image passes integrity checks.
   */
  async verify(imagePath: string): Promise<boolean> {
    const dwarfsck = await this.downloadBinary('dwarfsck')
    const result = await this.exec(`"${dwarfsck}" "${imagePath}" --check-integrity`, { capture: true })
    return result.code === 0
  }

  /**
   * Generate SHA-512 checksums for all files in the image (veritysetup-compatible format).
   * Output can be piped to sha512sum --check.
   */
  async generateChecksums(imagePath: string, outputFile: string): Promise<void> {
    const dwarfsck = await this.downloadBinary('dwarfsck')
    const result = await this.exec(
      `"${dwarfsck}" "${imagePath}" --checksum=sha512`,
      { capture: true }
    )
    if (result.code !== 0) {
      throw new Error(`dwarfsck checksum failed: ${result.error ?? result.data}`)
    }
    fs.writeFileSync(outputFile, result.data)
  }

  /**
   * Inject the dwarfs FUSE driver into an initramfs so the live system
   * can mount a DwarFS-compressed rootfs on boot.
   *
   * This copies the dwarfs binary into the initramfs tree and adds a
   * hook script that mounts the rootfs before pivot_root.
   */
  async injectInitramfsHook(initramfsDir: string): Promise<void> {
    const dwarfsBin = await this.resolveDwarfs()

    // Copy dwarfs binary into initramfs
    const binDest = path.join(initramfsDir, 'usr', 'bin', 'dwarfs')
    fs.mkdirSync(path.dirname(binDest), { recursive: true })
    fs.copyFileSync(dwarfsBin, binDest)
    fs.chmodSync(binDest, 0o755)

    // Write initramfs hook script
    const hookDir = path.join(initramfsDir, 'usr', 'share', 'initramfs-tools', 'hooks')
    fs.mkdirSync(hookDir, { recursive: true })
    const hookPath = path.join(hookDir, 'dwarfs')
    fs.writeFileSync(hookPath, INITRAMFS_HOOK)
    fs.chmodSync(hookPath, 0o755)

    // Write initramfs init-bottom script (mounts the DwarFS rootfs)
    const initBottomDir = path.join(initramfsDir, 'usr', 'share', 'initramfs-tools', 'scripts', 'init-bottom')
    fs.mkdirSync(initBottomDir, { recursive: true })
    const initBottomPath = path.join(initBottomDir, 'dwarfs-mount')
    fs.writeFileSync(initBottomPath, INITRAMFS_INIT_BOTTOM)
    fs.chmodSync(initBottomPath, 0o755)

    if (this.verbose) {
      console.log(`DwarFS initramfs hook injected into ${initramfsDir}`)
    }
  }

  private async dirSize(dir: string): Promise<number> {
    const result = await this.exec(`du -sb "${dir}"`, { capture: true })
    return parseInt(result.data.split('\t')[0], 10) || 0
  }

  private sha512(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha512')
      const stream = fs.createReadStream(filePath)
      stream.on('data', d => hash.update(d))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', reject)
    })
  }
}

// ---------------------------------------------------------------------------
// Initramfs hook templates
// ---------------------------------------------------------------------------

const INITRAMFS_HOOK = `#!/bin/sh
# initramfs hook: copy dwarfs FUSE driver into the initramfs image
PREREQ=""
prereqs() { echo "$PREREQ"; }
case "$1" in prereqs) prereqs; exit 0 ;; esac

. /usr/share/initramfs-tools/hook-functions

copy_exec /usr/bin/dwarfs /usr/bin/dwarfs
copy_exec /usr/bin/fusermount3 /usr/bin/fusermount3 2>/dev/null || true
manual_add_modules fuse
`

const INITRAMFS_INIT_BOTTOM = `#!/bin/sh
# init-bottom: mount DwarFS rootfs before pivot_root
# Only active when the rootfs image is a .dwarfs file.
PREREQ=""
prereqs() { echo "$PREREQ"; }
case "$1" in prereqs) prereqs; exit 0 ;; esac

ROOTFS_IMG="${rootmnt}/live/filesystem.dwarfs"
if [ ! -f "$ROOTFS_IMG" ]; then
  exit 0
fi

MOUNT_POINT="${rootmnt}/live/rootfs"
mkdir -p "$MOUNT_POINT"

dwarfs "$ROOTFS_IMG" "$MOUNT_POINT" -o ro,allow_other
mount --bind "$MOUNT_POINT" "${rootmnt}"
`
