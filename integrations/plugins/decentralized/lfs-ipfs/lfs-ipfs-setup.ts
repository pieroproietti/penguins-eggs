/**
 * plugins/decentralized/lfs-ipfs/lfs-ipfs-setup.ts
 * Configures git-lfs-ipfs (sameer/git-lfs-ipfs) as the LFS transfer agent.
 *
 * When configured, `git lfs push` stores ISO blobs on IPFS instead of
 * a central server. `git lfs pull` retrieves them from IPFS.
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export class LfsIpfsSetup {
  private exec: ExecFn
  private verbose: boolean

  constructor(exec: ExecFn, verbose = false) {
    this.exec = exec
    this.verbose = verbose
  }

  /**
   * Check if git-lfs-ipfs binary is available.
   */
  async isInstalled(): Promise<boolean> {
    const result = await this.exec('command -v git-lfs-ipfs', { capture: true })
    return result.code === 0
  }

  /**
   * Check if IPFS daemon is running.
   */
  async isIpfsRunning(): Promise<boolean> {
    const result = await this.exec('ipfs id', { capture: true })
    return result.code === 0
  }

  /**
   * Configure git-lfs-ipfs as the transfer agent for a repository.
   *
   * Sets up .gitconfig and .lfsconfig so that:
   * - `git lfs push` stores objects on IPFS
   * - `git lfs pull` retrieves objects from IPFS
   */
  async configure(repoDir: string): Promise<void> {
    if (!(await this.isInstalled())) {
      throw new Error(
        'git-lfs-ipfs not found. Install from: https://github.com/sameer/git-lfs-ipfs\n' +
        '  cargo install git-lfs-ipfs'
      )
    }

    if (!(await this.isIpfsRunning())) {
      throw new Error('IPFS daemon not running. Start with: ipfs daemon')
    }

    // Configure the custom transfer agent
    await this.exec(
      `git -C "${repoDir}" config lfs.standalonetransferagent ipfs`,
      { echo: this.verbose }
    )
    await this.exec(
      `git -C "${repoDir}" config lfs.customtransfer.ipfs.path git-lfs-ipfs`,
      { echo: this.verbose }
    )
    await this.exec(
      `git -C "${repoDir}" config lfs.customtransfer.ipfs.concurrent true`,
      { echo: this.verbose }
    )

    // Create .lfsconfig if it doesn't exist
    const lfsConfigPath = path.join(repoDir, '.lfsconfig')
    if (!fs.existsSync(lfsConfigPath)) {
      fs.writeFileSync(lfsConfigPath, [
        '[lfs]',
        '  standalonetransferagent = ipfs',
        '',
      ].join('\n'))
    }

    if (this.verbose) {
      console.log(`Configured git-lfs-ipfs for ${repoDir}`)
    }
  }

  /**
   * Configure globally (for all repos).
   */
  async configureGlobal(): Promise<void> {
    if (!(await this.isInstalled())) {
      throw new Error('git-lfs-ipfs not found')
    }

    await this.exec(
      'git config --global lfs.standalonetransferagent ipfs',
      { echo: this.verbose }
    )
    await this.exec(
      'git config --global lfs.customtransfer.ipfs.path git-lfs-ipfs',
      { echo: this.verbose }
    )
    await this.exec(
      'git config --global lfs.customtransfer.ipfs.concurrent true',
      { echo: this.verbose }
    )
  }

  /**
   * Remove git-lfs-ipfs configuration from a repository.
   */
  async unconfigure(repoDir: string): Promise<void> {
    await this.exec(
      `git -C "${repoDir}" config --unset lfs.standalonetransferagent`,
      { echo: this.verbose }
    )
    await this.exec(
      `git -C "${repoDir}" config --remove-section lfs.customtransfer.ipfs`,
      { echo: this.verbose }
    )
  }

  /**
   * Verify the setup works by doing a test push/pull cycle.
   */
  async verify(repoDir: string): Promise<boolean> {
    // Create a small test file
    const testFile = path.join(repoDir, '.lfs-ipfs-test')
    fs.writeFileSync(testFile, `test-${Date.now()}`)

    try {
      await this.exec(`git -C "${repoDir}" lfs track ".lfs-ipfs-test"`, { echo: this.verbose })
      await this.exec(`git -C "${repoDir}" add .lfs-ipfs-test .gitattributes`, { echo: this.verbose })
      await this.exec(`git -C "${repoDir}" commit -m "lfs-ipfs: verify setup"`, { echo: this.verbose })

      // Check that the file is tracked by LFS
      const result = await this.exec(`git -C "${repoDir}" lfs ls-files`, { capture: true })
      return result.data.includes('.lfs-ipfs-test')
    } finally {
      // Cleanup
      fs.rmSync(testFile, { force: true })
      await this.exec(`git -C "${repoDir}" lfs untrack ".lfs-ipfs-test"`, { capture: true })
    }
  }
}
