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
import chalk = require('chalk')

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
    if (Pacman.prerequisitesEggsCheck()){
      console.log('Prerequisites:  ' + chalk.bgGreen('installed'))
    } else {
      console.log('Prerequisites:  ' + chalk.bgRed('NOT installed'))
    }

    if (Pacman.configurationCheck()){
      console.log('Configuration:  ' + chalk.bgGreen('configured'))
    } else {
      console.log('Configuration:  ' + chalk.bgRed('NOT configured'))
    }
    
    if (Pacman.prerequisitesCalamaresCheck()){
      console.log('Calamares:      ' + chalk.bgGreen('installed'))
    } else {
      console.log('Calamares:      ' + chalk.bgRed('NOT installed'))
    }

    let message='You are on an INSTALLED system.'
    if (Utils.isLive()){
      console.log('System:         This is a ' + chalk.bgGreen('LIVE') + ' system.')
    } else {
      console.log('System:         This is an ' + chalk.bgRed('INSTALLED') + ' system.')
    }
  }
}
