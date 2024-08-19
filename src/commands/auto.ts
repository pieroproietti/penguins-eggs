/**
 * ./src/commands/adapt.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import fs from 'fs'
import yaml from 'js-yaml'
import path from 'node:path'
import Utils from '../classes/utils.js'
import { exec } from '../lib/utils.js'
// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * 
 */
export default class Auto extends Command {
  static description = 'the simplest way to get an egg!'

  static examples = ['eggs auto']

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v' })
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Auto)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    const echo = Utils.setEcho(verbose)

    Utils.titles(this.id + ' ' + this.argv)
    const cmds = yaml.load(fs.readFileSync('/etc/penguins-eggs.d/auto.yaml', 'utf8')) as string[]

    console.log("The following commands will be executed:")
    console.log()
    for (const cmd of cmds) {
      console.log(`- ${cmd}`)
    }
    console.log()
    await Utils.customConfirm()
  }
}
