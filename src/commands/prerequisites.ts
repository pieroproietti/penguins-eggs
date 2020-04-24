/* eslint-disable no-multi-str */
/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import path = require('path')
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'

export default class Prerequisites extends Command {
  static description = 'install the prerequisites packages to run penguin\'s eggs'

  static flags = {
    help: flags.help({ char: 'h' }),
    configuration_only: flags.boolean({ char: 'c', description: 'not remove/reinstall calamares, only configuration' }),
  }

  static examples = [
    `~$ eggs prerequisites\ninstall prerequisites and create configuration files\n`,
    `~$ eggs prerequisites -c\nonly create configuration files\n`,
  ]

  async run() {
    Utils.titles()
    console.log('command: prerequisites')

    const { flags } = this.parse(Prerequisites)

    if (Utils.isRoot()) {
      let answer = JSON.parse(await Utils.customConfirm(`Select yes to continue...`))
      if (answer.confirm === 'Yes') {
        await Pacman.configurationInstall()
        if (!flags.configuration_only) {
          await Pacman.prerequisitesEggsInstall()
        }
      }
    }
  }
}

