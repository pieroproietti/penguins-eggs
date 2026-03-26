/**
 * integration/audit/vouch-attest.ts
 *
 * Cryptographic attestation for penguins-recovery ISO artifacts via mitchellh/vouch.
 * Signs recovery ISOs after build and verifies attestation bundles.
 *
 * Adapted from penguins-eggs-audit/plugins/security-audit/vouch-attest.
 * https://github.com/mitchellh/vouch
 *
 * Usage (from a penguins-recovery builder after ISO creation):
 *
 *   const vouch = new RecoveryVouch(execFn)
 *   if (await vouch.isAvailable()) {
 *     const result = await vouch.attest('/path/to/recovery.iso', {
 *       keyPath: '/etc/keys/recovery.key',
 *       outputDir: '/path/to/recovery.iso.d',
 *     })
 *     console.log('Attestation bundle:', result.bundlePath)
 *   }
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export interface RecoveryVouchConfig {
  /** Path to the signing key. */
  keyPath: string
  /** Directory to write the attestation bundle into. */
  outputDir: string
}

export interface RecoveryAttestResult {
  isoPath: string
  bundlePath: string
  success: boolean
}

export class RecoveryVouch {
  private exec: ExecFn

  constructor(exec: ExecFn) {
    this.exec = exec
  }

  async isAvailable(): Promise<boolean> {
    const result = await this.exec('command -v vouch', { capture: true })
    return result.code === 0
  }

  /**
   * Sign a recovery ISO and write the attestation bundle to outputDir.
   */
  async attest(isoPath: string, config: RecoveryVouchConfig): Promise<RecoveryAttestResult> {
    if (!fs.existsSync(isoPath)) {
      throw new Error(`Recovery ISO not found: ${isoPath}`)
    }

    fs.mkdirSync(config.outputDir, { recursive: true })

    const bundlePath = path.join(
      config.outputDir,
      path.basename(isoPath) + '.attestation.json'
    )

    const result = await this.exec(
      `vouch attest --key ${config.keyPath} --output ${bundlePath} ${isoPath}`,
      { echo: true }
    )

    return { isoPath, bundlePath, success: result.code === 0 }
  }

  /**
   * Verify an attestation bundle against a recovery ISO.
   * Returns true if the signature is valid.
   */
  async verify(isoPath: string, bundlePath: string): Promise<boolean> {
    if (!fs.existsSync(bundlePath)) {
      throw new Error(`Attestation bundle not found: ${bundlePath}`)
    }

    const result = await this.exec(
      `vouch verify --attestation ${bundlePath} ${isoPath}`,
      { capture: true }
    )

    return result.code === 0
  }

  /**
   * Display attestation metadata for a bundle.
   */
  async show(bundlePath: string): Promise<string> {
    if (!fs.existsSync(bundlePath)) {
      throw new Error(`Attestation bundle not found: ${bundlePath}`)
    }

    const result = await this.exec(`vouch show ${bundlePath}`, { capture: true })
    return result.data
  }
}
