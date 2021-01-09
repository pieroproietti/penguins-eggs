/**
 * penguins-eggs-v8 
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
// import shx = require('shelljs')
const exec = require('../lib/utils').exec

// import { execute, pipe } from '@getvim/execute'
import path = require('path')
import Pacman from '../classes/pacman'

export default class Mom extends Command {
  static description = 'ask for mummy!'

  static flags = {
    help: flags.help({ char: 'h' }),
    cli: flags.boolean({ char: 'c', description: 'force cli version of mom' }),
  }

  async run() {
    const { flags } = this.parse(Mom)
    let mum = path.resolve(__dirname, `../../scripts/mom-cli.sh`)
    if (Pacman.isXInstalled()) {
      mum = path.resolve(__dirname, `../../scripts/mom.sh`)
    } 

    if (flags.cli) {
      mum = path.resolve(__dirname, `../../scripts/mom-cli.sh`)
    }
    exec(mum)    
  }
}
