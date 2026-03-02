/**
 * plugins/config-management/wardrobe-merge/command-wardrobe-merge.ts
 * oclif command: `eggs wardrobe merge`
 */

import { Args, Command, Flags } from '@oclif/core'

import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import { WardrobeMerge } from '../../../lib/integrations/wardrobe-merge.js'

export default class WardrobeMergeCmd extends Command {
  static description = 'merge multiple wardrobe repos into one, preserving history'

  static examples = [
    'eggs wardrobe merge https://github.com/user1/wardrobe https://github.com/user2/wardrobe --into ./merged',
    'eggs wardrobe merge repo1 repo2 repo3 --into /path/to/merged-wardrobe',
  ]

  static strict = false  // Allow variable number of args

  static args = {
    repos: Args.string({
      description: 'repository URLs to merge (space-separated)',
      required: true,
    }),
  }

  static flags = {
    help: Flags.help({ char: 'h' }),
    into: Flags.string({ description: 'destination directory for merged repo', required: true }),
    verbose: Flags.boolean({ char: 'v' }),
  }

  async run(): Promise<void> {
    const { argv, flags } = await this.parse(WardrobeMergeCmd)
    Utils.titles(this.id + ' ' + this.argv)

    const repos = argv as string[]
    if (repos.length < 2) {
      this.error('At least 2 repository URLs required')
    }

    const merger = new WardrobeMerge(exec, flags.verbose)
    const sources = repos.map(url => ({ url }))

    this.log(`Merging ${repos.length} repos into ${flags.into}...`)
    await merger.merge(sources, flags.into)
    this.log(`Merged wardrobe created at ${flags.into}`)
  }
}
