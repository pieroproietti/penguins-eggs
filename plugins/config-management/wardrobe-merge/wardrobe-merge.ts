/**
 * plugins/config-management/wardrobe-merge/wardrobe-merge.ts
 * Merges multiple wardrobe repos into one, preserving git history.
 *
 * Uses:
 * - robinst/git-merge-repos (Java, full-featured) as primary
 * - swingbit/mergeGitRepos (Python, lightweight) as fallback
 * - Native git subtree merge as last resort
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export interface MergeSource {
  url: string
  name?: string       // subdirectory name in merged repo
  branch?: string
}

export class WardrobeMerge {
  private exec: ExecFn
  private verbose: boolean

  constructor(exec: ExecFn, verbose = false) {
    this.exec = exec
    this.verbose = verbose
  }

  /**
   * Detect available merge backend.
   */
  async detectBackend(): Promise<'git-merge-repos' | 'mergeGitRepos' | 'native'> {
    const gmr = await this.exec('command -v git-merge-repos', { capture: true })
    if (gmr.code === 0) return 'git-merge-repos'

    const mgr = await this.exec('command -v mergeGitRepos.py', { capture: true })
    if (mgr.code === 0) return 'mergeGitRepos'

    return 'native'
  }

  /**
   * Merge multiple wardrobe repos into a single repo.
   */
  async merge(sources: MergeSource[], destDir: string): Promise<void> {
    if (sources.length === 0) {
      throw new Error('No source repos provided')
    }

    if (fs.existsSync(destDir) && fs.readdirSync(destDir).length > 0) {
      throw new Error(`Destination ${destDir} is not empty`)
    }

    const backend = await this.detectBackend()
    if (this.verbose) {
      console.log(`Using merge backend: ${backend}`)
    }

    switch (backend) {
      case 'git-merge-repos':
        await this.mergeWithGitMergeRepos(sources, destDir)
        break
      case 'mergeGitRepos':
        await this.mergeWithMergeGitRepos(sources, destDir)
        break
      case 'native':
        await this.mergeNative(sources, destDir)
        break
    }

    console.log(`Merged ${sources.length} repos into ${destDir}`)
  }

  /**
   * robinst/git-merge-repos: Java-based, preserves all history/tags/branches.
   */
  private async mergeWithGitMergeRepos(sources: MergeSource[], destDir: string): Promise<void> {
    // git-merge-repos expects a config file
    const configLines: string[] = []
    for (const src of sources) {
      const name = src.name || path.basename(src.url, '.git')
      configLines.push(`${src.url} ${name}`)
    }

    const configPath = `/tmp/merge-config-${Date.now()}.txt`
    fs.writeFileSync(configPath, configLines.join('\n'))

    try {
      await this.exec(
        `git-merge-repos --config "${configPath}" --output "${destDir}"`,
        { echo: this.verbose }
      )
    } finally {
      fs.rmSync(configPath, { force: true })
    }
  }

  /**
   * swingbit/mergeGitRepos: Python script, simpler but handles branch mapping.
   */
  private async mergeWithMergeGitRepos(sources: MergeSource[], destDir: string): Promise<void> {
    fs.mkdirSync(destDir, { recursive: true })
    await this.exec(`git -C "${destDir}" init`, { echo: this.verbose })

    for (const src of sources) {
      const name = src.name || path.basename(src.url, '.git')
      const branch = src.branch || 'main'
      await this.exec(
        `mergeGitRepos.py "${destDir}" "${src.url}" "${name}" "${branch}"`,
        { echo: this.verbose }
      )
    }
  }

  /**
   * Native git subtree merge: works everywhere, no extra tools needed.
   */
  private async mergeNative(sources: MergeSource[], destDir: string): Promise<void> {
    fs.mkdirSync(destDir, { recursive: true })
    await this.exec(`git -C "${destDir}" init`, { echo: this.verbose })

    // Create initial empty commit
    await this.exec(
      `git -C "${destDir}" commit --allow-empty -m "wardrobe: initialize merged repo"`,
      { echo: this.verbose }
    )

    for (const src of sources) {
      const name = src.name || path.basename(src.url, '.git')
      const branch = src.branch || 'main'
      const remoteName = `source-${name}`

      // Add as remote
      await this.exec(
        `git -C "${destDir}" remote add "${remoteName}" "${src.url}"`,
        { echo: this.verbose }
      )

      // Fetch
      await this.exec(
        `git -C "${destDir}" fetch "${remoteName}" "${branch}"`,
        { echo: this.verbose }
      )

      // Merge using subtree strategy into subdirectory
      await this.exec(
        `git -C "${destDir}" merge -s ours --no-commit --allow-unrelated-histories "${remoteName}/${branch}"`,
        { echo: this.verbose }
      )

      await this.exec(
        `git -C "${destDir}" read-tree --prefix="${name}/" -u "${remoteName}/${branch}"`,
        { echo: this.verbose }
      )

      await this.exec(
        `git -C "${destDir}" commit -m "wardrobe: merge ${name} from ${src.url}"`,
        { echo: this.verbose }
      )

      // Remove temporary remote
      await this.exec(
        `git -C "${destDir}" remote remove "${remoteName}"`,
        { echo: this.verbose }
      )
    }
  }
}
