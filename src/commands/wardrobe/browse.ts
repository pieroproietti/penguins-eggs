/**
 * ./src/commands/wardrobe/browse.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 *
 * Integration: read-only FUSE mount for browsing wardrobe revisions.
 */

import { Args, Command, Flags } from '@oclif/core'

import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'

export default class WardrobeBrowse extends Command {
  static description = 'browse wardrobe repo revisions via read-only FUSE mount'

  static examples = [
    'eggs wardrobe browse https://github.com/pieroproietti/penguins-wardrobe /mnt/browse',
    'ls /mnt/browse/by-tag/v1.0/costumes/',
  ]

  static args = {
    repo: Args.string({ description: 'repo URL or local path', required: true }),
    mountpoint: Args.string({ description: 'local mountpoint', required: true }),
  }

  static flags = {
    help: Flags.help({ char: 'h' }),
    backend: Flags.string({ description: 'gitfs backend: dsxack, jmillikin, jgitfs, auto', default: 'auto' }),
    verbose: Flags.boolean({ char: 'v' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(WardrobeBrowse)
    Utils.titles(this.id + ' ' + this.argv)

    const { WardrobeBrowse: Browser } = await import('penguins-eggs-integrations/config-management')
    const browser = new Browser(exec, flags.verbose)

    this.log(`Mounting ${args.repo} at ${args.mountpoint} (read-only)...`)
    await browser.mount(args.repo, args.mountpoint, flags.backend as any)
  }
}
