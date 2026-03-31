/**
 * plugins/sbom/syft-generate/syft-generate.ts
 *
 * SBOM generation for eggs ISO artifacts using anchore/syft.
 * Mounts the ISO, scans the filesystem, and writes the SBOM.
 *
 * https://github.com/anchore/syft
 */

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export type SbomFormat =
  | 'spdx-json'
  | 'cyclonedx-json'
  | 'syft-json'
  | 'spdx-tag-value'

export interface SyftConfig {
  format?: SbomFormat
  outputDir: string
}

export interface SbomResult {
  sbomPath: string
  format: SbomFormat
  isoPath: string
}

export class SyftGenerate {
  private exec: ExecFn

  constructor(exec: ExecFn) {
    this.exec = exec
  }

  /**
   * Check whether the syft binary is on PATH.
   */
  async isAvailable(): Promise<boolean> {
    const result = await this.exec('command -v syft', { capture: true })
    return result.code === 0
  }

  /**
   * Generate an SBOM for an ISO filesystem.
   * Mounts the ISO loop device, runs syft, then unmounts.
   */
  async generate(isoPath: string, config: SyftConfig): Promise<SbomResult> {
    const format: SbomFormat = config.format ?? 'spdx-json'

    if (!fs.existsSync(isoPath)) {
      throw new Error(`ISO not found: ${isoPath}`)
    }

    fs.mkdirSync(config.outputDir, { recursive: true })

    const ext = format.includes('json') ? 'json' : 'txt'
    const sbomPath = path.join(
      config.outputDir,
      `${path.basename(isoPath, '.iso')}.sbom.${ext}`
    )

    const mountPoint = path.join(os.tmpdir(), `eggs-iso-mount-${Date.now()}`)
    fs.mkdirSync(mountPoint, { recursive: true })

    try {
      await this.exec(`mount -o loop,ro ${isoPath} ${mountPoint}`, { echo: true })
      await this.exec(
        `syft dir:${mountPoint} -o ${format}=${sbomPath}`,
        { echo: true }
      )
    } finally {
      await this.exec(`umount ${mountPoint}`, { capture: true })
      fs.rmdirSync(mountPoint)
    }

    return { sbomPath, format, isoPath }
  }

  /**
   * Generate an SBOM directly from a directory (e.g. a chroot).
   * Useful when the ISO is already mounted or working with a chroot.
   */
  async generateFromDir(dirPath: string, config: SyftConfig): Promise<SbomResult> {
    const format: SbomFormat = config.format ?? 'spdx-json'

    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`)
    }

    fs.mkdirSync(config.outputDir, { recursive: true })

    const ext = format.includes('json') ? 'json' : 'txt'
    const sbomPath = path.join(
      config.outputDir,
      `${path.basename(dirPath)}.sbom.${ext}`
    )

    await this.exec(
      `syft dir:${dirPath} -o ${format}=${sbomPath}`,
      { echo: true }
    )

    return { sbomPath, format, isoPath: dirPath }
  }
}
