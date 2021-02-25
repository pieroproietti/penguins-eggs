/**
 * penguins-eggs-v8 
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import Utils from '../classes/utils'
import Daddy from '../classes/daddy'
import chalk = require('chalk')

const exec = require('../lib/utils').exec


export default class Dad extends Command {

  static description = 'ask help from daddy'

  static flags = {
    help: flags.help({ char: 'h' }),
    verbose: flags.boolean({ char: 'v' }),
  }

  async run() {
    Utils.titles(this.id + ' ' + this.argv)
    console.log(chalk.cyan('Daddy, what else did you leave for me?'))
    const { flags } = this.parse(Dad)
    if (Utils.isRoot(this.id)) {
      const daddy = new Daddy()
      daddy.helpMe(flags.verbose)
    }
  }
}
