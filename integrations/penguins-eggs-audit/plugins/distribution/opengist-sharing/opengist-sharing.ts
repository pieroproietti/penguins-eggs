/**
 * plugins/distribution/opengist-sharing/opengist-sharing.ts
 * Share and import wardrobe configurations via Opengist.
 *
 * Opengist (thomiceli/opengist) is a self-hosted pastebin powered by Git.
 * Each shared config is a git-backed gist with full version history.
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export interface GistConfig {
  serverUrl: string  // e.g. https://gist.example.com
  token?: string     // API token for authenticated operations
}

export interface SharedCostume {
  url: string
  title: string
  files: string[]
}

export class OpengistSharing {
  private exec: ExecFn
  private verbose: boolean
  private config: GistConfig

  constructor(exec: ExecFn, config: GistConfig, verbose = false) {
    this.exec = exec
    this.config = config
    this.verbose = verbose
  }

  /**
   * Share a wardrobe costume as a gist.
   * Bundles all files in the costume directory into a single gist.
   */
  async share(costumeDir: string, title?: string): Promise<SharedCostume> {
    if (!fs.existsSync(costumeDir)) {
      throw new Error(`Costume directory not found: ${costumeDir}`)
    }

    const costumeName = path.basename(costumeDir)
    const gistTitle = title || `eggs-costume: ${costumeName}`

    // Collect all files
    const files = this.collectFiles(costumeDir)
    if (files.length === 0) {
      throw new Error('No files found in costume directory')
    }

    // Create gist via API
    const gistData: Record<string, string> = {}
    for (const file of files) {
      const relativePath = path.relative(costumeDir, file).replace(/\//g, '_')
      gistData[relativePath] = fs.readFileSync(file, 'utf8')
    }

    const payload = JSON.stringify({
      title: gistTitle,
      files: Object.fromEntries(
        Object.entries(gistData).map(([name, content]) => [name, { content }])
      ),
      visibility: 'unlisted',
    })

    const authHeader = this.config.token
      ? `-H "Authorization: Bearer ${this.config.token}"`
      : ''

    const result = await this.exec(
      `curl -fsSL -X POST "${this.config.serverUrl}/api/v1/gists" ` +
      `${authHeader} ` +
      `-H "Content-Type: application/json" ` +
      `-d '${payload.replace(/'/g, "'\\''")}'`,
      { capture: true }
    )

    if (result.code !== 0) {
      throw new Error(`Failed to create gist: ${result.error}`)
    }

    const response = JSON.parse(result.data)
    return {
      url: response.html_url || `${this.config.serverUrl}/${response.id}`,
      title: gistTitle,
      files: Object.keys(gistData),
    }
  }

  /**
   * Import a shared costume from a gist URL.
   * Clones the gist (it's a git repo) and restructures into costume format.
   */
  async import(gistUrl: string, destDir: string): Promise<void> {
    // Opengist gists are git repos — clone directly
    const tmpDir = `/tmp/eggs-gist-${Date.now()}`

    try {
      await this.exec(`git clone "${gistUrl}" "${tmpDir}"`, { echo: this.verbose })

      fs.mkdirSync(destDir, { recursive: true })

      // Restore directory structure from flattened filenames
      const files = fs.readdirSync(tmpDir).filter(f => !f.startsWith('.'))
      for (const file of files) {
        const srcPath = path.join(tmpDir, file)
        // Convert underscores back to directory separators
        const restoredPath = file.replace(/_/g, '/')
        const destPath = path.join(destDir, restoredPath)

        fs.mkdirSync(path.dirname(destPath), { recursive: true })
        fs.copyFileSync(srcPath, destPath)
      }

      if (this.verbose) {
        console.log(`Imported ${files.length} files to ${destDir}`)
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  }

  /**
   * List gists from the server (public or user's).
   */
  async list(page = 1, perPage = 20): Promise<Array<{ id: string; title: string; url: string }>> {
    const authHeader = this.config.token
      ? `-H "Authorization: Bearer ${this.config.token}"`
      : ''

    const result = await this.exec(
      `curl -fsSL "${this.config.serverUrl}/api/v1/gists?page=${page}&per_page=${perPage}" ${authHeader}`,
      { capture: true }
    )

    if (result.code !== 0) return []

    const gists = JSON.parse(result.data)
    return gists.map((g: any) => ({
      id: g.id,
      title: g.title || g.description || 'Untitled',
      url: g.html_url || `${this.config.serverUrl}/${g.id}`,
    }))
  }

  /**
   * Search for eggs-related gists.
   */
  async search(query: string): Promise<Array<{ id: string; title: string; url: string }>> {
    const authHeader = this.config.token
      ? `-H "Authorization: Bearer ${this.config.token}"`
      : ''

    const result = await this.exec(
      `curl -fsSL "${this.config.serverUrl}/api/v1/gists/search?q=${encodeURIComponent(query)}" ${authHeader}`,
      { capture: true }
    )

    if (result.code !== 0) return []

    const gists = JSON.parse(result.data)
    return gists.map((g: any) => ({
      id: g.id,
      title: g.title || g.description || 'Untitled',
      url: g.html_url || `${this.config.serverUrl}/${g.id}`,
    }))
  }

  private collectFiles(dir: string): string[] {
    const files: string[] = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.name.startsWith('.')) continue

      if (entry.isDirectory()) {
        files.push(...this.collectFiles(fullPath))
      } else {
        files.push(fullPath)
      }
    }

    return files
  }
}
