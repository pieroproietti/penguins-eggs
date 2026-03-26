/**
 * plugins/build-infra/gpt-image/gpt-image.ts
 *
 * GPT disk image creation via UEFI-GPT-image-creator.
 *
 * UEFI-GPT-image-creator (https://github.com/queso-fuego/UEFI-GPT-image-creator)
 * is a C program (write_gpt) that creates a valid GPT disk image with a FAT32
 * EFI System Partition and an optional Basic Data Partition. Accepts a
 * BOOTX64.EFI and embeds it at /EFI/BOOT/BOOTX64.EFI. Supports VHD output.
 *
 * This plugin produces a bootable GPT disk image (.hdd or .vhd) from an
 * eggs-produced EFI binary and rootfs image. Useful for:
 *   - Writing directly to USB drives (dd if=image.hdd of=/dev/sdX)
 *   - VM disk images (VirtualBox, QEMU, Hyper-V via VHD)
 *   - Pure UEFI targets where ISO overhead is undesirable
 *
 * Pairs with verity-squash: signed UKI → ESP, SquashFS + verity tree → data partition.
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

export interface GptImageOptions {
  /** EFI binary to embed as /EFI/BOOT/BOOTX64.EFI. */
  efiBinary: string
  /** Output image path (.hdd or .vhd). */
  outputPath: string
  /** ESP size in MiB. Default: 100. */
  espSizeMib?: number
  /** Data partition size in MiB. 0 = no data partition. Default: 0. */
  dataSizeMib?: number
  /** Files to add to the ESP (map of dest path → source path). */
  espFiles?: Record<string, string>
  /** Files to add to the data partition (map of dest path → source path). */
  dataFiles?: Record<string, string>
  /** Produce VHD output instead of raw image. Default: false. */
  vhd?: boolean
  /** Path to write_gpt binary. Built from source if not found. */
  writGptBin?: string
  /** Source directory for write_gpt (to build from source). */
  writGptSrcDir?: string
}

export interface GptImageResult {
  outputPath: string
  sizeBytes: number
  espSizeMib: number
  dataSizeMib: number
  isVhd: boolean
}

export class GptImage {
  private exec: ExecFn
  private verbose: boolean
  private opts: GptImageOptions

  constructor(exec: ExecFn, verbose = false, opts: GptImageOptions) {
    this.exec = exec
    this.verbose = verbose
    this.opts = opts
  }

  /** Check if write_gpt is available. */
  async isAvailable(): Promise<boolean> {
    if (this.opts.writGptBin && fs.existsSync(this.opts.writGptBin)) return true
    const r = await this.exec('command -v write_gpt', { capture: true })
    return r.code === 0
  }

  /** Build write_gpt from source. Requires gcc. */
  async buildFromSource(srcDir: string): Promise<string> {
    if (!fs.existsSync(srcDir)) {
      throw new Error(`write_gpt source not found: ${srcDir}\nClone: git clone https://github.com/queso-fuego/UEFI-GPT-image-creator`)
    }

    const r = await this.exec(`make -C "${srcDir}"`, { echo: this.verbose })
    if (r.code !== 0) throw new Error(`write_gpt build failed: ${r.error ?? r.data}`)

    const bin = path.join(srcDir, 'write_gpt')
    if (!fs.existsSync(bin)) throw new Error(`write_gpt binary not found after build: ${bin}`)
    return bin
  }

  /** Resolve the write_gpt binary path. */
  async resolveBin(): Promise<string> {
    if (this.opts.writGptBin && fs.existsSync(this.opts.writGptBin)) {
      return this.opts.writGptBin
    }
    const pathCheck = await this.exec('command -v write_gpt', { capture: true })
    if (pathCheck.code === 0) return 'write_gpt'

    if (this.opts.writGptSrcDir) {
      return this.buildFromSource(this.opts.writGptSrcDir)
    }

    throw new Error(
      'write_gpt not found.\n' +
      'Build from source:\n' +
      '  git clone https://github.com/queso-fuego/UEFI-GPT-image-creator\n' +
      '  make -C UEFI-GPT-image-creator\n' +
      'Then pass --write-gpt-bin or set writGptBin in options.'
    )
  }

  /**
   * Create a bootable GPT disk image.
   *
   * The EFI binary is placed at /EFI/BOOT/BOOTX64.EFI on the ESP.
   * Additional files can be added to both partitions via espFiles/dataFiles.
   */
  async create(): Promise<GptImageResult> {
    const bin = await this.resolveBin()

    if (!fs.existsSync(this.opts.efiBinary)) {
      throw new Error(`EFI binary not found: ${this.opts.efiBinary}`)
    }

    const espSizeMib  = this.opts.espSizeMib  ?? 100
    const dataSizeMib = this.opts.dataSizeMib ?? 0
    const workDir = path.join(path.dirname(this.opts.outputPath), '.gpt-image-work')
    fs.mkdirSync(workDir, { recursive: true })

    // write_gpt expects BOOTX64.EFI in the current directory
    const efiCopy = path.join(workDir, 'BOOTX64.EFI')
    fs.copyFileSync(this.opts.efiBinary, efiCopy)

    // Build write_gpt argument list
    // write_gpt usage: write_gpt <output> <esp_size_mb> [data_size_mb] [--vhd]
    const args: string[] = [
      this.opts.outputPath,
      String(espSizeMib),
    ]
    if (dataSizeMib > 0) args.push(String(dataSizeMib))
    if (this.opts.vhd)   args.push('--vhd')

    const cmd = `cd "${workDir}" && "${bin}" ${args.join(' ')}`
    const result = await this.exec(cmd, { echo: this.verbose })
    if (result.code !== 0) {
      throw new Error(`write_gpt failed (exit ${result.code}): ${result.error ?? result.data}`)
    }

    // Add extra ESP files by mounting the image and copying
    if (this.opts.espFiles && Object.keys(this.opts.espFiles).length > 0) {
      await this.addFilesToPartition(this.opts.outputPath, 1, this.opts.espFiles)
    }

    // Add extra data partition files
    if (this.opts.dataFiles && dataSizeMib > 0 && Object.keys(this.opts.dataFiles).length > 0) {
      await this.addFilesToPartition(this.opts.outputPath, 2, this.opts.dataFiles)
    }

    // Clean up work dir
    fs.rmSync(workDir, { recursive: true, force: true })

    const sizeBytes = fs.statSync(this.opts.outputPath).size
    return {
      outputPath: this.opts.outputPath,
      sizeBytes,
      espSizeMib,
      dataSizeMib,
      isVhd: !!this.opts.vhd,
    }
  }

  /**
   * Add files to a partition in the GPT image using a loop device.
   * Requires root.
   */
  private async addFilesToPartition(
    imagePath: string,
    partNum: number,
    files: Record<string, string>
  ): Promise<void> {
    const mnt = `/tmp/gpt-image-mnt-${Date.now()}`
    fs.mkdirSync(mnt, { recursive: true })

    try {
      // Set up loop device
      const loopResult = await this.exec(`losetup -f --show -P "${imagePath}"`, { capture: true })
      if (loopResult.code !== 0) throw new Error(`losetup failed: ${loopResult.error}`)
      const loopDev = loopResult.data.trim()

      try {
        await this.exec(`mount "${loopDev}p${partNum}" "${mnt}"`, { echo: this.verbose })

        for (const [dest, src] of Object.entries(files)) {
          const destPath = path.join(mnt, dest)
          fs.mkdirSync(path.dirname(destPath), { recursive: true })
          fs.copyFileSync(src, destPath)
          if (this.verbose) console.log(`gpt-image: added ${src} → partition ${partNum}:${dest}`)
        }

        await this.exec(`umount "${mnt}"`, { echo: this.verbose })
      } finally {
        await this.exec(`losetup -d "${loopDev}"`, { capture: true })
      }
    } finally {
      fs.rmSync(mnt, { recursive: true, force: true })
    }
  }
}
