/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'

// libraries
const exec = require('../lib/utils').exec

export default class Sterilize extends Command {
  static description = 'remove alla packages installed as prerequisites'

  static flags = {
    help: flags.help({ char: 'h' }),
  }

  async run() {
    Utils.titles()
    console.log(`command: sterilize`)

    const { flags } = this.parse(Sterilize)

    if (Utils.isRoot() && Pacman.prerequisitesEggsCheck()) {
      let answer = JSON.parse(await Utils.customConfirm(`Select yes to continue...`))
      if (answer.confirm === 'Yes') {
        await Pacman.prerequisitesEggsRemove()
        if(Pacman.prerequisitesCalamaresCheck()){
          await Pacman.prerequisitesCalamaresRemove()
          await Pacman.clean()
        }
      }
    }
  }
}
