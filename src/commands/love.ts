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
  static examples = ['eggs love']
  static flags = {
    clone: Flags.boolean({ char: 'c', description: 'clone (uncrypted)' }),
    dtbdir: Flags.string({ description: 'path to Device Tree Blobs (DTB) directory' }),
    fullcrypt: Flags.boolean({ char: 'f', description: 'clone crypted full' }),
    help: Flags.help({ char: 'h' }),
    hidden: Flags.boolean({ char: 'H', description: 'stealth mode' }),
    homecrypt: Flags.boolean({ char: 'k', description: 'clone crypted home' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
    verbose: Flags.boolean({ char: 'v' })
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Love)

    let verbose = false
    let flagVerbose = ''
    if (flags.verbose) {
      verbose = true
      flagVerbose = '--verbose'
    }

    let hidden = false
    let flagHidden = ''
    if (flags.hidden) {
      hidden = true
      flagHidden = '--hidden'
    }

    let clone = false
    if (flags.clone) {
      clone = true
    }

    let homecrypt = false
    if (flags.homecrypt) {
      clone = false
      homecrypt = true
    }

    let flagDtbdir = ''
    if (flags.dtbdir) {
      flagDtbdir = `--dtbdir ${flags.dtbdir}`
    }

    let fullcrypt = false
    if (flags.fullcrypt) {
      fullcrypt = true
      clone = false
      homecrypt = false
    }

    let flagClone = ''
    if (clone) {
      flagClone = '--clone'
    } else if (homecrypt) {
      flagClone = '--homecrypt'
    } else if (fullcrypt) {
      flagClone = '--fullcrypt'
    }

    let nointeractive = false
    let flagNointeractive = ''
    if (flags.nointeractive) {
      flagNointeractive = '--nointeractive'
      nointeractive = true
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

    let loveConf = '/etc/penguins-eggs.d/love.yaml'
    if (!fs.existsSync(loveConf)) {
      loveConf = __dirname + '/../../conf/love.yaml'
    }

    const cmds = yaml.load(fs.readFileSync(loveConf, 'utf8')) as string[]

    console.log('The following commands will be executed:')
    console.log()
    for (const cmd of cmds) {
      if (cmd.includes('produce')) {
        console.log(`- ${cmdSudo} ${cmd} ${flagHidden} ${flagVerbose} ${flagClone} ${flagNointeractive}`)
      } else {
        console.log(`- ${cmdSudo} ${cmd} ${flagVerbose} ${flagNointeractive}`)
      }
    }

    console.log()
    if (nointeractive || (await Utils.customConfirm())) {
      for (const cmd of cmds) {
        if (cmd.includes('produce')) {
          await exec(`${cmdSudo} ${cmd} ${flagHidden} ${flagVerbose} ${flagClone} ${flagNointeractive} ${flagDtbdir}`)
        } else {
          await exec(`${cmdSudo} ${cmd} ${flagVerbose} ${flagNointeractive}`)
        }
      }
    } else {
      console.log('Aborted!')
    }
  }
}
