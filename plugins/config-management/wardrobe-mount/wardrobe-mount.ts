/**
 * plugins/config-management/wardrobe-mount/wardrobe-mount.ts
 * Mounts wardrobe repos via presslabs/gitfs with auto-commit.
 *
 * When mounted, any file changes in the wardrobe directory are
 * automatically committed and pushed to the remote repo.
 * Non-technical users can edit costumes without knowing git.
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export interface MountOptions {
  repoUrl: string
  mountpoint: string
  branch?: string
  remote?: string
  commitInterval?: number  // seconds between auto-commits
  pushInterval?: number    // seconds between auto-pushes
  user?: string
  password?: string
}

export class WardrobeMount {
  private exec: ExecFn
  private verbose: boolean

  constructor(exec: ExecFn, verbose = false) {
    this.exec = exec
    this.verbose = verbose
  }

  /**
   * Check if gitfs (presslabs) is installed.
   */
  async isInstalled(): Promise<boolean> {
    const result = await this.exec('command -v gitfs', { capture: true })
    return result.code === 0
  }

  /**
   * Install gitfs via pip.
   */
  async install(): Promise<void> {
    // Check for FUSE
    const fuseCheck = await this.exec('command -v fusermount', { capture: true })
    if (fuseCheck.code !== 0) {
      throw new Error('FUSE not installed. Install libfuse2 or fuse3 first.')
    }

    await this.exec('pip install gitfs', { echo: this.verbose })
  }

  /**
   * Mount a wardrobe repo with auto-commit enabled.
   */
  async mount(opts: MountOptions): Promise<void> {
    if (!(await this.isInstalled())) {
      throw new Error('gitfs not installed. Run: pip install gitfs')
    }

    // Create mountpoint if it doesn't exist
    if (!fs.existsSync(opts.mountpoint)) {
      fs.mkdirSync(opts.mountpoint, { recursive: true })
    }

    const args: string[] = [
      opts.repoUrl,
      opts.mountpoint,
    ]

    if (opts.branch) {
      args.push(`-o branch=${opts.branch}`)
    }

    if (opts.remote) {
      args.push(`-o remote_name=${opts.remote}`)
    }

    if (opts.commitInterval) {
      args.push(`-o commit_merge_timeout=${opts.commitInterval}`)
    }

    if (opts.pushInterval) {
      args.push(`-o push_merge_timeout=${opts.pushInterval}`)
    }

    // Allow other users to access the mount
    args.push('-o allow_other')

    // Set committer info
    args.push('-o commiter_name=penguins-eggs')
    args.push('-o commiter_email=eggs@localhost')

    const cmd = `gitfs ${args.join(' ')}`
    if (this.verbose) {
      console.log(`Mounting: ${cmd}`)
    }

    const result = await this.exec(cmd, { echo: this.verbose })
    if (result.code !== 0) {
      throw new Error(`Failed to mount: ${result.error}`)
    }

    console.log(`Wardrobe mounted at ${opts.mountpoint}`)
    console.log('Changes will auto-commit and push to the remote repo.')
  }

  /**
   * Unmount a wardrobe.
   */
  async unmount(mountpoint: string): Promise<void> {
    await this.exec(`fusermount -u "${mountpoint}"`, { echo: this.verbose })
    console.log(`Unmounted: ${mountpoint}`)
  }

  /**
   * List active gitfs mounts.
   */
  async listMounts(): Promise<string[]> {
    const result = await this.exec('mount | grep gitfs', { capture: true })
    if (result.code !== 0) return []
    return result.data.split('\n').filter(Boolean)
  }

  /**
   * Check if a mountpoint is active.
   */
  async isMounted(mountpoint: string): Promise<boolean> {
    const result = await this.exec(`mountpoint -q "${mountpoint}"`, { capture: true })
    return result.code === 0
  }
}
