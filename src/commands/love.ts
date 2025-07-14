/**
 * ./src/commands/adapt.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import yaml from 'js-yaml'
import fs from 'node:fs'
import path from 'node:path'

import Utils from '../classes/utils.js'
import { exec } from '../lib/utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 *
 */
export default class Love extends Command {
  static description = 'the simplest way to get an egg!'

  static examples = ['eggs auto']

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Love)

    let verbose = false
    let flagVerbose = ''
    if (flags.verbose) {
      verbose = true
      flagVerbose = '--verbose'
    }

    let nointeractive = false
    let flagNointeractive = ''
    if (flags.nointeractive) {
      nointeractive = true
      flagNointeractive = '--nointeractive'
    }

    const echo = Utils.setEcho(verbose)
    Utils.titles(this.id + ' ' + this.argv)

    let cmdSudo = ''
    if (process.getuid && process.getuid() === 0) {
      cmdSudo = ''
    } else if (fs.existsSync('/usr/bin/sudo')) {
      cmdSudo = 'sudo'
    } else if (fs.existsSync('/usr/bin/doas')) {
      cmdSudo = 'doas'
    }
      
    let loveConf='/etc/penguins-eggs.d/love.yaml'
    if (!fs.existsSync(loveConf)) {
      loveConf=__dirname + '/../../conf/love.yaml'
    }
    const cmds = yaml.load(fs.readFileSync(loveConf, 'utf8')) as string[]

    console.log('The following commands will be executed:')
    console.log()
    for (const cmd of cmds) {
      console.log(`- ${cmdSudo} ${cmd} ${flagVerbose} ${flagNointeractive}`)
    }

    console.log()
    if (nointeractive || await Utils.customConfirm()) {
      for (const cmd of cmds) {
        await exec(`${cmdSudo} ${cmd} ${flagVerbose} ${flagNointeractive}`)
      }
    } else {
      console.log('Aborted!')
    }
  }
}
