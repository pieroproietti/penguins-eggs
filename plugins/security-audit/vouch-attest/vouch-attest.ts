/**
 * plugins/security-audit/vouch-attest/vouch-attest.ts
 *
 * Cryptographic attestation for eggs ISO artifacts via mitchellh/vouch.
 * Signs ISOs after produce and verifies attestation bundles.
 *
 * https://github.com/mitchellh/vouch
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export interface VouchConfig {
  keyPath: string
  outputDir: string
}

export interface AttestResult {
  isoPath: string
  bundlePath: string
  success: boolean
}

export class VouchAttest {
  private exec: ExecFn

  constructor(exec: ExecFn) {
    this.exec = exec
  }

  /**
   * Check whether the vouch binary is on PATH.
   */
  async isAvailable(): Promise<boolean> {
    const result = await this.exec('command -v vouch', { capture: true })
    return result.code === 0
  }

  /**
   * Sign an ISO artifact and write the attestation bundle to outputDir.
   * Returns the path to the bundle file.
   */
  async attest(isoPath: string, config: VouchConfig): Promise<AttestResult> {
    if (!fs.existsSync(isoPath)) {
      throw new Error(`ISO not found: ${isoPath}`)
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

    return {
      isoPath,
      bundlePath,
      success: result.code === 0,
    }
  }

  /**
   * Verify an attestation bundle against an ISO.
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
   * Display attestation metadata for an ISO bundle.
   */
  async show(bundlePath: string): Promise<string> {
    if (!fs.existsSync(bundlePath)) {
      throw new Error(`Attestation bundle not found: ${bundlePath}`)
    }

    const result = await this.exec(
      `vouch show ${bundlePath}`,
      { capture: true }
    )

    return result.data
  }
}
