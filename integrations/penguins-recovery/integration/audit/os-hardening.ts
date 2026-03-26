/**
 * integration/audit/os-hardening.ts
 *
 * Applies Opsek/OSs-security hardening scripts to the recovery environment
 * chroot before it is packaged into an ISO.
 *
 * Adapted from penguins-eggs-audit/plugins/security-audit/os-hardening.
 * https://github.com/Opsek/OSs-security
 *
 * Usage (from a penguins-recovery builder before ISO packaging):
 *
 *   const hardening = new RecoveryHardening(execFn)
 *   await hardening.fetchScripts()
 *   const result = await hardening.applyHardening({
 *     chrootPath: '/var/tmp/recovery-chroot',
 *     dryRun: false,
 *   })
 *   console.log('Hardening applied:', result.applied)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export interface RecoveryHardeningOptions {
  /** Path to the recovery chroot to harden. */
  chrootPath: string
  /** If true, run in dry-run mode (no changes applied). Default: false. */
  dryRun?: boolean
}

export interface RecoveryHardeningResult {
  applied: boolean
  dryRun: boolean
  output: string
}

const SCRIPTS_CACHE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'scripts',
  'os-hardening'
)

export class RecoveryHardening {
  private exec: ExecFn

  constructor(exec: ExecFn) {
    this.exec = exec
  }

  /**
   * Check whether the hardening scripts have been fetched locally.
   */
  scriptsAvailable(): boolean {
    return fs.existsSync(path.join(SCRIPTS_CACHE, 'linux'))
  }

  /**
   * Fetch the OSs-security Linux scripts from upstream via sparse checkout.
   * Only downloads the Linux scripts — recovery environments are always Linux.
   */
  async fetchScripts(): Promise<void> {
    fs.mkdirSync(SCRIPTS_CACHE, { recursive: true })

    const upstreamDir = path.join(SCRIPTS_CACHE, 'upstream')

    if (!fs.existsSync(upstreamDir)) {
      await this.exec(
        `git clone --depth 1 --filter=blob:none --sparse ` +
        `https://github.com/Opsek/OSs-security ${upstreamDir}`,
        { echo: true }
      )
    }

    await this.exec(
      `git -C ${upstreamDir} sparse-checkout set linux`,
      { echo: true }
    )

    const osLink = path.join(SCRIPTS_CACHE, 'linux')
    let linkExists = false
    try {
      fs.lstatSync(osLink)
      linkExists = true
    } catch {
      linkExists = false
    }
    if (!linkExists) {
      fs.symlinkSync(path.join(upstreamDir, 'linux'), osLink)
    }
  }

  /**
   * Apply Linux hardening scripts to the recovery chroot.
   * The chroot is the recovery environment filesystem before ISO packaging.
   */
  async applyHardening(opts: RecoveryHardeningOptions): Promise<RecoveryHardeningResult> {
    if (!this.scriptsAvailable()) {
      throw new Error(
        'Hardening scripts not found. Run fetchScripts() first.'
      )
    }

    const scriptPath = path.join(SCRIPTS_CACHE, 'linux', 'hardening.sh')

    if (!fs.existsSync(scriptPath)) {
      throw new Error(`hardening.sh not found at ${scriptPath}`)
    }

    const dryRunFlag = opts.dryRun ? '--dry-run' : ''
    const result = await this.exec(
      `bash ${scriptPath} ${dryRunFlag} --chroot ${opts.chrootPath}`,
      { echo: true, capture: true }
    )

    return {
      applied: result.code === 0,
      dryRun: opts.dryRun ?? false,
      output: result.data,
    }
  }
}
