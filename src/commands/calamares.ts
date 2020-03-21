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
    verbose: flags.boolean({ char: 'v' }),
    configuration_only: flags.boolean({ char: 'c', description: 'only configuration' }),
  }

  static examples = [
    `~$ eggs calamares\nremove (if present) and install calamares, calamares-settings-debian and configure it\n`,
    `~$ eggs calamares  -c\ncreate only calamares configuration\n`,
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
      let answer = JSON.parse(await Utils.customConfirm(`Select yes to continue...`))
      if (answer.confirm === 'Yes') {
        if (!flags.configuration_only) {
          shx.exec('rm /etc/calamares -rf')
          shx.exec('apt-get remove --yes --purge calamares calamares-settings-debian')
          shx.exec(`apt-get update`, { async: false })
          shx.exec(`apt-get install --yes \
                calamares \
                qml-module-qtquick-window2 \
                qml-module-qtquick2`, { async: false })
                // calamares-settings-debian
        }

        const ovary = new Ovary
        if (await ovary.fertilization()) {
          await ovary.calamaresConfigure(verbose)
        }
      }
    }
  }
}
