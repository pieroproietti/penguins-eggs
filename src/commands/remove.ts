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

const exec = require('../lib/utils').exec

/**
 *
 */
export default class Remove extends Command {
   static description = 'remove eggs and others stuff'

   static examples = [
      `$ sudo eggs remove \nremove eggs\n`,
      `$ sudo eggs remove --prerequisites \nremove eggs, eggs configurations, packages prerequisites\n`,
   ]

   static flags = {
      purge: flags.boolean({ char: 'p', description: 'remove eggs configurations files' }),
      prerequisites: flags.boolean({ char: 'd', description: 'remove eggs packages dependencies' }),
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
         if (Utils.isDebPackage()) {
            /**
             * debian package
             */
            if (await Utils.customConfirm()) {
               if (flags.purge) {
                  execSync('apt-get purge eggs --yes')
               } else {
                  execSync('apt-get remove eggs --yes')
               }
               if (flags.prerequisites) {
                  execSync('apt-get autoremove --yes')
               }
            }

            /**
             * sources
             */
         } else if (Utils.isSources()) {
            if (await Utils.customConfirm()) {
               if (flags.prerequisites) {
                  await Pacman.prerequisitesRemove()
               }
               if (flags.purge) {
                  await Pacman.configurationRemove()
               }
               Utils.warning('You are using  eggs as sources. I\'ll NOT remove it')
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
               // Rimuove eggs completion
               execSync('rm -f /etc/bash_completion.d/eggs.bash')
               // Rimuove manpages
               execSync('rm -f /usr/share/man/man1/eggs.1.gz')
               // purge configurations files
               if (flags.purge) {
                  await Pacman.configurationRemove()
               }
               // Rimuove eggs
               execSync('npm remove penguins-eggs -g')
            }
         }
      }
   }
}

