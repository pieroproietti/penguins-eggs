/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import {Command,flags} from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import { SSL_OP_COOKIE_EXCHANGE } from 'constants'

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
    let message='You are on an INSTALLED system.'
    this.log(Utils.getPackageName())
    shx.exec('lsb_release -a')
    if (Utils.isLive()){
      message = "This is a LIVE system."
    }
    shx.echo (`Status:         ${message}`)

    message = 'OK, installed.'
    if (!Utils.prerequisitesInstalled){
      message = 'NOT installed. Use: sudo eggs prerequisites'
    }
    shx.echo (`Prerequisites:  ${message}`)
    shx.exit(0)
  }
}
