/**
 * penguins-eggs-v8 
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import path = require('path')
import Pacman from '../classes/pacman'
import Settings from '../classes/settings'

const exec = require('../lib/utils').exec

export default class Dad extends Command {
  static description = 'ask for daddy (gui interface)!'

  settings = {} as Settings

  static flags = {
    help: flags.help({ char: 'h' }),
    verbose: flags.boolean({ char: 'v' }),
  }

  static args = [{ name: 'file' }]

  async run() {
    const { args, flags } = this.parse(Dad)

    this.daddy(flags.verbose)
  }

  /**
   * 
   */
  daddy(verbose=false) {
    // Controllo prerequisites
    if (!Pacman.prerequisitesCheck()) {
      console.log('installing prerequisites...')
      Pacman.prerequisitesInstall(verbose)
    } else {
      console.log('prerequisites already present')
    }

    // Controllo configurazione
    if (!Pacman.configurationCheck()) {
      console.log('creating configuration...')
      Pacman.configurationInstall(verbose)
    } else {
      console.log('configuration present')
    }

    // show and edit configuration
    this.settings = new Settings()
    if (this.settings.load(verbose)) {
      console.log('live user name: ' + this.settings.user_opt)
      console.log('live user password: ' + this.settings.user_opt_passwd)
      console.log('root password: ' + this.settings.root_passwd)
    }

    // produce

  }

}


