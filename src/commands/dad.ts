/**
 * ./src/commands/dad.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import fs from 'node:fs'

import Daddy from '../classes/daddy.js'
import Utils from '../classes/utils.js'
import { exec } from '../lib/utils.js'

export default class Dad extends Command {
  static description = 'ask help from daddy - TUI configuration helper'
  static examples = ['sudo dad', 'sudo dad --clean', 'sudo dad --default']
  static flags = {
    clean: Flags.boolean({ char: 'c', description: 'remove old configuration before to create' }),
    default: Flags.boolean({ char: 'd', description: 'reset to default values' }),
    file: Flags.string({ char: 'f', description: 'use a file configuration custom' }),
    help: Flags.help({ char: 'h' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
    verbose: Flags.boolean({ char: 'v' })
  }

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)
    console.log(chalk.cyan('Daddy, what else did you leave for me?'))
    const { flags } = await this.parse(Dad)

    const fileCustom = flags.file
    const isCustom = fileCustom !== undefined && fileCustom !== ''
    const reset = flags.default

    if (Utils.isRoot(this.id)) {
      if (flags.clean || flags.default || flags.mine) {
        await exec('rm /etc/penguins-eggs.d -rf')
      }

      if (isCustom && !fs.existsSync(fileCustom)) {
        console.log(chalk.red(`Custom configuration file: ${flags.custom} not found!`))
        process.exit(1)
      }

      const daddy = new Daddy()
      daddy.helpMe(reset, isCustom, fileCustom, flags.verbose)
    } else {
      Utils.useRoot(this.id)
    }
  }
}
