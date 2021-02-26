/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'
import { IInstall } from '../interfaces'

import chalk = require('chalk')
import { execSync } from 'child_process'
import { remove } from '../lib/cli-autologin'

const exec = require('../lib/utils').exec

/**
 *
 */
export default class Remove extends Command {
   static description = 'remove eggs and others stuff'

   static examples = [
      `$ sudo eggs remove \nremove eggs\n`,
      `$ sudo eggs remove --prerequisites \nremove eggs, eggs configurations, packages prerequisites, calamares, calamares configurations\n`,
      `$ sudo eggs remove --calamares \nremove calamares and dependecies\n`,
   ]

   static flags = {
      prerequisites: flags.boolean({ char: 'p', description: 'remove eggs packages prerequisites' }),
      calamares: flags.boolean({ char: 'c', description: 'remove calamares and dependencies' }),
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }

   async run() {
      Utils.titles(this.id + ' ' + this.argv)

      const { flags } = this.parse(Remove)
      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      if (Utils.isRoot()) {
         /**
          * package debian
          */
         if (Utils.isDebPackage()) {
            Utils.warning('You are using  eggs as package deb. I\'ll will remove it')
            execSync('apt-get remove eggs')
            if (await Utils.customConfirm()) {
               if (flags.prerequisites) {
                  execSync('apt-get autoremove')
               }
               if (flags.calamares) {
                  await Pacman.calamaresRemove()
               }
            }
            /**
             * sources
             */
         } else if (Utils.isSources()) {
            Utils.warning('You are using  eggs as sources. I\'ll NOT remove it')
            if (await Utils.customConfirm()) {
               if (flags.prerequisites) {
                  await Pacman.prerequisitesRemove()
               }
               if (flags.calamares) {
                  await Pacman.calamaresRemove()
               }
            }

         } else {
            /**
             * npm package
             */
            Utils.warning(`You are using eggs as npm package. I'll remove it.`)
            if (await Utils.customConfirm()) {
               if (flags.prerequisites) {
                  await Pacman.prerequisitesRemove()
               }
               if (flags.calamares) {
                  await Pacman.calamaresRemove()
               }
               await Pacman.configurationRemove()
               // Rimuove eggs completion
               execSync('rm -f /etc/bash_completion.d/eggs.bash')
               // Rimuove manpages
               execSync('rm -f /usr/share/man/man1/eggs.1.gz')
               // Rimuove eggs
               execSync('npm remove penguins-eggs -g')
               }
            }
         }
      }
   }
}
