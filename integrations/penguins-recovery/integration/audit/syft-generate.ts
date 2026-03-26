/**
 * integration/audit/syft-generate.ts
 *
 * SBOM generation for penguins-recovery ISOs using anchore/syft.
 * Scans the recovery ISO filesystem and writes an SBOM alongside it.
 *
 * Adapted from penguins-eggs-audit/plugins/sbom/syft-generate.
 * https://github.com/anchore/syft
 *
 * Usage (from a penguins-recovery builder after ISO creation):
 *
 *   const syft = new RecoverySyft(execFn)
 *   if (await syft.isAvailable()) {
 *     const result = await syft.generate('/path/to/recovery.iso', {
 *       outputDir: '/path/to/recovery.iso.d',
 *     })
 *     console.log('SBOM written to', result.sbomPath)
 *   }
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

export interface RecoverySyftConfig {
  /** SBOM output format. Defaults to 'spdx-json'. */
  format?: SbomFormat
  /** Directory to write the SBOM file into. */
  outputDir: string
}

export interface RecoverySbomResult {
  sbomPath: string
  format: SbomFormat
  isoPath: string
}

export class RecoverySyft {
  private exec: ExecFn

  constructor(exec: ExecFn) {
    this.exec = exec
  }

  async isAvailable(): Promise<boolean> {
    const result = await this.exec('command -v syft', { capture: true })
    return result.code === 0
  }

  /**
   * Generate an SBOM for a recovery ISO.
   * Mounts the ISO read-only, runs syft against the filesystem, then unmounts.
   */
  async generate(isoPath: string, config: RecoverySyftConfig): Promise<RecoverySbomResult> {
    const format: SbomFormat = config.format ?? 'spdx-json'

    if (!fs.existsSync(isoPath)) {
      throw new Error(`Recovery ISO not found: ${isoPath}`)
    }

    fs.mkdirSync(config.outputDir, { recursive: true })

    const ext = format.includes('json') ? 'json' : 'txt'
    const sbomPath = path.join(
      config.outputDir,
      `${path.basename(isoPath, '.iso')}.sbom.${ext}`
    )

    const mountPoint = path.join(os.tmpdir(), `recovery-iso-mount-${Date.now()}`)
    fs.mkdirSync(mountPoint, { recursive: true })

    try {
      await this.exec(`mount -o loop,ro ${isoPath} ${mountPoint}`, { echo: true })
      await this.exec(`syft dir:${mountPoint} -o ${format}=${sbomPath}`, { echo: true })
    } finally {
      await this.exec(`umount ${mountPoint}`, { capture: true })
      fs.rmdirSync(mountPoint)
    }

    return { sbomPath, format, isoPath }
  }

  /**
   * Generate an SBOM from a recovery chroot directory.
   * Use this when the ISO filesystem is already extracted or mounted externally.
   */
  async generateFromChroot(chrootPath: string, config: RecoverySyftConfig): Promise<RecoverySbomResult> {
    const format: SbomFormat = config.format ?? 'spdx-json'

    if (!fs.existsSync(chrootPath)) {
      throw new Error(`Chroot path not found: ${chrootPath}`)
    }

    fs.mkdirSync(config.outputDir, { recursive: true })

    const ext = format.includes('json') ? 'json' : 'txt'
    const sbomPath = path.join(
      config.outputDir,
      `${path.basename(chrootPath)}.sbom.${ext}`
    )

    await this.exec(`syft dir:${chrootPath} -o ${format}=${sbomPath}`, { echo: true })

    return { sbomPath, format, isoPath: chrootPath }
  }
}
