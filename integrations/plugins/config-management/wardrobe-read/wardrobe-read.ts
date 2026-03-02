/**
 * plugins/config-management/wardrobe-read/wardrobe-read.ts
 * Programmatic read access to wardrobe repos.
 *
 * Provides a TypeScript API for reading wardrobe contents from
 * remote git repos without cloning. Uses GitHub/Gitea API or
 * git archive for efficient access.
 *
 * Inspired by forensicanalysis/gitfs (Go io/fs.FS) and
 * gravypod/gitfs (read-only NFS mount).
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export interface WardrobeEntry {
  name: string
  path: string
  type: 'file' | 'dir'
  size?: number
  sha?: string
}

export interface CostumeInfo {
  name: string
  description?: string
  packages?: string[]
  files: WardrobeEntry[]
}

export class WardrobeRead {
  private exec: ExecFn
  private verbose: boolean

  constructor(exec: ExecFn, verbose = false) {
    this.exec = exec
    this.verbose = verbose
  }

  /**
   * List all costumes in a wardrobe repo.
   */
  async listCostumes(repoUrl: string, branch = 'main'): Promise<string[]> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl)
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/costumes?ref=${branch}`

    const result = await this.exec(`curl -fsSL "${apiUrl}"`, { capture: true })
    if (result.code !== 0) return []

    const items = JSON.parse(result.data)
    return items
      .filter((i: any) => i.type === 'dir')
      .map((i: any) => i.name)
  }

  /**
   * Read a specific costume's contents.
   */
  async readCostume(repoUrl: string, costumeName: string, branch = 'main'): Promise<CostumeInfo> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl)
    const costumePath = `costumes/${costumeName}`
    const files = await this.listDir(owner, repo, costumePath, branch)

    // Try to read the costume's index.yml or description
    let description: string | undefined
    let packages: string[] | undefined

    const indexFile = files.find(f => f.name === 'index.yml' || f.name === 'index.yaml')
    if (indexFile) {
      const content = await this.readFile(owner, repo, indexFile.path, branch)
      // Extract description from YAML
      const descMatch = content.match(/description:\s*(.+)/)
      if (descMatch) description = descMatch[1].trim()

      // Extract packages
      const pkgMatch = content.match(/packages:\n((?:\s+-\s+.+\n?)+)/)
      if (pkgMatch) {
        packages = pkgMatch[1]
          .split('\n')
          .map(l => l.replace(/^\s+-\s+/, '').trim())
          .filter(Boolean)
      }
    }

    return {
      name: costumeName,
      description,
      packages,
      files,
    }
  }

  /**
   * Read a file's content from the repo.
   */
  async readFile(owner: string, repo: string, filePath: string, branch = 'main'): Promise<string> {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`
    const result = await this.exec(`curl -fsSL "${rawUrl}"`, { capture: true })
    if (result.code !== 0) {
      throw new Error(`Failed to read ${filePath}`)
    }

    return result.data
  }

  /**
   * List directory contents via GitHub API.
   */
  async listDir(owner: string, repo: string, dirPath: string, branch = 'main'): Promise<WardrobeEntry[]> {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`
    const result = await this.exec(`curl -fsSL "${apiUrl}"`, { capture: true })
    if (result.code !== 0) return []

    const items = JSON.parse(result.data)
    if (!Array.isArray(items)) return []

    return items.map((i: any) => ({
      name: i.name,
      path: i.path,
      type: i.type === 'dir' ? 'dir' : 'file',
      size: i.size,
      sha: i.sha,
    }))
  }

  /**
   * Download a costume to a local directory using git archive (efficient).
   */
  async downloadCostume(repoUrl: string, costumeName: string, destDir: string, branch = 'main'): Promise<void> {
    fs.mkdirSync(destDir, { recursive: true })

    // git archive is the most efficient way to get a subdirectory
    const result = await this.exec(
      `git archive --remote="${repoUrl}" "${branch}" "costumes/${costumeName}" | tar -x -C "${destDir}"`,
      { echo: this.verbose }
    )

    if (result.code !== 0) {
      // Fallback: use the API-based approach
      const { owner, repo } = this.parseGitHubUrl(repoUrl)
      await this.downloadDirRecursive(owner, repo, `costumes/${costumeName}`, destDir, branch)
    }
  }

  /**
   * Compare two costume versions.
   */
  async diffCostumes(
    repoUrl: string,
    costumeName: string,
    ref1: string,
    ref2: string
  ): Promise<string> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl)
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/compare/${ref1}...${ref2}`
    const result = await this.exec(`curl -fsSL "${apiUrl}"`, { capture: true })
    if (result.code !== 0) return ''

    const data = JSON.parse(result.data)
    const costumeFiles = data.files?.filter((f: any) =>
      f.filename.startsWith(`costumes/${costumeName}/`)
    )

    return costumeFiles
      ?.map((f: any) => `${f.status}: ${f.filename}`)
      .join('\n') || 'No changes'
  }

  private async downloadDirRecursive(
    owner: string,
    repo: string,
    dirPath: string,
    destDir: string,
    branch: string
  ): Promise<void> {
    const items = await this.listDir(owner, repo, dirPath, branch)

    for (const item of items) {
      const destPath = path.join(destDir, item.path)

      if (item.type === 'dir') {
        fs.mkdirSync(destPath, { recursive: true })
        await this.downloadDirRecursive(owner, repo, item.path, destDir, branch)
      } else {
        const content = await this.readFile(owner, repo, item.path, branch)
        fs.mkdirSync(path.dirname(destPath), { recursive: true })
        fs.writeFileSync(destPath, content)
      }
    }
  }

  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^/]+)\/([^/.]+)/)
    if (!match) throw new Error(`Cannot parse GitHub URL: ${url}`)
    return { owner: match[1], repo: match[2] }
  }
}
