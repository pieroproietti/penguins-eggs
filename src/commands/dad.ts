/**
 * penguins-eggs-v8
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command, Flags} from '@oclif/core'
import Utils from '../classes/utils.js'
import Daddy from '../classes/daddy.js'
import chalk from 'chalk'

import {exec} from '../lib/utils.js'

export default class Dad extends Command {
  static flags = {
    clean: Flags.boolean({char: 'c', description: 'remove old configuration before to create'}),
    default: Flags.boolean({char: 'd', description: 'remove old configuration and force default'}),
    help: Flags.help({char: 'h'}),
    verbose: Flags.boolean({char: 'v'}),
  }

  static description = 'ask help from daddy - TUI configuration helper'
  static examples = [
    'sudo dad',
    'sudo dad --clean',
    'sudo dad --default',
  ]

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)
    console.log(chalk.cyan('Daddy, what else did you leave for me?'))
    const {flags} = await this.parse(Dad)
    if (Utils.isRoot(this.id)) {
      if (flags.clean || flags.default) {
        await exec('rm /etc/penguins-eggs.d -rf')
      }

      const daddy = new Daddy()
      daddy.helpMe(flags.default, flags.verbose)
    } else {
      Utils.useRoot(this.id)
    }
  }
}
