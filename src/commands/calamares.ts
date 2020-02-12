/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import { SSL_OP_COOKIE_EXCHANGE } from 'constants'

export default class Calamares extends Command {
  static description = 'Install calamares installer and configure it'

  static flags = {
    help: flags.help({ char: 'h' }),
  }

  async run() {
    const { args, flags } = this.parse(Calamares)

    if (Utils.isRoot()) {
      console.log(`>>> eggs: installing calamares...`)
      shx.exec(`apt-get update`, { async: false })
      shx.exec(`apt-get install --yes \
              calamares \
              calamares-settings-debian`, { async: false })
    }
  }
}
