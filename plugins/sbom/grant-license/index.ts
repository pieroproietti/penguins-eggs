/**
 * grant-license: license compliance scanning for eggs ISO SBOMs
 * Upstream: https://github.com/anchore/grant
 */

import { execSync, ExecSyncOptionsWithStringEncoding } from 'child_process'
import * as fs from 'fs'

export interface GrantConfig {
  policyFile?: string   // path to .grant.yaml; defaults to repo root
  failOnDeny?: boolean  // throw if denied licenses found (default: true)
}

export interface LicenseCheckResult {
  passed: boolean
  output: string
}

/**
 * Check license compliance of an SBOM or ISO path against a grant policy.
 */
export function checkLicenses(
  target: string,
  config: GrantConfig = {}
): LicenseCheckResult {
  const policyFlag = config.policyFile
    ? `--config ${config.policyFile}`
    : ''

  const opts: ExecSyncOptionsWithStringEncoding = {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
  }

  try {
    const output = execSync(`grant check ${policyFlag} ${target}`, opts)
    return { passed: true, output }
  } catch (err: any) {
    const output: string = err.stdout ?? err.message ?? ''
    if (config.failOnDeny !== false) {
      throw new Error(`License policy violation:\n${output}`)
    }
    return { passed: false, output }
  }
}

/**
 * List all licenses found in a target (SBOM, container image, or directory).
 */
export function listLicenses(target: string): string {
  const opts: ExecSyncOptionsWithStringEncoding = {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'inherit'],
  }
  return execSync(`grant list ${target}`, opts)
}

/**
 * Write a default .grant.yaml policy file if one does not exist.
 */
export function initPolicy(outputPath = '.grant.yaml'): void {
  if (fs.existsSync(outputPath)) return

  const defaultPolicy = `# grant license policy
# See: https://github.com/anchore/grant
rules:
  - pattern: "GPL-3.0"
    mode: deny
  - pattern: "AGPL-3.0"
    mode: deny
  - pattern: "MIT"
    mode: allow
  - pattern: "Apache-2.0"
    mode: allow
  - pattern: "BSD-2-Clause"
    mode: allow
  - pattern: "BSD-3-Clause"
    mode: allow
`
  fs.writeFileSync(outputPath, defaultPolicy)
}
