/**
 * ./src/commands/wardrobe/get-dir.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 *
 * Integration: download a specific wardrobe directory without cloning.
 */

import { Args, Command, Flags } from '@oclif/core'
import path from 'node:path'

import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'

export default class WardrobeGetDir extends Command {
  static description = 'download a specific wardrobe directory without cloning the full repo'

  static examples = [
    'eggs wardrobe get-dir https://github.com/pieroproietti/penguins-wardrobe/tree/main/costumes/colibri',
    'eggs wardrobe get-dir --repo https://github.com/pieroproietti/penguins-wardrobe --path costumes/colibri',
  ]

  static args = {
    url: Args.string({
      description: 'GitHub URL to directory',
      required: false,
    }),
  }

  static flags = {
    help: Flags.help({ char: 'h' }),
    repo: Flags.string({ description: 'repository URL' }),
    path: Flags.string({ description: 'directory path within repo' }),
    branch: Flags.string({ description: 'branch name', default: 'main' }),
    dest: Flags.string({ char: 'd', description: 'destination directory' }),
    sparse: Flags.boolean({ description: 'use git sparse-checkout (faster for large dirs)' }),
    verbose: Flags.boolean({ char: 'v' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(WardrobeGetDir)
    Utils.titles(this.id + ' ' + this.argv)

    const { DirDownloader } = await import('penguins-eggs-integrations/packaging')

    const downloader = new DirDownloader(exec, flags.verbose)

    let repoUrl: string
    let dirPath: string
    let branch = flags.branch || 'main'

    if (args.url) {
      const parsed = DirDownloader.parseGitHubUrl(args.url)
      if (!parsed) {
        this.error('Invalid GitHub URL. Expected: https://github.com/owner/repo/tree/branch/path')
      }

      repoUrl = `https://github.com/${parsed.owner}/${parsed.repo}`
      dirPath = parsed.dirPath
      branch = parsed.branch
    } else if (flags.repo && flags.path) {
      repoUrl = flags.repo
      dirPath = flags.path
    } else {
      this.error('Provide either a full GitHub URL or --repo and --path flags')
    }

    const destDir = flags.dest || path.join('.', path.basename(dirPath))

    this.log(`Downloading ${dirPath} from ${repoUrl} (${branch})...`)

    if (flags.sparse) {
      await downloader.downloadSparse({ repoUrl, dirPath, branch, destDir })
    } else {
      const files = await downloader.download({ repoUrl, dirPath, branch, destDir })
      this.log(`Downloaded ${files.length} files to ${destDir}`)
    }
  }
}
