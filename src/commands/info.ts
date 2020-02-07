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
    let message='this is an INSTALLED system. You can use produce to create an egg'
    this.log(Utils.getPackageName())
    shx.exec('lsb_release -a')
    if (Utils.isLive()){
      message = "This is a LIVE system. You can hatch it to install"
    }
    shx.echo (`Status:         ${message}`)
    shx.exit(0)
  }
}
