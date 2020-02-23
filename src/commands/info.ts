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

/**
 * Get informations about system
 */
export default class Info extends Command {

  static description = 'informations about penguin\'s eggs'

  static examples = [
    `$ eggs info
You will find here informations about penguin's eggs!
`,
  ]

  async run() {
    const ovary = new Ovary

    Utils.titles()

    ovary.loadSettings()
    ovary.showSettings()

    let message='You are on an INSTALLED system.'
    if (Utils.isLive()){
      message = "This is a LIVE system."
    }
    shx.echo (`System:            ${message}`)

    Utils.prerequisitesInstalled()
    
    shx.exec('lsb_release -a')
  }
}
