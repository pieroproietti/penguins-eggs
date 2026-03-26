/**
 * plugins/build-infra/partymix/partymix.ts
 *
 * MBR disk image assembly via partymix.
 *
 * partymix (https://github.com/pyx-cvm/partymix) is a Rust CLI tool that
 * combines individual filesystem images (FAT32, ext4, etc.) into a single
 * MBR-partitioned disk image. Supports partition type aliases (fat32, linux,
 * efi, linuxswap), active partition flag, and outputs a ready-to-write .img.
 *
 * Complements gpt-image (GPT/UEFI) for legacy BIOS targets. Together they
 * provide full disk image output coverage:
 *   gpt-image  → GPT + UEFI (modern hardware, VMs)
 *   partymix   → MBR + BIOS (legacy hardware, broad compatibility)
 *
 * Requires Rust/cargo to build from source, or a pre-built binary.
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

export type PartymixPartitionType =
  | 'fat32' | 'fat16' | 'fat12'
  | 'linux' | 'linux-swap'
  | 'efi'
  | 'ntfs'
  | 'empty'

export interface PartymixPartition {
  /** Filesystem image file to embed. */
  image: string
  /** Partition type alias. Default: linux. */
  type?: PartymixPartitionType
  /** Mark as active/bootable. Default: false. */
  active?: boolean
}

export interface PartymixOptions {
  /** Output disk image path. */
  outputPath: string
  /** Partitions to include, in order. */
  partitions: PartymixPartition[]
  /** Path to partymix binary. Built from source if not found. */
  binPath?: string
  /** Source directory for building partymix from source. */
  srcDir?: string
}

export interface PartymixResult {
  outputPath: string
  sizeBytes: number
  partitionCount: number
}

export class Partymix {
  private exec: ExecFn
  private verbose: boolean
  private opts: PartymixOptions

  constructor(exec: ExecFn, verbose = false, opts: PartymixOptions) {
    this.exec = exec
    this.verbose = verbose
    this.opts = opts
  }

  /** Check if partymix is available. */
  async isAvailable(): Promise<boolean> {
    if (this.opts.binPath && fs.existsSync(this.opts.binPath)) return true
    const r = await this.exec('command -v partymix', { capture: true })
    return r.code === 0
  }

  /** Build partymix from source using cargo. */
  async buildFromSource(srcDir: string): Promise<string> {
    if (!fs.existsSync(srcDir)) {
      throw new Error(
        `partymix source not found: ${srcDir}\n` +
        'Clone: git clone https://github.com/pyx-cvm/partymix'
      )
    }

    const cargoCheck = await this.exec('command -v cargo', { capture: true })
    if (cargoCheck.code !== 0) {
      throw new Error(
        'cargo not found. Install Rust: curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh'
      )
    }

    const r = await this.exec(`cargo build --release --manifest-path "${srcDir}/Cargo.toml"`, { echo: this.verbose })
    if (r.code !== 0) throw new Error(`partymix build failed: ${r.error ?? r.data}`)

    const bin = path.join(srcDir, 'target', 'release', 'partymix')
    if (!fs.existsSync(bin)) throw new Error(`partymix binary not found after build: ${bin}`)
    return bin
  }

  /** Resolve the partymix binary. */
  async resolveBin(): Promise<string> {
    if (this.opts.binPath && fs.existsSync(this.opts.binPath)) return this.opts.binPath
    const pathCheck = await this.exec('command -v partymix', { capture: true })
    if (pathCheck.code === 0) return 'partymix'
    if (this.opts.srcDir) return this.buildFromSource(this.opts.srcDir)
    throw new Error(
      'partymix not found.\n' +
      'Build from source:\n' +
      '  git clone https://github.com/pyx-cvm/partymix\n' +
      '  cargo build --release --manifest-path partymix/Cargo.toml\n' +
      'Then pass --partymix-bin or set binPath in options.'
    )
  }

  /**
   * Assemble filesystem images into an MBR disk image.
   */
  async create(): Promise<PartymixResult> {
    const bin = await this.resolveBin()

    for (const part of this.opts.partitions) {
      if (!fs.existsSync(part.image)) {
        throw new Error(`Partition image not found: ${part.image}`)
      }
    }

    // partymix CLI: partymix <output> <type>:<image>[*] [<type>:<image>[*] ...]
    // The * suffix marks a partition as active/bootable
    const partArgs = this.opts.partitions.map(p => {
      const type = p.type ?? 'linux'
      const active = p.active ? '*' : ''
      return `${type}:${p.image}${active}`
    })

    const cmd = `"${bin}" "${this.opts.outputPath}" ${partArgs.join(' ')}`
    const result = await this.exec(cmd, { echo: this.verbose })
    if (result.code !== 0) {
      throw new Error(`partymix failed (exit ${result.code}): ${result.error ?? result.data}`)
    }

    const sizeBytes = fs.statSync(this.opts.outputPath).size
    return {
      outputPath: this.opts.outputPath,
      sizeBytes,
      partitionCount: this.opts.partitions.length,
    }
  }
}
