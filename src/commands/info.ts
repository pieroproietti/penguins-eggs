/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import {Command,flags} from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import Ovary from '../classes/ovary'
import Pacman from '../classes/pacman'

/**
 * Get informations about system
 */
export default class Info extends Command {

  static description = 'informations about system and eggs'

  static examples = [
    `$ eggs info
You will find here informations about penguin's eggs!
`,
  ]

  async run() {
    Utils.titles('info')

    const ovary = new Ovary
    ovary.loadSettings()
    ovary.showSettings()

    shx.exec('lsb_release -a')
    let message='You are on an INSTALLED system.'
    if (Utils.isLive()){
      message = "This is a LIVE system."
    }
    shx.echo (`System:         ${message}`)
    if (Pacman.prerequisitesEggsCheck()){
      console.log('Prerequisites:  installed')
    } else {
      console.log('Prerequisites:  NOT installed')
    }
    if (Pacman.prerequisitesCalamaresCheck()){
      console.log('Calamares:      installed')
    } else {
      console.log('Calamares:      NOT installed')
    }

  }
}
