/**
 * ./src/commands/wardrobe/merge.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 *
 * Integration: merges multiple wardrobe repos into one.
 */

import { Command, Flags } from '@oclif/core'

import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'

export default class WardrobeMerge extends Command {
  static description = 'merge multiple wardrobe repos into one, preserving history'

  static strict = false

  static examples = [
    'eggs wardrobe merge https://github.com/user1/wardrobe https://github.com/user2/wardrobe --into ./merged',
  ]

  static flags = {
    help: Flags.help({ char: 'h' }),
    into: Flags.string({ description: 'destination directory for merged repo', required: true }),
    verbose: Flags.boolean({ char: 'v' }),
  }

  async run(): Promise<void> {
    const { argv, flags } = await this.parse(WardrobeMerge)
    Utils.titles(this.id + ' ' + this.argv)

    const repos = argv as string[]
    if (repos.length < 2) {
      this.error('At least 2 repository URLs required')
    }

    const { WardrobeMerge: Merger } = await import('penguins-eggs-integrations/config-management')
    const merger = new Merger(exec, flags.verbose)
    const sources = repos.map(url => ({ url }))

    this.log(`Merging ${repos.length} repos into ${flags.into}...`)
    await merger.merge(sources, flags.into)
    this.log(`Merged wardrobe created at ${flags.into}`)
  }
}
