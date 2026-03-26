/**
 * plugins/build-infra/buildroot/buildroot.ts
 *
 * Buildroot integration for eggs produce.
 *
 * Buildroot (https://github.com/buildroot/buildroot) cross-compiles a complete
 * Linux system (toolchain, kernel, bootloader, rootfs) from source for any
 * target architecture. It produces rootfs images in multiple formats including
 * SquashFS, EROFS, tar, and cpio.
 *
 * Two integration modes:
 *
 * 1. CONSUME MODE: Consume a Buildroot output directory (output/images/) as
 *    the source rootfs for eggs produce. Enables eggs to remaster embedded
 *    Linux images built by Buildroot.
 *
 * 2. BUILD MODE: Invoke Buildroot's make system to produce a rootfs image,
 *    then hand it to eggs for ISO production. Enables fully reproducible,
 *    cross-compiled ISO builds from a Buildroot defconfig.
 *
 * Supported Buildroot output formats:
 *   BR2_TARGET_ROOTFS_SQUASHFS  → squashfs (default eggs backend)
 *   BR2_TARGET_ROOTFS_EROFS     → erofs (eggs erofs-compress backend)
 *   BR2_TARGET_ROOTFS_TAR       → tar (extracted to directory)
 *   BR2_TARGET_ROOTFS_CPIO      → cpio (for initrd)
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

export type BuildrootOutputFormat = 'squashfs' | 'erofs' | 'tar' | 'cpio' | 'ext2' | 'ext4'

export interface BuildrootConfig {
  /** Path to the Buildroot source tree. */
  buildrootDir: string
  /** Defconfig name (e.g. 'raspberrypi4_64_defconfig') or path to .config. */
  defconfig?: string
  /** Output directory. Default: <buildrootDir>/output. */
  outputDir?: string
  /** Target architecture (for cross-compilation). */
  arch?: string
  /** Rootfs output format. Default: squashfs. */
  rootfsFormat?: BuildrootOutputFormat
  /** Extra make variables (e.g. { BR2_CCACHE: 'y' }). */
  makeVars?: Record<string, string>
  /** Number of parallel jobs. Default: nproc. */
  jobs?: number
}

export interface BuildrootResult {
  /** Path to the produced rootfs image. */
  rootfsPath: string
  /** Format of the rootfs image. */
  format: BuildrootOutputFormat
  /** Path to the kernel image (if produced). */
  kernelPath?: string
  /** Path to the device tree blob (if produced). */
  dtbPath?: string
  /** Size of the rootfs in bytes. */
  sizeBytes: number
}

/** Map from BuildrootOutputFormat to the filename Buildroot produces. */
const ROOTFS_FILENAMES: Record<BuildrootOutputFormat, string> = {
  squashfs: 'rootfs.squashfs',
  erofs:    'rootfs.erofs',
  tar:      'rootfs.tar',
  cpio:     'rootfs.cpio',
  ext2:     'rootfs.ext2',
  ext4:     'rootfs.ext4',
}

/** Map from BuildrootOutputFormat to the BR2 config variable. */
const ROOTFS_BR2_VARS: Record<BuildrootOutputFormat, string> = {
  squashfs: 'BR2_TARGET_ROOTFS_SQUASHFS=y',
  erofs:    'BR2_TARGET_ROOTFS_EROFS=y',
  tar:      'BR2_TARGET_ROOTFS_TAR=y',
  cpio:     'BR2_TARGET_ROOTFS_CPIO=y',
  ext2:     'BR2_TARGET_ROOTFS_EXT2=y',
  ext4:     'BR2_TARGET_ROOTFS_EXT2=y\nBR2_TARGET_ROOTFS_EXT2_4=y',
}

export class Buildroot {
  private exec: ExecFn
  private verbose: boolean
  private config: BuildrootConfig

  constructor(exec: ExecFn, verbose = false, config: BuildrootConfig) {
    this.exec = exec
    this.verbose = verbose
    this.config = config
  }

  /** Check if the Buildroot source tree exists and has a Makefile. */
  isAvailable(): boolean {
    return fs.existsSync(path.join(this.config.buildrootDir, 'Makefile'))
  }

  /** Get the Buildroot version from the Makefile. */
  async version(): Promise<string> {
    const r = await this.exec(
      `grep -m1 "^BR2_VERSION" "${path.join(this.config.buildrootDir, 'Makefile')}"`,
      { capture: true }
    )
    return r.data.trim().replace('BR2_VERSION := ', '') || 'unknown'
  }

  /**
   * Consume an existing Buildroot output directory.
   * Locates the rootfs image and returns its path for use as eggs rootfs source.
   */
  consumeOutput(outputDir?: string): BuildrootResult {
    const imagesDir = path.join(
      outputDir ?? this.config.outputDir ?? path.join(this.config.buildrootDir, 'output'),
      'images'
    )

    if (!fs.existsSync(imagesDir)) {
      throw new Error(`Buildroot images directory not found: ${imagesDir}\nRun 'make' in ${this.config.buildrootDir} first.`)
    }

    const format = this.config.rootfsFormat ?? 'squashfs'
    const filename = ROOTFS_FILENAMES[format]
    const rootfsPath = path.join(imagesDir, filename)

    if (!fs.existsSync(rootfsPath)) {
      // Try to find any rootfs image
      const found = fs.readdirSync(imagesDir).find(f => f.startsWith('rootfs.'))
      if (found) {
        const detectedFormat = found.replace('rootfs.', '') as BuildrootOutputFormat
        if (this.verbose) console.log(`buildroot: found ${found}, using as ${detectedFormat}`)
        return this.buildResult(path.join(imagesDir, found), detectedFormat, imagesDir)
      }
      throw new Error(
        `Buildroot rootfs not found: ${rootfsPath}\n` +
        `Enable ${ROOTFS_BR2_VARS[format]} in your Buildroot config.`
      )
    }

    return this.buildResult(rootfsPath, format, imagesDir)
  }

  /**
   * Run a Buildroot build from a defconfig.
   * This is a long-running operation (can take hours for a full build).
   */
  async build(): Promise<BuildrootResult> {
    if (!this.isAvailable()) {
      throw new Error(`Buildroot source not found at: ${this.config.buildrootDir}`)
    }

    const outputDir = this.config.outputDir ?? path.join(this.config.buildrootDir, 'output')
    const jobs = this.config.jobs ?? 0 // 0 = nproc

    // Apply defconfig
    if (this.config.defconfig) {
      const isPath = this.config.defconfig.includes('/')
      const defconfigCmd = isPath
        ? `make -C "${this.config.buildrootDir}" BR2_DEFCONFIG="${this.config.defconfig}" defconfig`
        : `make -C "${this.config.buildrootDir}" ${this.config.defconfig}`

      if (this.verbose) console.log(`buildroot: applying defconfig: ${this.config.defconfig}`)
      const r = await this.exec(defconfigCmd, { echo: this.verbose })
      if (r.code !== 0) throw new Error(`buildroot defconfig failed: ${r.error ?? r.data}`)
    }

    // Build make variables
    const makeVarStr = Object.entries(this.config.makeVars ?? {})
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ')

    const jobsFlag = jobs > 0 ? `-j${jobs}` : `-j$(nproc)`
    const cmd = `make -C "${this.config.buildrootDir}" ${jobsFlag} O="${outputDir}" ${makeVarStr}`

    if (this.verbose) console.log(`buildroot: starting build (this may take a long time)...`)
    const r = await this.exec(cmd, { echo: this.verbose })
    if (r.code !== 0) throw new Error(`buildroot build failed: ${r.error ?? r.data}`)

    return this.consumeOutput(outputDir)
  }

  /**
   * Extract a tar rootfs to a directory for use as eggs rootfs source.
   * Only needed when format=tar; squashfs/erofs can be used directly.
   */
  async extractTar(tarPath: string, outputDir: string): Promise<string> {
    fs.mkdirSync(outputDir, { recursive: true })
    const r = await this.exec(`tar -xf "${tarPath}" -C "${outputDir}"`, { echo: this.verbose })
    if (r.code !== 0) throw new Error(`tar extraction failed: ${r.error ?? r.data}`)
    return outputDir
  }

  /**
   * Prepare the Buildroot rootfs for use as eggs produce source.
   * - squashfs/erofs: returned directly (eggs backends consume them natively)
   * - tar: extracted to a directory
   * - cpio: extracted to a directory
   */
  async prepareForEggs(outputDir?: string): Promise<{ path: string; isDirectory: boolean }> {
    const result = this.consumeOutput(outputDir)

    if (result.format === 'tar') {
      const extractDir = `${result.rootfsPath}.extracted`
      await this.extractTar(result.rootfsPath, extractDir)
      return { path: extractDir, isDirectory: true }
    }

    if (result.format === 'cpio') {
      const extractDir = `${result.rootfsPath}.extracted`
      fs.mkdirSync(extractDir, { recursive: true })
      const r = await this.exec(
        `cd "${extractDir}" && cpio -idm < "${result.rootfsPath}"`,
        { echo: this.verbose }
      )
      if (r.code !== 0) throw new Error(`cpio extraction failed: ${r.error ?? r.data}`)
      return { path: extractDir, isDirectory: true }
    }

    // squashfs, erofs, ext2, ext4 — pass directly to the appropriate eggs backend
    return { path: result.rootfsPath, isDirectory: false }
  }

  private buildResult(rootfsPath: string, format: BuildrootOutputFormat, imagesDir: string): BuildrootResult {
    const sizeBytes = fs.statSync(rootfsPath).size

    // Look for kernel and DTB
    const kernelCandidates = ['Image', 'zImage', 'bzImage', 'uImage', 'vmlinuz']
    let kernelPath: string | undefined
    for (const k of kernelCandidates) {
      const p = path.join(imagesDir, k)
      if (fs.existsSync(p)) { kernelPath = p; break }
    }

    const dtbs = fs.readdirSync(imagesDir).filter(f => f.endsWith('.dtb'))
    const dtbPath = dtbs.length > 0 ? path.join(imagesDir, dtbs[0]) : undefined

    return { rootfsPath, format, kernelPath, dtbPath, sizeBytes }
  }
}
