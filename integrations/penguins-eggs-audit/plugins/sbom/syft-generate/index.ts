/**
 * syft-generate: SBOM generation for eggs ISO artifacts
 * Upstream: https://github.com/anchore/syft
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

export type SbomFormat =
  | 'spdx-json'
  | 'cyclonedx-json'
  | 'syft-json'
  | 'spdx-tag-value'

export interface SyftConfig {
  format?: SbomFormat
  outputDir: string
}

/**
 * Generate an SBOM for an ISO filesystem using syft.
 * Mounts the ISO, scans it, and writes the SBOM to outputDir.
 * Returns the path to the generated SBOM file.
 */
export function generateSbom(isoPath: string, config: SyftConfig): string {
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

  const mountPoint = `/tmp/eggs-iso-mount-${Date.now()}`
  fs.mkdirSync(mountPoint, { recursive: true })

  try {
    execSync(`mount -o loop,ro ${isoPath} ${mountPoint}`, { stdio: 'inherit' })
    execSync(
      `syft dir:${mountPoint} -o ${format}=${sbomPath}`,
      { stdio: 'inherit' }
    )
  } finally {
    execSync(`umount ${mountPoint}`, { stdio: 'pipe' })
    fs.rmdirSync(mountPoint)
  }

  return sbomPath
}
