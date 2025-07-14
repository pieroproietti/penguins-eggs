/**
 * ./src/commands/kill.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'

import Settings from '../classes/settings.js'
import Utils from '../classes/utils.js'
import killMeSoftly from '../lib/kill_me_softly.js'

/**
 *
 */
export default class Kill extends Command {
  static description = 'kill the eggs/free the nest'

  static examples = ['sudo eggs kill']

  static flags = {
    help: Flags.help({ char: 'h' }),
    isos: Flags.boolean({ char: 'i', description: 'erase all ISOs on remote mount' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  config_file = '/etc/penguins-eggs.d/eggs.yaml' as string
  snapshot_dir = '' as string

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Kill)
    const { verbose } = flags
    const { isos } = flags
    const { nointeractive } = flags
    const echo = Utils.setEcho(verbose)

    if (Utils.isRoot()) {
      const settings = new Settings()
      await settings.load()
      await settings.listFreeSpace()
      if (Utils.isMountpoint(settings.config.snapshot_mnt)) {
        console.log('==========================================')
        Utils.warning('You are working on a mountpoint')
        console.log('==========================================')
      }

      if (nointeractive || (await Utils.customConfirm())) {
        await killMeSoftly(settings.config.snapshot_dir, settings.config.snapshot_mnt, isos)
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
