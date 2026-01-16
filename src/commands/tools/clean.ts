/**
 * ./src/commands/tools/clean.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'

import Bleach from '../../classes/bleach.js'
import Utils from '../../classes/utils.js'

export default class Clean extends Command {
  static description = 'clean system log, apt, etc'
static examples = ['sudo eggs tools clean']
static flags = {
    help: Flags.help({ char: 'h' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Clean)
    Utils.titles(this.id + ' ' + this.argv)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    const { nointeractive } = flags

    if (Utils.isRoot()) {
      if (nointeractive || (await Utils.customConfirm('Select yes to continue...'))) {
        const bleach = new Bleach()
        bleach.clean(verbose)
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
