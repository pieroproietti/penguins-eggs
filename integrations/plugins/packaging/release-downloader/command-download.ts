/**
 * plugins/packaging/release-downloader/command-download.ts
 * oclif command: `eggs download`
 *
 * Downloads penguins-eggs releases from GitHub.
 * Wraps eggs-download.sh for integration into the eggs CLI.
 */

import { Command, Flags } from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'

import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'

export default class Download extends Command {
  static description = 'download penguins-eggs releases from GitHub'

  static examples = [
    'eggs download --latest',
    'eggs download --version 10.0.0',
    'eggs download --list',
  ]

  static flags = {
    help: Flags.help({ char: 'h' }),
    latest: Flags.boolean({ description: 'download latest release', default: true }),
    list: Flags.boolean({ char: 'l', description: 'list available releases' }),
    version: Flags.string({ char: 'V', description: 'specific version to download' }),
    dest: Flags.string({ char: 'd', description: 'destination directory', default: '.' }),
    verbose: Flags.boolean({ char: 'v' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Download)
    Utils.titles(this.id + ' ' + this.argv)

    const repo = 'pieroproietti/penguins-eggs'
    const apiUrl = `https://api.github.com/repos/${repo}/releases`

    if (flags.list) {
      await this.listReleases(apiUrl)
      return
    }

    const arch = this.detectArch()
    const format = this.detectFormat()
    const version = flags.version || 'latest'

    this.log(`Fetching ${version} release for ${arch} (${format})...`)

    const url = await this.getDownloadUrl(apiUrl, version, arch, format)
    if (!url) {
      this.error(`No matching release found for ${arch}/${format}`)
    }

    const filename = path.basename(url)
    const destPath = path.join(flags.dest, filename)

    const result = await exec(`curl -fSL --progress-bar "${url}" -o "${destPath}"`)
    if (result.code === 0) {
      this.log(`Downloaded: ${destPath}`)
    } else {
      this.error(`Download failed: ${result.error}`)
    }
  }

  private detectArch(): string {
    const arch = process.arch
    const map: Record<string, string> = {
      x64: 'amd64',
      arm64: 'arm64',
      arm: 'armhf',
      ia32: 'i386',
    }
    return map[arch] || arch
  }

  private detectFormat(): string {
    // Check for dpkg
    const dpkg = (exec as any)('command -v dpkg', { capture: true })
    // Simplified: default to deb on Linux
    return 'deb'
  }

  private async listReleases(apiUrl: string): Promise<void> {
    const result = await exec(`curl -fsSL "${apiUrl}?per_page=10"`, { capture: true })
    if (result.code !== 0) {
      this.error('Failed to fetch releases')
    }

    const releases = JSON.parse(result.data)
    this.log('Recent penguins-eggs releases:')
    for (const release of releases) {
      this.log(`  ${release.tag_name} - ${release.name || ''}`)
    }
  }

  private async getDownloadUrl(apiUrl: string, version: string, arch: string, format: string): Promise<string | null> {
    const url = version === 'latest' ? `${apiUrl}/latest` : `${apiUrl}/tags/v${version}`
    const result = await exec(`curl -fsSL "${url}"`, { capture: true })
    if (result.code !== 0) return null

    const release = JSON.parse(result.data)
    const pattern = format === 'deb'
      ? new RegExp(`penguins-eggs.*${arch}\\.deb$`, 'i')
      : new RegExp(`penguins-eggs.*\\.AppImage$`, 'i')

    const asset = release.assets?.find((a: any) => pattern.test(a.name))
    return asset?.browser_download_url || null
  }
}
