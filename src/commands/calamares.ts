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

export default class Calamares extends Command {
  static description = 'Install calamares installer and configure it'

  static flags = {
    help: flags.help({ char: 'h' }),
  }

  async run() {
    const { args, flags } = this.parse(Calamares)

    Utils.titles()

    if (Utils.isRoot() && Utils.prerequisitesInstalled()) {
      console.log(`>>> eggs: removing calamares...`)
      shx.exec('rm /etc/calamares -rf')
      shx.exec('apt-get remove --yes --purge calamares calamares-settings-debian')
      shx.exec(`apt-get update`, { async: false })
      shx.exec(`apt-get install --yes \
              calamares \
              calamares-settings-debian`, { async: false })

      const ovary = new Ovary
      await ovary.fertilization()
      await ovary.calamaresConfigure()
    }
  }
}
