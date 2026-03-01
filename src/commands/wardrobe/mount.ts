/**
 * ./src/commands/wardrobe/mount.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 *
 * Integration: mounts wardrobe repos via gitfs with auto-commit.
 */

import { Args, Command, Flags } from '@oclif/core'

import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'

export default class WardrobeMount extends Command {
  static description = 'mount a wardrobe repo with auto-commit via gitfs'

  static examples = [
    'eggs wardrobe mount https://github.com/pieroproietti/penguins-wardrobe /mnt/wardrobe',
    'eggs wardrobe unmount /mnt/wardrobe',
    'eggs wardrobe mounts',
  ]

  static args = {
    action: Args.string({
      description: 'mount, unmount, or mounts (list)',
      options: ['mount', 'unmount', 'mounts'],
      required: true,
    }),
    source: Args.string({
      description: 'repo URL (mount) or mountpoint (unmount)',
      required: false,
    }),
    mountpoint: Args.string({
      description: 'local mountpoint directory',
      required: false,
    }),
  }

  static flags = {
    help: Flags.help({ char: 'h' }),
    branch: Flags.string({ char: 'b', description: 'branch to mount', default: 'main' }),
    interval: Flags.integer({ description: 'auto-commit interval in seconds', default: 30 }),
    verbose: Flags.boolean({ char: 'v' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(WardrobeMount)
    Utils.titles(this.id + ' ' + this.argv)

    const { WardrobeMount: Mounter } = await import('penguins-eggs-integrations/config-management')
    const mounter = new Mounter(exec, flags.verbose)

    switch (args.action) {
      case 'mount': {
        if (!args.source || !args.mountpoint) {
          this.error('Usage: eggs wardrobe mount <repo-url> <mountpoint>')
        }

        await mounter.mount({
          repoUrl: args.source,
          mountpoint: args.mountpoint,
          branch: flags.branch,
          commitInterval: flags.interval,
          pushInterval: flags.interval * 2,
        })
        break
      }

      case 'unmount': {
        if (!args.source) {
          this.error('Usage: eggs wardrobe unmount <mountpoint>')
        }

        await mounter.unmount(args.source)
        break
      }

      case 'mounts': {
        const mounts = await mounter.listMounts()
        if (mounts.length === 0) {
          this.log('No active wardrobe mounts')
        } else {
          this.log('Active wardrobe mounts:')
          for (const m of mounts) {
            this.log(`  ${m}`)
          }
        }

        break
      }
    }
  }
}
