/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'

export default class Sterilize extends Command {
  static description = 'remove alla packages installed as prerequisites'

  static flags = {
    help: flags.help({ char: 'h' }),
  }

  async run() {
    Utils.titles()
    console.log(`command: sterilize`)


    const { flags } = this.parse(Sterilize)

    if (Utils.isRoot() && Utils.prerequisitesInstalled()) {
      let answer = JSON.parse(await Utils.customConfirm(`Select yes to continue...`))

      if (answer.confirm === 'Yes') {

        this.log('sterilize the penguin...')
        shx.exec('apt-get --yes --purge remove  \
                calamares \
                calamares-settings-debian \
                qml-module-qtquick2 \
                qml-module-qtquick-controls', { async: false })

        shx.exec('apt-get --yes --purge remove  \
                  squashfs-tools \
                  xorriso \
                  syslinux \
                  isolinux \
                  live-boot \
                  open-infrastructure-system-config', { async: false })

        shx.exec('apt-get --yes autoremove', { async: false })
        shx.exec('apt-get clean', { async: false })
        shx.exec('apt-get autoclean', { async: false })
        shx.exec('rm /etc/calamares -rf', { async: false })
      }
    }
  }
}
