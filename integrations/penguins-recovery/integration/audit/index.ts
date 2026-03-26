/**
 * integration/audit/index.ts
 *
 * Audit integrations for penguins-recovery, adapted from penguins-eggs-audit.
 *
 * Four optional post-build steps:
 *   1. os-hardening  — harden the recovery chroot before ISO packaging
 *   2. syft-generate — generate an SBOM for the recovery ISO
 *   3. grant-license — check license compliance against the SBOM
 *   4. vouch-attest  — sign the recovery ISO with a cryptographic attestation
 *
 * All four are opt-in and fail gracefully when the required binary is absent.
 *
 * Example — full audit pipeline after a recovery ISO build:
 *
 *   import { RecoveryHardening, RecoverySyft, RecoveryGrant, RecoveryVouch } from './audit/index.js'
 *
 *   const hardening = new RecoveryHardening(exec)
 *   await hardening.fetchScripts()
 *   await hardening.applyHardening({ chrootPath: '/var/tmp/recovery-chroot' })
 *
 *   const syft = new RecoverySyft(exec)
 *   const sbom = await syft.generate(isoPath, { outputDir: isoDir })
 *
 *   const grant = new RecoveryGrant(exec)
 *   await grant.check(sbom.sbomPath)
 *
 *   const vouch = new RecoveryVouch(exec)
 *   await vouch.attest(isoPath, { keyPath: '/etc/keys/recovery.key', outputDir: isoDir })
 */

export { RecoveryHardening } from './os-hardening.js'
export type { RecoveryHardeningOptions, RecoveryHardeningResult } from './os-hardening.js'

export { RecoverySyft } from './syft-generate.js'
export type { RecoverySyftConfig, RecoverySbomResult, SbomFormat } from './syft-generate.js'

export { RecoveryGrant } from './grant-license.js'
export type { RecoveryGrantConfig, RecoveryLicenseResult } from './grant-license.js'

export { RecoveryVouch } from './vouch-attest.js'
export type { RecoveryVouchConfig, RecoveryAttestResult } from './vouch-attest.js'
