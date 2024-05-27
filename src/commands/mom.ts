/**
 * penguins-eggs
 * command: mom.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command, Flags} from '@oclif/core'
import path from 'node:path'
import Utils from '../classes/utils'

import {exec} from '../lib/utils'

export default class Mom extends Command {
  static flags = {
    help: Flags.help({char: 'h'}),
  }

  static description = 'ask help from mommy - TUI helper'
  static examples = [
    'eggs mom',
  ]

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)
    // No sudo!
    if (process.getuid && process.getuid() === 0) {
      Utils.warning('You must to be kind with your mom! Call her without sudo')
      process.exit(0)
    }

    const cmd = path.resolve(__dirname, '../../scripts/mom.sh')
    await exec(cmd)
  }
}
