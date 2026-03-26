/**
 * os-hardening: apply OS hardening scripts to eggs-produced chroots
 * Upstream: https://github.com/Opsek/OSs-security
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

export type TargetOS = 'linux' | 'macos' | 'windows'

export interface HardeningOptions {
  chrootPath: string
  targetOS?: TargetOS
  dryRun?: boolean
}

const SCRIPTS_DIR = path.join(__dirname, 'scripts')

/**
 * Apply OSs-security hardening scripts to a chroot or live system.
 * Pass dryRun: true to simulate without making changes.
 */
export function applyHardening(opts: HardeningOptions): void {
  const os: TargetOS = opts.targetOS ?? 'linux'
  const scriptPath = path.join(SCRIPTS_DIR, os, 'hardening.sh')

  if (!fs.existsSync(scriptPath)) {
    throw new Error(
      `Hardening script not found for ${os}. Run: eggs audit setup --os ${os}`
    )
  }

  const dryRunFlag = opts.dryRun ? '--dry-run' : ''
  execSync(`bash ${scriptPath} ${dryRunFlag} --chroot ${opts.chrootPath}`, {
    stdio: 'inherit',
  })
}

/**
 * Download the OSs-security scripts from upstream into the plugin scripts dir.
 */
export function setupScripts(os: TargetOS = 'linux'): void {
  fs.mkdirSync(path.join(SCRIPTS_DIR, os), { recursive: true })
  execSync(
    `git clone --depth 1 --filter=blob:none --sparse ` +
      `https://github.com/Opsek/OSs-security ${SCRIPTS_DIR}/upstream && ` +
      `cd ${SCRIPTS_DIR}/upstream && git sparse-checkout set ${os}`,
    { stdio: 'inherit' }
  )
}
