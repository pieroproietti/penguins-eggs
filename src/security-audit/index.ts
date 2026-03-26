/**
 * Security & Audit plugins — OS hardening, attestation, vulnerability scanning.
 */

export { VouchAttest } from '../../plugins/security-audit/vouch-attest/vouch-attest.js'
export type { VouchConfig, AttestResult } from '../../plugins/security-audit/vouch-attest/vouch-attest.js'

export { OsHardening } from '../../plugins/security-audit/os-hardening/os-hardening.js'
export type { TargetOS, HardeningOptions, HardeningResult } from '../../plugins/security-audit/os-hardening/os-hardening.js'

export { LinuxSuite } from '../../plugins/security-audit/linux-suite/linux-suite.js'
export type { InstallResult } from '../../plugins/security-audit/linux-suite/linux-suite.js'
