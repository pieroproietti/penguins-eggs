/**
 * ./src/commands/wardrobe/share.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 *
 * Integration: share/import wardrobe costumes via Opengist.
 */

import { Args, Command, Flags } from '@oclif/core'
import path from 'node:path'

import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'

export default class WardrobeShare extends Command {
  static description = 'share or import wardrobe costumes via Opengist'

  static examples = [
    'eggs wardrobe share ./costumes/my-custom --server https://gist.example.com',
    'eggs wardrobe import https://gist.example.com/abc123 --dest ~/.wardrobe/costumes/imported',
    'eggs wardrobe search "colibri" --server https://gist.example.com',
  ]

  static args = {
    action: Args.string({
      description: 'share, import, list, or search',
      options: ['share', 'import', 'list', 'search'],
      required: true,
    }),
    path: Args.string({
      description: 'costume dir (share), gist URL (import), or search query (search)',
      required: false,
    }),
  }

  static flags = {
    help: Flags.help({ char: 'h' }),
    server: Flags.string({ description: 'Opengist server URL', required: true }),
    token: Flags.string({ description: 'API token for authentication' }),
    dest: Flags.string({ char: 'd', description: 'destination directory (import)' }),
    title: Flags.string({ description: 'gist title (share)' }),
    verbose: Flags.boolean({ char: 'v' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(WardrobeShare)
    Utils.titles(this.id + ' ' + this.argv)

    const { OpengistSharing } = await import('penguins-eggs-integrations/distribution')
    const sharing = new OpengistSharing(
      exec,
      { serverUrl: flags.server, token: flags.token },
      flags.verbose
    )

    switch (args.action) {
      case 'share': {
        if (!args.path) this.error('Costume directory path required')
        this.log(`Sharing ${args.path}...`)
        const result = await sharing.share(args.path, flags.title)
        this.log(`Shared: ${result.url}`)
        this.log(`Files: ${result.files.length}`)
        break
      }

      case 'import': {
        if (!args.path) this.error('Gist URL required')
        const dest = flags.dest || path.join('.', 'imported-costume')
        this.log(`Importing from ${args.path}...`)
        await sharing.import(args.path, dest)
        this.log(`Imported to ${dest}`)
        break
      }

      case 'list': {
        const gists = await sharing.list()
        if (gists.length === 0) {
          this.log('No gists found')
        } else {
          for (const g of gists) {
            this.log(`  ${g.title} — ${g.url}`)
          }
        }

        break
      }

      case 'search': {
        if (!args.path) this.error('Search query required')
        const results = await sharing.search(args.path)
        if (results.length === 0) {
          this.log('No results found')
        } else {
          for (const g of results) {
            this.log(`  ${g.title} — ${g.url}`)
          }
        }

        break
      }
    }
  }
}
