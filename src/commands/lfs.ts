/**
 * ./src/commands/lfs.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 *
 * Integration: manage git-lfs tracking for produced ISOs.
 */

import { Args, Command, Flags } from '@oclif/core'

import Utils from '../classes/utils.js'
import { exec } from '../lib/utils.js'

export default class Lfs extends Command {
  static description = 'manage git-lfs tracking for produced ISOs'

  static examples = [
    'sudo eggs lfs track /home/eggs/egg-debian-amd64.iso',
    'eggs lfs list /home/eggs',
    'sudo eggs lfs setup --server https://lfs.example.com',
    'sudo eggs lfs enable',
  ]

  static args = {
    action: Args.string({
      description: 'action: track, list, setup, enable, disable',
      options: ['track', 'list', 'setup', 'enable', 'disable'],
      required: true,
    }),
    path: Args.string({
      description: 'ISO path (track) or directory (list)',
      required: false,
    }),
  }

  static flags = {
    help: Flags.help({ char: 'h' }),
    remote: Flags.string({ description: 'git remote name', default: 'origin' }),
    server: Flags.string({ description: 'LFS server URL' }),
    verbose: Flags.boolean({ char: 'v' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Lfs)
    Utils.titles(this.id + ' ' + this.argv)

    const { LfsTracker, loadLfsConfig, saveLfsConfig } = await import('penguins-eggs-integrations/distribution')
    const tracker = new LfsTracker(exec, flags.verbose)

    switch (args.action) {
      case 'track': {
        if (!args.path) this.error('ISO path required')
        if (!Utils.isRoot()) this.error('track requires root')

        const result = await tracker.track(args.path)
        if (result.committed) {
          this.log(`Committed: ${args.path}`)
          if (result.pushed) this.log('Pushed to remote')
        } else {
          this.warn('LFS not enabled. Run: eggs lfs enable')
        }

        break
      }

      case 'list': {
        const dir = args.path || '/home/eggs'
        const files = await tracker.listTracked(dir)
        if (files.length === 0) {
          this.log('No LFS-tracked files')
        } else {
          for (const f of files) this.log(f)
        }

        break
      }

      case 'setup': {
        if (!Utils.isRoot()) this.error('setup requires root')
        const config = loadLfsConfig()
        if (flags.server) config.server = flags.server
        if (flags.remote) config.remote = flags.remote
        saveLfsConfig(config)
        this.log(`LFS config saved. Server: ${config.server || '(default)'}, Remote: ${config.remote}`)
        break
      }

      case 'enable': {
        if (!Utils.isRoot()) this.error('enable requires root')
        const config = loadLfsConfig()
        config.enabled = true
        saveLfsConfig(config)
        this.log('LFS tracking enabled')
        break
      }

      case 'disable': {
        if (!Utils.isRoot()) this.error('disable requires root')
        const config = loadLfsConfig()
        config.enabled = false
        saveLfsConfig(config)
        this.log('LFS tracking disabled')
        break
      }
    }
  }
}
