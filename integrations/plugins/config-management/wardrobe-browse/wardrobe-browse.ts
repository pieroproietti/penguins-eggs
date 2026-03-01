/**
 * plugins/config-management/wardrobe-browse/wardrobe-browse.ts
 * Read-only FUSE mount for browsing wardrobe repo revisions.
 *
 * Supports multiple backends:
 * - dsxack/gitfs (Go) — branches/tags/commits as directories
 * - jmillikin/gitfs (Rust) — by tag/branch/commit
 * - centic9/JGitFS (Java) — JVM-based alternative
 *
 * Exposes:
 *   <mountpoint>/by-tag/v1.0/costumes/colibri/
 *   <mountpoint>/by-branch/main/costumes/colibri/
 *   <mountpoint>/by-commit/<sha>/costumes/colibri/
 */

import fs from 'node:fs'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export type GitFsBackend = 'dsxack' | 'jmillikin' | 'jgitfs' | 'auto'

export class WardrobeBrowse {
  private exec: ExecFn
  private verbose: boolean

  constructor(exec: ExecFn, verbose = false) {
    this.exec = exec
    this.verbose = verbose
  }

  /**
   * Detect which gitfs backend is available.
   */
  async detectBackend(): Promise<GitFsBackend | null> {
    // Check dsxack/gitfs (Go binary)
    const dsxack = await this.exec('command -v gitfs-browse', { capture: true })
    if (dsxack.code === 0) return 'dsxack'

    // Check jmillikin/gitfs (Rust binary)
    const jmillikin = await this.exec('command -v gitfs-rust', { capture: true })
    if (jmillikin.code === 0) return 'jmillikin'

    // Check JGitFS (Java)
    const jgitfs = await this.exec('command -v jgitfs', { capture: true })
    if (jgitfs.code === 0) return 'jgitfs'

    return null
  }

  /**
   * Mount a wardrobe repo read-only with revision browsing.
   */
  async mount(repoPath: string, mountpoint: string, backend: GitFsBackend = 'auto'): Promise<void> {
    if (!fs.existsSync(mountpoint)) {
      fs.mkdirSync(mountpoint, { recursive: true })
    }

    const selectedBackend = backend === 'auto' ? await this.detectBackend() : backend
    if (!selectedBackend) {
      throw new Error(
        'No gitfs browse backend found. Install one of:\n' +
        '  - dsxack/gitfs: go install github.com/dsxack/gitfs@latest\n' +
        '  - jmillikin/gitfs: cargo install gitfs\n' +
        '  - centic9/JGitFS: download from GitHub releases'
      )
    }

    // Clone repo locally if it's a URL
    let localRepo = repoPath
    if (repoPath.startsWith('http') || repoPath.startsWith('git@')) {
      localRepo = `/tmp/wardrobe-browse-${Date.now()}`
      await this.exec(`git clone --bare "${repoPath}" "${localRepo}"`, { echo: this.verbose })
    }

    switch (selectedBackend) {
      case 'dsxack':
        await this.mountDsxack(localRepo, mountpoint)
        break
      case 'jmillikin':
        await this.mountJmillikin(localRepo, mountpoint)
        break
      case 'jgitfs':
        await this.mountJgitfs(localRepo, mountpoint)
        break
    }

    console.log(`Wardrobe mounted read-only at ${mountpoint} (backend: ${selectedBackend})`)
    console.log('Browse revisions:')
    console.log(`  ls ${mountpoint}/`)
  }

  /**
   * Unmount.
   */
  async unmount(mountpoint: string): Promise<void> {
    await this.exec(`fusermount -u "${mountpoint}"`, { echo: this.verbose })
  }

  /**
   * dsxack/gitfs: Go-based, exposes branches/tags/commits as directories.
   */
  private async mountDsxack(repoPath: string, mountpoint: string): Promise<void> {
    await this.exec(
      `gitfs-browse mount "${repoPath}" "${mountpoint}" &`,
      { echo: this.verbose }
    )
  }

  /**
   * jmillikin/gitfs: Rust-based, exposes by tag/branch/commit.
   */
  private async mountJmillikin(repoPath: string, mountpoint: string): Promise<void> {
    await this.exec(
      `gitfs-rust "${repoPath}" "${mountpoint}" &`,
      { echo: this.verbose }
    )
  }

  /**
   * centic9/JGitFS: Java-based.
   */
  private async mountJgitfs(repoPath: string, mountpoint: string): Promise<void> {
    await this.exec(
      `jgitfs "${repoPath}" "${mountpoint}" &`,
      { echo: this.verbose }
    )
  }
}
