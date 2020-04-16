/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import Hatching from '../classes/hatching'

/**
 * Class Install
 */
export default class Install extends Command {
  static flags = {
    info: flags.help({ char: 'h' }),
    gui: flags.boolean({ char: 'g', description: 'use gui installer' }),
    umount: flags.boolean({ char: 'u', description: 'umount devices' }),
    verbose: flags.boolean({char: 'v', description: 'verbose'}),
  }
  static description = 'penguin\'s eggs installation'

  static aliases = ['hatch']

  static examples = [`$ eggs install\npenguin's eggs installation\n`,]

  /**
   * Execute
   */
  async run() {
    Utils.titles()
    console.log('command: install')
    const {flags} = this.parse(Install)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    let umount = false
    if (flags.umount) {
      umount = true
    }
    
    if (Utils.isRoot()) {
      if (flags.gui) {
        shx.exec('calamares')
      } else {
        const hatching = new Hatching()
        hatching.questions(verbose, umount)
      }
    }
  }
}