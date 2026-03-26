/**
 * plugins/security-audit/os-hardening/os-hardening.ts
 *
 * Applies Opsek/OSs-security hardening scripts to eggs-produced chroots.
 * Audited by Sigma Prime.
 *
 * https://github.com/Opsek/OSs-security
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export type TargetOS = 'linux' | 'macos' | 'windows'

export interface HardeningOptions {
  chrootPath: string
  targetOS?: TargetOS
  dryRun?: boolean
}

export interface HardeningResult {
  applied: boolean
  dryRun: boolean
  targetOS: TargetOS
  output: string
}

const SCRIPTS_CACHE = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  'scripts'
)

export class OsHardening {
  private exec: ExecFn

  constructor(exec: ExecFn) {
    this.exec = exec
  }

  /**
   * Check whether the upstream scripts have been fetched.
   */
  scriptsAvailable(os: TargetOS = 'linux'): boolean {
    return fs.existsSync(path.join(SCRIPTS_CACHE, os))
  }

  /**
   * Fetch the OSs-security scripts from upstream via sparse checkout.
   * Only downloads the scripts for the requested OS to keep things lean.
   */
  async fetchScripts(os: TargetOS = 'linux'): Promise<void> {
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
      `git -C ${upstreamDir} sparse-checkout set ${os}`,
      { echo: true }
    )

    // Symlink the OS directory into the cache root for easy access
    const osLink = path.join(SCRIPTS_CACHE, os)
    if (!fs.existsSync(osLink)) {
      fs.symlinkSync(path.join(upstreamDir, os), osLink)
    }
  }

  /**
   * Apply hardening scripts to a chroot or live system path.
   */
  async applyHardening(opts: HardeningOptions): Promise<HardeningResult> {
    const os: TargetOS = opts.targetOS ?? 'linux'

    if (!this.scriptsAvailable(os)) {
      throw new Error(
        `Hardening scripts not found for ${os}. Run fetchScripts('${os}') first.`
      )
    }

    const scriptPath = path.join(SCRIPTS_CACHE, os, 'hardening.sh')

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
      targetOS: os,
      output: result.data,
    }
  }
}
