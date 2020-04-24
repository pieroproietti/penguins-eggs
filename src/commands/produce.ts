/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import Utils from '../classes/utils'
import Ovary from '../classes/ovary'
import Pacman from '../classes/pacman'
import os = require('os')
import chalk = require('chalk')

export default class Produce extends Command {
  static flags = {
    info: flags.help({ char: 'h' }),
    fast: flags.boolean({ char: 'f', description: 'compression fast' }),
    compress: flags.boolean({ char: 'c', description: 'max compression' }),
    basename: flags.string({ char: 'b', description: 'basename egg' }),
    verbose: flags.boolean({ char: 'v', description: 'verbose' }),
  }

  static description = 'the penguin produce an egg'

  static aliases = ['spawn', 'lay']

  static examples = [
    `$ eggs produce --basename egg
the penguin produce an egg called egg-i386-2020-04-13_1815.iso`]

  async run() {

    Utils.titles()
    console.log('command: produce')

    const { flags } = this.parse(Produce)
    if (Utils.isRoot()) {
      const basename = flags.basename || os.hostname()
      let compression = '' // se vuota, compression viene definita da loadsettings
      if (flags.fast) {
        compression = 'lz4'
      } else if (flags.compress) {
        compression = 'xz -Xbcj x86'
      }

      let verbose = false
      if (flags.verbose) {
        verbose = true
      }

      if (!await Pacman.prerequisitesEggsCheck()) {
        console.log('You need to install ' + chalk.red('prerequisites') + ' to continue.')
        let answer = JSON.parse(await Utils.customConfirm(`Select yes to install prerequisites`))
        if (answer.confirm === 'Yes') {
          await Pacman.prerequisitesEggsInstall(verbose)
          await Pacman.clean(verbose)
        } else {
          console.log('To create iso, you must install eggs prerequisites.\nsudo eggs prerequisites')
          process.exit(0)
        }
      }
      if (!await Pacman.configurationCheck()){
        await Pacman.configurationInstall(verbose)
      }  
  
      Utils.titles()
      console.log('command: produce')

      const ovary = new Ovary(compression)
      if (await ovary.fertilization()) {
        await ovary.produce(basename, verbose)
        ovary.finished()
      }
    }
  }
}

