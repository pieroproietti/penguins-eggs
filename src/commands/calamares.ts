/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command, flags} from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import { SSL_OP_COOKIE_EXCHANGE } from 'constants'

export default class Calamares extends Command {
  static description = 'Install calamares installer and configure it'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    const {args, flags} = this.parse(Calamares)

    // prerequisites 
    console.log(`>>> eggs: installing calamares...`);

    shx.exec(`${__dirname}/../../scripts/prerequisites_calamares.sh`, {
        async: false
      });
  }
}
