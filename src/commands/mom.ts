/**
 * ./src/commands/mom.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import path from 'node:path'

import Utils from '../classes/utils.js'
import { exec } from '../lib/utils.js'
// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

export default class Mom extends Command {
  static description = 'ask help from mommy - TUI helper'

  static examples = ['eggs mom']

  static flags = {
    help: Flags.help({ char: 'h' })
  }

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
