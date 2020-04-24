/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import Ovary from '../classes/ovary'
import Pacman from '../classes/pacman'

export default class Calamares extends Command {
  static description = 'Configure calamares or install and configure it'

  static flags = {
    help: flags.help({ char: 'h' }),
    verbose: flags.boolean({ char: 'v' }),
    install: flags.boolean({ char: 'i', description: 'install' }),
  }

  static examples = [
    `~$ sudo eggs calamares \ncreate calamares configuration\n`,
    `~$ sudo eggs calamares -i \ninstall calamares  and configure it\n`,
  ]


  async run() {
    Utils.titles()
    console.log('command: calamares')
    const { args, flags } = this.parse(Calamares)
    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    if (Utils.isRoot()) {
      if (Pacman.isXInstalled()) {
        let answer = JSON.parse(await Utils.customConfirm(`Select yes to continue...`))
        if (answer.confirm === 'Yes') {
          if (flags.install) {
            console.log('Installing calamares')
            await Pacman.prerequisitesCalamaresInstall()
          }

          const ovary = new Ovary
          if (await ovary.loadSettings()) {
            console.log('Configuring calamares')
            await ovary.calamaresConfigure(verbose)
          }
        }
      }
    }
  }
}
