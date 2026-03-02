/**
 * plugins/distribution/lfs-tracker/command-lfs.ts
 * oclif command: `eggs lfs`
 *
 * Manages git-lfs integration for ISO distribution.
 * Drop this into src/commands/ in the penguins-eggs repo.
 */

import { Args, Command, Flags } from '@oclif/core'
import path from 'node:path'

// These imports assume the plugin files are copied into the eggs source tree.
// Adjust paths as needed for your integration approach.
import { loadLfsConfig, saveLfsConfig } from '../../lib/integrations/lfs-config.js'
import { LfsTracker } from '../../lib/integrations/lfs-tracker.js'
import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'

export default class Lfs extends Command {
  static description = 'manage git-lfs tracking for produced ISOs'

  static examples = [
    'sudo eggs lfs track /home/eggs/egg-debian-amd64_2025-01-01.iso',
    'eggs lfs list /home/eggs',
    'sudo eggs lfs setup --server https://lfs.example.com',
    'sudo eggs lfs enable',
    'sudo eggs lfs disable',
  ]

  static args = {
    action: Args.string({
      description: 'action to perform',
      options: ['track', 'list', 'setup', 'enable', 'disable'],
      required: true,
    }),
    path: Args.string({
      description: 'ISO path (for track) or directory (for list)',
      required: false,
    }),
  }

  static flags = {
    help: Flags.help({ char: 'h' }),
    remote: Flags.string({ description: 'git remote name', default: 'origin' }),
    server: Flags.string({ description: 'LFS server URL (giftless, lfs-test-server, etc.)' }),
    verbose: Flags.boolean({ char: 'v' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Lfs)
    Utils.titles(this.id + ' ' + this.argv)

    const tracker = new LfsTracker(exec, flags.verbose)

    switch (args.action) {
      case 'track': {
        if (!args.path) {
          this.error('ISO path required for track action')
        }

        if (!Utils.isRoot()) {
          this.error('track requires root privileges')
        }

        const result = await tracker.track(args.path)
        if (result.committed) {
          this.log(`Committed: ${args.path}`)
          if (result.pushed) {
            this.log(`Pushed to remote`)
          }
        } else {
          this.warn('LFS tracking not enabled. Run: eggs lfs enable')
        }

        break
      }

      case 'list': {
        const dir = args.path || '/home/eggs'
        const files = await tracker.listTracked(dir)
        if (files.length === 0) {
          this.log('No LFS-tracked files found')
        } else {
          for (const f of files) {
            this.log(f)
          }
        }

        break
      }

      case 'setup': {
        if (!Utils.isRoot()) {
          this.error('setup requires root privileges')
        }

        const config = loadLfsConfig()
        if (flags.server) {
          config.server = flags.server
        }

        if (flags.remote) {
          config.remote = flags.remote
        }

        saveLfsConfig(config)
        this.log(`LFS config saved. Server: ${config.server || '(default)'}, Remote: ${config.remote}`)

        if (flags.server && args.path) {
          await tracker.configureServer(args.path, flags.server)
          this.log(`Configured LFS server for ${args.path}`)
        }

        break
      }

      case 'enable': {
        if (!Utils.isRoot()) {
          this.error('enable requires root privileges')
        }

        const config = loadLfsConfig()
        config.enabled = true
        saveLfsConfig(config)
        this.log('LFS tracking enabled. ISOs will be tracked after `eggs produce --lfs`')
        break
      }

      case 'disable': {
        if (!Utils.isRoot()) {
          this.error('disable requires root privileges')
        }

        const config = loadLfsConfig()
        config.enabled = false
        saveLfsConfig(config)
        this.log('LFS tracking disabled')
        break
      }
    }
  }
}
