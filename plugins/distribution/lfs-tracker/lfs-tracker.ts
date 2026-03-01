/**
 * plugins/distribution/lfs-tracker/lfs-tracker.ts
 * Tracks produced ISOs in a git-lfs enabled repository.
 *
 * After `eggs produce`, this module:
 * 1. Initializes git-lfs in the snapshot directory if needed
 * 2. Tracks ISO/IMG patterns via git-lfs
 * 3. Commits the ISO pointer file
 * 4. Optionally pushes to a remote (giftless, lfs-test-server, or any LFS endpoint)
 */

import fs from 'node:fs'
import path from 'node:path'

import { ILfsConfig, loadLfsConfig } from './lfs-config.js'

interface ExecResult {
  code: number
  data: string
  error?: string
}

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<ExecResult>

export class LfsTracker {
  private config: ILfsConfig
  private exec: ExecFn
  private verbose: boolean

  constructor(exec: ExecFn, verbose = false) {
    this.config = loadLfsConfig()
    this.exec = exec
    this.verbose = verbose
  }

  /**
   * Check if git-lfs is installed on the system.
   */
  async isAvailable(): Promise<boolean> {
    const result = await this.exec('command -v git-lfs', { capture: true })
    return result.code === 0
  }

  /**
   * Initialize git-lfs in the given directory.
   * Creates a git repo if one doesn't exist.
   */
  async init(dir: string): Promise<void> {
    if (!fs.existsSync(path.join(dir, '.git'))) {
      await this.exec(`git -C ${dir} init`, { echo: this.verbose })
    }

    await this.exec(`git -C ${dir} lfs install`, { echo: this.verbose })

    for (const pattern of this.config.track_patterns) {
      await this.exec(`git -C ${dir} lfs track "${pattern}"`, { echo: this.verbose })
    }

    // Commit .gitattributes if it changed
    await this.exec(`git -C ${dir} add .gitattributes`, { echo: this.verbose })
    const status = await this.exec(`git -C ${dir} diff --cached --quiet .gitattributes`, { capture: true })
    if (status.code !== 0) {
      await this.exec(`git -C ${dir} commit -m "lfs: track ${this.config.track_patterns.join(', ')}"`, { echo: this.verbose })
    }
  }

  /**
   * Track a produced ISO file: stage, commit, and optionally push.
   */
  async track(isoPath: string): Promise<{ cid?: string; committed: boolean; pushed: boolean }> {
    if (!this.config.enabled) {
      return { committed: false, pushed: false }
    }

    if (!(await this.isAvailable())) {
      console.warn('git-lfs not found. Install it: https://git-lfs.com')
      return { committed: false, pushed: false }
    }

    const dir = path.dirname(isoPath)
    const filename = path.basename(isoPath)

    // Ensure LFS is initialized
    await this.init(dir)

    // Stage and commit the ISO
    await this.exec(`git -C ${dir} add "${filename}"`, { echo: this.verbose })

    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const commitMsg = `eggs: ${filename} ${timestamp}`
    await this.exec(`git -C ${dir} commit -m "${commitMsg}"`, { echo: this.verbose })

    let pushed = false
    if (this.config.auto_push && this.config.remote) {
      const pushResult = await this.exec(`git -C ${dir} push ${this.config.remote}`, { echo: this.verbose })
      pushed = pushResult.code === 0
    }

    return { committed: true, pushed }
  }

  /**
   * Configure a remote LFS server endpoint.
   * Supports giftless, lfs-test-server, or any LFS-compatible server.
   */
  async configureServer(dir: string, serverUrl: string): Promise<void> {
    await this.exec(`git -C ${dir} config lfs.url "${serverUrl}"`, { echo: this.verbose })
  }

  /**
   * List all LFS-tracked files in the repo.
   */
  async listTracked(dir: string): Promise<string[]> {
    const result = await this.exec(`git -C ${dir} lfs ls-files --name-only`, { capture: true })
    if (result.code !== 0) return []
    return result.data.split('\n').filter(Boolean)
  }
}
