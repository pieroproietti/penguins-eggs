/**
 * plugins/sbom/sbom-reference/sbom-reference.ts
 *
 * Adapts the CISA SBOM Generation reference implementations to augment
 * and enrich eggs ISO SBOMs with NTIA-required fields.
 *
 * Augmentation: populate top-level metadata (supplier, license, description)
 * Enrichment:   add NTIA-required fields to each component from open datasets
 *
 * https://github.com/SBOM-Community/SBOM-Generation
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export interface SbomMetadata {
  supplier: string
  version: string
  description: string
  homepage?: string
  license?: string
}

export interface AugmentResult {
  outputPath: string
  metadata: SbomMetadata
}

export interface EnrichResult {
  outputPath: string
  enriched: boolean
  warning?: string
}

export class SbomReference {
  private exec: ExecFn

  constructor(exec: ExecFn) {
    this.exec = exec
  }

  /**
   * Check whether the Python enrichment tooling is available.
   */
  async enrichmentAvailable(): Promise<boolean> {
    const result = await this.exec(
      'python3 -c "import sbom_enrichment"',
      { capture: true }
    )
    return result.code === 0
  }

  /**
   * Augment an SPDX-JSON SBOM with top-level metadata fields.
   * This is the "augmentation" step from the CISA reference implementation.
   */
  augment(sbomPath: string, metadata: SbomMetadata): AugmentResult {
    if (!fs.existsSync(sbomPath)) {
      throw new Error(`SBOM not found: ${sbomPath}`)
    }

    const sbom = JSON.parse(fs.readFileSync(sbomPath, 'utf8'))

    sbom.name = sbom.name ?? path.basename(sbomPath, '.json')
    sbom.documentNamespace =
      sbom.documentNamespace ??
      `https://penguins-eggs.net/sbom/${path.basename(sbomPath)}-${Date.now()}`

    sbom.creationInfo = {
      ...sbom.creationInfo,
      creators: [
        'Tool: penguins-eggs-audit',
        `Organization: ${metadata.supplier}`,
      ],
      comment: metadata.description,
    }

    if (metadata.license) {
      sbom.dataLicense = metadata.license
    }

    const outputPath = sbomPath.replace(/\.json$/, '.augmented.json')
    fs.writeFileSync(outputPath, JSON.stringify(sbom, null, 2))

    return { outputPath, metadata }
  }

  /**
   * Enrich an SBOM by adding NTIA-required fields to each component
   * from open datasets (OSV, ClearlyDefined, etc.).
   * This is the "enrichment" step from the CISA reference implementation.
   */
  async enrich(sbomPath: string): Promise<EnrichResult> {
    if (!fs.existsSync(sbomPath)) {
      throw new Error(`SBOM not found: ${sbomPath}`)
    }

    const outputPath = sbomPath.replace(/\.augmented\.json$/, '.enriched.json')

    const available = await this.enrichmentAvailable()

    if (available) {
      await this.exec(
        `python3 -m sbom_enrichment --input ${sbomPath} --output ${outputPath}`,
        { echo: true }
      )
      return { outputPath, enriched: true }
    }

    // Graceful fallback: copy augmented SBOM as enriched
    fs.copyFileSync(sbomPath, outputPath)
    return {
      outputPath,
      enriched: false,
      warning:
        'sbom_enrichment not available. Install from SBOM-Community/SBOM-Generation. ' +
        'Augmented SBOM copied as enriched.',
    }
  }
}
