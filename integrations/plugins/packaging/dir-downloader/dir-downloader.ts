/**
 * plugins/packaging/dir-downloader/dir-downloader.ts
 * Downloads specific directories from GitHub repos without cloning.
 * Inspired by Alex313031/github-directory-downloader.
 *
 * Used by `eggs wardrobe get-dir` to fetch individual costumes.
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export interface DirDownloadOptions {
  repoUrl: string       // e.g. https://github.com/pieroproietti/penguins-wardrobe
  dirPath: string       // e.g. costumes/colibri
  branch?: string       // default: main
  destDir: string       // local destination
}

export class DirDownloader {
  private exec: ExecFn
  private verbose: boolean

  constructor(exec: ExecFn, verbose = false) {
    this.exec = exec
    this.verbose = verbose
  }

  /**
   * Parse a GitHub URL with path into components.
   * Handles: https://github.com/user/repo/tree/branch/path/to/dir
   */
  static parseGitHubUrl(url: string): { owner: string; repo: string; branch: string; dirPath: string } | null {
    // Format: https://github.com/owner/repo/tree/branch/path
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+)\/(.+))?/)
    if (!match) return null

    return {
      owner: match[1],
      repo: match[2],
      branch: match[3] || 'main',
      dirPath: match[4] || '',
    }
  }

  /**
   * Download a directory using the GitHub API (Contents API).
   * Works without git clone — fetches only the requested directory.
   */
  async download(opts: DirDownloadOptions): Promise<string[]> {
    const parsed = DirDownloader.parseGitHubUrl(opts.repoUrl)
    if (!parsed && !opts.repoUrl.includes('github.com')) {
      throw new Error(`Unsupported URL format: ${opts.repoUrl}`)
    }

    const owner = parsed?.owner || this.extractOwner(opts.repoUrl)
    const repo = parsed?.repo || this.extractRepo(opts.repoUrl)
    const branch = opts.branch || parsed?.branch || 'main'
    const dirPath = opts.dirPath || parsed?.dirPath || ''

    if (!dirPath) {
      throw new Error('Directory path is required')
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`

    if (this.verbose) {
      console.log(`Fetching: ${apiUrl}`)
    }

    return this.downloadRecursive(owner, repo, branch, dirPath, opts.destDir)
  }

  /**
   * Alternative: use git sparse-checkout for larger directories.
   * More efficient for directories with many files.
   */
  async downloadSparse(opts: DirDownloadOptions): Promise<void> {
    const parsed = DirDownloader.parseGitHubUrl(opts.repoUrl)
    const owner = parsed?.owner || this.extractOwner(opts.repoUrl)
    const repo = parsed?.repo || this.extractRepo(opts.repoUrl)
    const branch = opts.branch || parsed?.branch || 'main'
    const dirPath = opts.dirPath || parsed?.dirPath || ''

    const repoUrl = `https://github.com/${owner}/${repo}.git`
    const tmpDir = `/tmp/eggs-sparse-${Date.now()}`

    try {
      await this.exec(`git clone --filter=blob:none --no-checkout --depth 1 --sparse "${repoUrl}" "${tmpDir}"`, { echo: this.verbose })
      await this.exec(`git -C "${tmpDir}" sparse-checkout set "${dirPath}"`, { echo: this.verbose })
      await this.exec(`git -C "${tmpDir}" checkout ${branch}`, { echo: this.verbose })

      // Copy the directory to destination
      const srcPath = path.join(tmpDir, dirPath)
      if (!fs.existsSync(srcPath)) {
        throw new Error(`Directory not found in repo: ${dirPath}`)
      }

      fs.mkdirSync(opts.destDir, { recursive: true })
      fs.cpSync(srcPath, opts.destDir, { recursive: true })

      if (this.verbose) {
        console.log(`Downloaded ${dirPath} to ${opts.destDir}`)
      }
    } finally {
      // Cleanup
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  }

  private async downloadRecursive(
    owner: string,
    repo: string,
    branch: string,
    dirPath: string,
    destDir: string
  ): Promise<string[]> {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`
    const result = await this.exec(`curl -fsSL "${apiUrl}"`, { capture: true })

    if (result.code !== 0) {
      throw new Error(`Failed to fetch ${dirPath}: ${result.error}`)
    }

    const items = JSON.parse(result.data)
    if (!Array.isArray(items)) {
      throw new Error(`${dirPath} is not a directory`)
    }

    fs.mkdirSync(destDir, { recursive: true })
    const downloaded: string[] = []

    for (const item of items) {
      const destPath = path.join(destDir, item.name)

      if (item.type === 'dir') {
        const subFiles = await this.downloadRecursive(owner, repo, branch, item.path, destPath)
        downloaded.push(...subFiles)
      } else if (item.type === 'file' && item.download_url) {
        await this.exec(`curl -fsSL "${item.download_url}" -o "${destPath}"`, { echo: this.verbose })
        downloaded.push(destPath)
      }
    }

    return downloaded
  }

  private extractOwner(url: string): string {
    const match = url.match(/github\.com\/([^/]+)/)
    return match?.[1] || ''
  }

  private extractRepo(url: string): string {
    const match = url.match(/github\.com\/[^/]+\/([^/]+)/)
    return match?.[1]?.replace('.git', '') || ''
  }
}
