/**
 * plugins/build-infra/btrfs-compat/command-btrfs-compat.ts
 * oclif command: `eggs btrfs-compat`
 */

import { Command, Flags } from '@oclif/core'
import { BtrfsCompat } from './btrfs-compat.js'

export default class BtrfsCompatCmd extends Command {
  static description = 'report Btrfs kernel feature compatibility for snapshot and compression operations'

  static examples = [
    'eggs btrfs-compat',
    'eggs btrfs-compat --verbose',
  ]

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', default: false }),
    json: Flags.boolean({ description: 'output as JSON', default: false }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(BtrfsCompatCmd)

    const exec = async (cmd: string, opts?: { capture?: boolean }) => {
      const { execSync } = await import('node:child_process')
      try {
        const data = execSync(cmd, { encoding: 'utf8', stdio: opts?.capture ? 'pipe' : 'inherit' })
        return { code: 0, data: data ?? '' }
      } catch (e: any) {
        return { code: e.status ?? 1, data: '', error: e.message }
      }
    }

    const compat = new BtrfsCompat(exec, flags.verbose)

    if (flags.json) {
      const kv = await compat.getKernelVersion()
      const features = await compat.detectFeatures()
      const warnings = await compat.validateSnapshotSupport()
      this.log(JSON.stringify({ kernel: kv, features, warnings }, null, 2))
    } else {
      const report = await compat.report()
      this.log(report)
    }
  }
}
