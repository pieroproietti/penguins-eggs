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
  static flags = {gui: flags.boolean({char: 'g', description: 'use the gui installer'})}

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


    let cmd = 'cli-installer'
    if (Utils.isRoot()) {

      if (flags.gui) {
        shx.exec('calamares')
      } else {
        const hatching = new Hatching()
        hatching.question()
      }
    }
  }
}