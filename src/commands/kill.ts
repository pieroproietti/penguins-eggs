/**
 * penguins-eggs
 * command: kill.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'
import Utils from '../classes/utils'
import Settings from '../classes/settings'
import killMeSoftly from '../lib/kill_me_softly'


/**
 * 
 */
export default class Kill extends Command {
  static flags = {
    help: Flags.help({ char: 'h' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
  }

  static description = 'kill the eggs/free the nest'
  static examples = [
    'sudo eggs kill',
  ]

  config_file = '/etc/penguins-eggs.d/eggs.yaml' as string
  snapshot_dir = '' as string
  

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Kill)
    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    const nointeractive = flags.nointeractive

    const echo = Utils.setEcho(verbose)

    if (Utils.isRoot()) {
      const settings = new Settings()
      await settings.load()
      await settings.listFreeSpace()
      if (nointeractive || await Utils.customConfirm()) {
        await killMeSoftly(settings.config.snapshot_dir, settings.config.snapshot_mnt)
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
