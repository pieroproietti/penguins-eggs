/**
 * penguins-eggs-v8 
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
const exec = require('../lib/utils').exec

import path = require('path')
import Pacman from '../classes/pacman'
import Utils from  '../classes/utils'

export default class Mom extends Command {
  static description = 'ask for mommy'

  static flags = {
    help: flags.help({ char: 'h' }),
  }

  async run() {
    Utils.titles(this.id + ' ' + this.argv)
    // No sudo!
    if (process.getuid && process.getuid() === 0) {
      Utils.warning('You must to be kind with your mom! Call her without sudo')
      process.exit(0)
    }
    const mum = path.resolve(__dirname, `../../scripts/mom-cli.sh`)
    exec(mum)
  }
}
