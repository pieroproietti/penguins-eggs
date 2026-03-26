/**
 * plugins/build-infra/mkosi/mkosi.ts
 *
 * mkosi integration for eggs produce.
 *
 * mkosi (https://github.com/systemd/mkosi) builds bespoke OS disk images by
 * wrapping dnf/apt/pacman/zypper with GPT partitioning, dm-verity, Secure Boot
 * signing, UKI generation, initrd building, and EROFS/SquashFS support.
 *
 * Two integration modes:
 *
 * 1. BASE IMAGE MODE: Use mkosi to produce a clean, reproducible base rootfs
 *    from distribution packages, then hand it to eggs produce for remastering.
 *    Gives eggs a package-manager-built starting point rather than requiring
 *    a running installation.
 *
 * 2. PIPELINE MODE: Use mkosi's --verity, --secure-boot, and --format=uki
 *    options to post-process an eggs-produced SquashFS into a verified,
 *    signed UKI — complementing the verity-squash and go-dmverity plugins.
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

export type MkosiFormat =
  | 'disk'       // GPT disk image
  | 'uki'        // Unified Kernel Image EFI binary
  | 'directory'  // Plain directory (fastest, no image)
  | 'tar'        // Tar archive
  | 'cpio'       // CPIO archive (for initrd)
  | 'squashfs'   // SquashFS image
  | 'erofs'      // EROFS image

export type MkosiDistribution =
  | 'fedora' | 'debian' | 'ubuntu' | 'arch' | 'opensuse'
  | 'centos' | 'rhel' | 'alma' | 'rocky' | 'gentoo'

export interface MkosiConfig {
  /** Output format. Default: directory (for use as eggs rootfs source). */
  format?: MkosiFormat
  /** Target distribution. */
  distribution?: MkosiDistribution
  /** Distribution release/version. */
  release?: string
  /** Packages to install. */
  packages?: string[]
  /** Build directory. Default: mkosi.output/ */
  outputDir?: string
  /** mkosi.conf file path. Auto-generated if not set. */
  configFile?: string
  /** Enable dm-verity on the output image. */
  verity?: boolean
  /** Enable Secure Boot signing. */
  secureBoot?: boolean
  /** Path to Secure Boot signing key. */
  secureBootKey?: string
  /** Path to Secure Boot certificate. */
  secureBootCert?: string
  /** Kernel command line. */
  kernelCommandLine?: string
  /** Extra mkosi arguments passed verbatim. */
  extraArgs?: string[]
  /** Architecture. Default: native. */
  architecture?: string
}

export interface MkosiResult {
  /** Path to the produced image or directory. */
  outputPath: string
  /** Format of the output. */
  format: MkosiFormat
  /** Size in bytes. */
  sizeBytes: number
  /** Whether dm-verity was applied. */
  verityEnabled: boolean
  /** dm-verity root hash (if verity enabled). */
  rootHash?: string
}

export class Mkosi {
  private exec: ExecFn
  private verbose: boolean
  private config: MkosiConfig

  constructor(exec: ExecFn, verbose = false, config: MkosiConfig = {}) {
    this.exec = exec
    this.verbose = verbose
    this.config = config
  }

  /** Check if mkosi is installed. */
  async isAvailable(): Promise<boolean> {
    const r = await this.exec('command -v mkosi', { capture: true })
    return r.code === 0
  }

  /** Get mkosi version string. */
  async version(): Promise<string> {
    const r = await this.exec('mkosi --version', { capture: true })
    return r.data.trim()
  }

  /**
   * Write a mkosi.conf file for the given configuration.
   * Returns the path to the written config file.
   */
  writeConfig(workDir: string): string {
    fs.mkdirSync(workDir, { recursive: true })
    const configPath = path.join(workDir, 'mkosi.conf')

    const lines: string[] = ['[Distribution]']
    if (this.config.distribution) lines.push(`Distribution=${this.config.distribution}`)
    if (this.config.release)      lines.push(`Release=${this.config.release}`)
    if (this.config.architecture) lines.push(`Architecture=${this.config.architecture}`)

    lines.push('', '[Output]')
    lines.push(`Format=${this.config.format ?? 'directory'}`)
    if (this.config.outputDir) lines.push(`OutputDirectory=${this.config.outputDir}`)

    if (this.config.packages?.length) {
      lines.push('', '[Content]')
      lines.push(`Packages=${this.config.packages.join('\n        ')}`)
    }

    if (this.config.verity || this.config.secureBoot) {
      lines.push('', '[Validation]')
      if (this.config.verity)      lines.push('Verity=yes')
      if (this.config.secureBoot)  lines.push('SecureBoot=yes')
      if (this.config.secureBootKey)  lines.push(`SecureBootKey=${this.config.secureBootKey}`)
      if (this.config.secureBootCert) lines.push(`SecureBootCertificate=${this.config.secureBootCert}`)
    }

    if (this.config.kernelCommandLine) {
      lines.push('', '[Host]')
      lines.push(`KernelCommandLine=${this.config.kernelCommandLine}`)
    }

    fs.writeFileSync(configPath, lines.join('\n') + '\n')
    if (this.verbose) console.log(`mkosi: config written to ${configPath}`)
    return configPath
  }

  /**
   * Build a base OS image using mkosi.
   * Returns the path to the produced image/directory.
   */
  async build(workDir: string): Promise<MkosiResult> {
    if (!(await this.isAvailable())) {
      throw new Error(
        'mkosi not found.\n' +
        'Install: pip install mkosi  OR  apt install mkosi (>= v16)\n' +
        'Or: pipx install git+https://github.com/systemd/mkosi.git'
      )
    }

    const configPath = this.config.configFile ?? this.writeConfig(workDir)
    const outputDir = this.config.outputDir ?? path.join(workDir, 'mkosi.output')
    fs.mkdirSync(outputDir, { recursive: true })

    const args = [
      '--directory', path.dirname(configPath),
      '--output-dir', outputDir,
    ]

    if (this.config.format)       args.push('--format', this.config.format)
    if (this.config.distribution) args.push('--distribution', this.config.distribution)
    if (this.config.release)      args.push('--release', this.config.release)
    if (this.config.verity)       args.push('--verity=yes')
    if (this.config.secureBoot)   args.push('--secure-boot=yes')
    if (this.config.secureBootKey)  args.push('--secure-boot-key', this.config.secureBootKey)
    if (this.config.secureBootCert) args.push('--secure-boot-certificate', this.config.secureBootCert)
    if (this.config.extraArgs)    args.push(...this.config.extraArgs)

    const cmd = `mkosi ${args.join(' ')}`
    const result = await this.exec(cmd, { echo: this.verbose })
    if (result.code !== 0) {
      throw new Error(`mkosi build failed (exit ${result.code}): ${result.error ?? result.data}`)
    }

    // Locate the output
    const outputPath = await this.findOutput(outputDir)
    const sizeBytes = await this.pathSize(outputPath)

    // Extract root hash if verity was enabled
    let rootHash: string | undefined
    if (this.config.verity) {
      rootHash = await this.extractRootHash(outputDir)
    }

    return {
      outputPath,
      format: this.config.format ?? 'directory',
      sizeBytes,
      verityEnabled: !!this.config.verity,
      rootHash,
    }
  }

  /**
   * Build a UKI from an existing eggs-produced SquashFS.
   * Uses mkosi's --format=uki with the SquashFS as the rootfs image.
   */
  async buildUki(
    squashfsPath: string,
    workDir: string,
    outputPath: string
  ): Promise<MkosiResult> {
    const args = [
      '--format', 'uki',
      '--output', outputPath,
    ]
    if (this.config.secureBoot)     args.push('--secure-boot=yes')
    if (this.config.secureBootKey)  args.push('--secure-boot-key', this.config.secureBootKey!)
    if (this.config.secureBootCert) args.push('--secure-boot-certificate', this.config.secureBootCert!)
    if (this.config.verity)         args.push('--verity=yes')
    if (this.config.kernelCommandLine) args.push('--kernel-command-line', this.config.kernelCommandLine)
    if (this.config.extraArgs)      args.push(...this.config.extraArgs!)

    const result = await this.exec(`mkosi ${args.join(' ')}`, { echo: this.verbose })
    if (result.code !== 0) {
      throw new Error(`mkosi UKI build failed: ${result.error ?? result.data}`)
    }

    const sizeBytes = fs.statSync(outputPath).size
    const rootHash = this.config.verity ? await this.extractRootHash(workDir) : undefined

    return {
      outputPath,
      format: 'uki',
      sizeBytes,
      verityEnabled: !!this.config.verity,
      rootHash,
    }
  }

  /**
   * Use a mkosi-produced directory as the rootfs source for eggs produce.
   * Returns the directory path to pass to mksquashfs/mkdwarfs/mkfs.erofs.
   */
  async prepareRootfs(workDir: string): Promise<string> {
    const result = await this.build(workDir)
    if (result.format !== 'directory') {
      throw new Error(`prepareRootfs requires format=directory, got ${result.format}`)
    }
    return result.outputPath
  }

  private async findOutput(outputDir: string): Promise<string> {
    // mkosi names output based on distribution and format
    const entries = fs.readdirSync(outputDir)
    if (entries.length === 0) throw new Error(`mkosi produced no output in ${outputDir}`)
    // Prefer the largest file/directory
    let best = entries[0]
    for (const e of entries) {
      const s = fs.statSync(path.join(outputDir, e))
      const b = fs.statSync(path.join(outputDir, best))
      if (s.size > b.size) best = e
    }
    return path.join(outputDir, best)
  }

  private async extractRootHash(outputDir: string): Promise<string | undefined> {
    // mkosi writes root hash to <output>.roothash
    const entries = fs.readdirSync(outputDir)
    const rhFile = entries.find(e => e.endsWith('.roothash'))
    if (!rhFile) return undefined
    return fs.readFileSync(path.join(outputDir, rhFile), 'utf8').trim()
  }

  private async pathSize(p: string): Promise<number> {
    const stat = fs.statSync(p)
    if (stat.isDirectory()) {
      const r = await this.exec(`du -sb "${p}"`, { capture: true })
      return parseInt(r.data.split('\t')[0], 10) || 0
    }
    return stat.size
  }
}
