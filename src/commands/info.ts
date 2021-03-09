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
import Distro from '../classes/distro'

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
      //console.log(line)
      settings.show()

      const distroId = shx.exec('lsb_release -is', {silent: true}).stdout.trim()
      const versionId = shx.exec('lsb_release -cs', {silent: true}).stdout.trim()
      console.log('distroId:          ' + chalk.cyan(distroId))
      console.log('versionId:         ' + chalk.cyan(versionId))
      console.log('distroLike:        ' + settings.distro.distroLike)
      console.log('versionLike:       ' + settings.distro.versionLike)
      if (await Pacman.prerequisitesCheck()) {
         console.log('eggs prerequisites:' + chalk.bgGreen('ok'))
      } else {
         console.log('eggs prerequisites:' + chalk.bgRed('ko'))
      }

      if (await Pacman.configurationCheck()) {
         console.log('configuration:     ' + chalk.bgGreen('ok'))
      } else {
         console.log('configuration:     ' + chalk.bgRed('ko'))
      }

      if (await Pacman.isGui()) {
         if (await Pacman.calamaresCheck()) {
            console.log('installer:         ' + chalk.bgGreen('GUI'))
         } else {
            console.log('installer:        ' + chalk.bgYellow('CLI') + ' if you want calamares, run ' + chalk.cyan('sudo eggs calamares --install'))
         }
      } else {
         console.log('installer:           ' + chalk.bgGreen('CLI'))
      }

      if (process.arch === 'x64') {
         if (!settings.config.make_efi) {
            if (Pacman.packageIsInstalled('grub-efi-amd64')) {
               console.log('EFI:               ' + chalk.bgRed('ko') + ' run ' + chalk.cyan('sudo eggs dad -c') + ' or edit ' + chalk.cyan('/etc/penguins-eggs.d/eggs.yaml') + ' and set ' + chalk.cyan('make_efi: true'))
            } else {
               console.log('EFI:               ' + chalk.bgRed('ko') + ' run ' + chalk.cyan('apt install grub-efi-amd64') + ' and ' + chalk.cyan('/etc/penguins-eggs.d/eggs.yaml') + ' and set ' + chalk.green('make_efi: true'))
            }
         } else {
            console.log('EFI:               ' + chalk.bgGreen('ok'))
         }
      }

      // console.log(line)
      let installType = 'npm package'
      if (Utils.isDebPackage()) {
         installType = 'deb package'
      } else if (Utils.isSources()) {
         installType = 'source'
      }
      console.log('eggs is running as:' + chalk.bgGreen(installType))

      if (Utils.isLive()) {
         console.log('system is:         ' + chalk.bgGreen('LIVE') + ' system')
      } else {
         console.log('system is:         ' + chalk.bgCyan('INSTALLED'))
      }

      // console.log(line)
   }
}
