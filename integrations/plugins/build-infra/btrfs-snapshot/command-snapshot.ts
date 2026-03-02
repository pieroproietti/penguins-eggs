/**
 * plugins/build-infra/btrfs-snapshot/command-snapshot.ts
 * oclif command: `eggs snapshot`
 */

import { Args, Command, Flags } from '@oclif/core'

import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'
import { BtrfsSnapshot } from '../../lib/integrations/btrfs-snapshot.js'

export default class Snapshot extends Command {
  static description = 'manage BTRFS snapshots around ISO production'

  static examples = [
    'sudo eggs snapshot create pre-build',
    'sudo eggs snapshot list',
    'sudo eggs snapshot rollback pre-produce_2025-01-01T12-00-00',
    'sudo eggs snapshot delete old-snapshot',
  ]

  static args = {
    action: Args.string({
      description: 'action to perform',
      options: ['create', 'list', 'rollback', 'delete', 'diff'],
      required: true,
    }),
    name: Args.string({
      description: 'snapshot name (create/rollback/delete) or first snapshot (diff)',
      required: false,
    }),
    name2: Args.string({
      description: 'second snapshot name (diff only)',
      required: false,
    }),
  }

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Snapshot)
    Utils.titles(this.id + ' ' + this.argv)

    const snap = new BtrfsSnapshot(exec, flags.verbose)

    // Check BTRFS availability
    if (!(await snap.isBtrfs())) {
      this.warn('Root filesystem is not BTRFS. Snapshot features require BTRFS.')
      return
    }

    if (!Utils.isRoot()) {
      this.error('Snapshot operations require root privileges')
    }

    switch (args.action) {
      case 'create': {
        const name = args.name || `manual-${Date.now()}`
        const result = await snap.create(name)
        this.log(`Snapshot created: ${result.name}`)
        this.log(`  Path: ${result.path}`)
        break
      }

      case 'list': {
        const snapshots = await snap.list()
        if (snapshots.length === 0) {
          this.log('No snapshots found')
        } else {
          this.log('Snapshots:')
          for (const s of snapshots) {
            const meta = s.metadata ? ` [${Object.entries(s.metadata).map(([k, v]) => `${k}=${v}`).join(', ')}]` : ''
            this.log(`  ${s.name} (${s.timestamp})${meta}`)
          }
        }

        break
      }

      case 'rollback': {
        if (!args.name) this.error('Snapshot name required')
        await snap.rollback(args.name)
        break
      }

      case 'delete': {
        if (!args.name) this.error('Snapshot name required')
        await snap.delete(args.name)
        this.log(`Deleted: ${args.name}`)
        break
      }

      case 'diff': {
        if (!args.name || !args.name2) this.error('Two snapshot names required')
        const diff = await snap.diff(args.name, args.name2)
        this.log(diff || 'No differences')
        break
      }
    }
  }
}
