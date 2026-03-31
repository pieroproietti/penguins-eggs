/**
 * SBOM & Supply Chain plugins — SBOM generation, license compliance, enrichment.
 */

export { SyftGenerate } from '../../plugins/sbom/syft-generate/syft-generate.js'
export type { SbomFormat, SyftConfig, SbomResult } from '../../plugins/sbom/syft-generate/syft-generate.js'

export { GrantLicense } from '../../plugins/sbom/grant-license/grant-license.js'
export type { GrantConfig, LicenseCheckResult } from '../../plugins/sbom/grant-license/grant-license.js'

export { SbomReference } from '../../plugins/sbom/sbom-reference/sbom-reference.js'
export type { SbomMetadata, AugmentResult, EnrichResult } from '../../plugins/sbom/sbom-reference/sbom-reference.js'
