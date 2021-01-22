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

  static description = 'ask help from daddy (gui interface)!'

  static flags = {
    help: flags.help({ char: 'h' }),
    verbose: flags.boolean({ char: 'v' }),
  }

  static args = [{ name: 'file' }]

  async run() {
    Utils.titles(this.id + ' ' + this.argv)
    console.log(chalk.cyan('Daddy, what else did you leave for me?'))
    const { args, flags } = this.parse(Dad)

    const daddy = new Daddy()
    daddy.helpMe(flags.verbose)
  }
}
