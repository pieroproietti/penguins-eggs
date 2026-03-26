/**
 * plugins/security-audit/linux-suite/linux-suite.ts
 *
 * Bundles Nerds489/ultimate-linux-suite into eggs costumes.
 * Provides a unified CLI for Linux install, configuration, and hardening.
 *
 * https://github.com/Nerds489/ultimate-linux-suite
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

const SUITE_REPO = 'https://github.com/Nerds489/ultimate-linux-suite'
const SUITE_CACHE = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  'suite'
)

export interface InstallResult {
  success: boolean
  binaryPath: string
}

export class LinuxSuite {
  private exec: ExecFn

  constructor(exec: ExecFn) {
    this.exec = exec
  }

  /**
   * Check whether the suite has been fetched locally.
   */
  isFetched(): boolean {
    return fs.existsSync(path.join(SUITE_CACHE, 'unified.sh'))
  }

  /**
   * Clone or update the upstream suite repository.
   */
  async fetch(): Promise<void> {
    if (fs.existsSync(SUITE_CACHE)) {
      await this.exec(`git -C ${SUITE_CACHE} pull`, { echo: true })
    } else {
      await this.exec(
        `git clone --depth 1 ${SUITE_REPO} ${SUITE_CACHE}`,
        { echo: true }
      )
    }
  }

  /**
   * Install the suite binary into a costume directory so it is
   * included in the produced ISO.
   */
  async installIntoCostume(costumePath: string): Promise<InstallResult> {
    if (!this.isFetched()) {
      throw new Error('Suite not fetched. Call fetch() first.')
    }

    const dest = path.join(costumePath, 'usr', 'local', 'bin')
    fs.mkdirSync(dest, { recursive: true })

    const binaryPath = path.join(dest, 'unified')
    fs.copyFileSync(path.join(SUITE_CACHE, 'unified.sh'), binaryPath)

    await this.exec(`chmod +x ${binaryPath}`, { echo: true })

    return { success: true, binaryPath }
  }

  /**
   * Run the suite interactively (for testing outside of a costume).
   */
  async run(args: string[] = []): Promise<{ code: number; data: string }> {
    if (!this.isFetched()) {
      throw new Error('Suite not fetched. Call fetch() first.')
    }

    return this.exec(
      `bash ${path.join(SUITE_CACHE, 'unified.sh')} ${args.join(' ')}`,
      { echo: true, capture: true }
    )
  }
}
