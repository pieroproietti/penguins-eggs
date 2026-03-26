/**
 * vouch-attest: cryptographic attestation for eggs ISO artifacts
 * Upstream: https://github.com/mitchellh/vouch
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

export interface VouchConfig {
  keyPath: string
  outputDir: string
}

/**
 * Sign an ISO artifact using vouch and write the attestation bundle
 * alongside the ISO.
 */
export function attestIso(isoPath: string, config: VouchConfig): string {
  if (!fs.existsSync(isoPath)) {
    throw new Error(`ISO not found: ${isoPath}`)
  }

  fs.mkdirSync(config.outputDir, { recursive: true })

  const bundlePath = path.join(
    config.outputDir,
    path.basename(isoPath) + '.attestation.json'
  )

  execSync(
    `vouch attest --key ${config.keyPath} --output ${bundlePath} ${isoPath}`,
    { stdio: 'inherit' }
  )

  return bundlePath
}

/**
 * Verify an attestation bundle against an ISO.
 * Returns true if the signature is valid.
 */
export function verifyIso(isoPath: string, bundlePath: string): boolean {
  try {
    execSync(`vouch verify --attestation ${bundlePath} ${isoPath}`, {
      stdio: 'inherit',
    })
    return true
  } catch {
    return false
  }
}
