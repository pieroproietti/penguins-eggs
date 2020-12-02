/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import Settings from '../classes/settings'
import Pacman from '../classes/pacman'
import chalk = require('chalk')

/**
 * Get informations about system
 */
export default class Info extends Command {
   static description = 'informations about system and eggs'

   static examples = [
      `$ eggs info
You will find here informations about penguin's eggs!
`
   ]

   async run() {
      Utils.titles(this.id + ' ' + this.argv)

      const settings = new Settings()
      settings.load()

      const line = '-----------------------------------------------------------------'
      console.log(line)
      settings.show()

      console.log(line)
      shx.exec('lsb_release -a')

      console.log(line)
      if (await Pacman.prerequisitesCheck()) {
         console.log('Eggs prerequisites:  ' + chalk.bgGreen('ok'))
      } else {
         console.log('Eggs prerequisites:  ' + chalk.bgRed('ko'))
      }

      if (await Pacman.configurationCheck()) {
         console.log('Configuration file:  ' + chalk.bgGreen('ok'))
      } else {
         console.log('Configuration file:  ' + chalk.bgRed('ko'))
      }
      if (await Pacman.isXInstalled()) {
         if (await Pacman.calamaresCheck()) {
            console.log('GUI Installer:       ' + chalk.bgGreen('ok'))
         } else {
            console.log('GUI Installer:       ' + chalk.bgBlue('ko'))
         }
      } else {
         console.log('GUI Installer:       ' + chalk.bgGreen('cli installer'))
      }

      console.log(line)
      if (Utils.isLive()) {
         console.log('System: ' + chalk.bgGreen('LIVE') + ' system')
      } else {
         console.log('System: ' + chalk.bgCyan('INSTALLED'))
      }
      console.log(line)
   }
}
