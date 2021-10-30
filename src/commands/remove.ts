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
import { execSync } from 'child_process'

const exec = require('../lib/utils').exec

/**
 *
 */
export default class Remove extends Command {
   static description = 'remove eggs and others stuff'

   static examples = [
      `$ sudo eggs remove \nremove eggs\n`,
      `$ sudo eggs remove --purge \nremove eggs, eggs configurations, configuration's files\n`,
      `$ sudo eggs remove --autoremove \nremove eggs, eggs configurations, packages dependencies\n`,
   ]

   static flags = {
      purge: flags.boolean({ char: 'p', description: 'remove eggs configurations files' }),
      autoremove: flags.boolean({ char: 'a', description: 'remove eggs packages dependencies' }),
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
         * debian package
         */
         if (Utils.isDebPackage()) {
            if (await Utils.customConfirm()) {
               /**
               * in caso di autoremove, tolgo le dipendenze di versione PRIMA di eggs, altrimenti si inchioda
               */
               if (flags.autoremove) {
                  /**
                   * Rimozione dipendenze da versione live-config / open-infrastructure-system-config (ubuntu bionic)
                   */
                  if (Pacman.packageIsInstalled('open-infrastructure-system-config')) {
                     execSync('apt-get purge open-infrastructure-system-config --yes')
                  } else if (Pacman.packageIsInstalled('live-config')) {
                     execSync('apt-get purge live-config --yes')
                  }
               }

               if (flags.purge) {
                  execSync('apt-get purge eggs --yes')
               } else {
                  execSync('apt-get remove eggs --yes')
               }

               if (flags.autoremove) {
                  execSync('apt-get autoremove --yes')
               }
            }
         }

         /**
         * sources
         */
         if (Utils.isSources()) {
            if (await Utils.customConfirm()) {
               if (flags.autoremove) {
                  await Pacman.prerequisitesRemove()
               }

               if (flags.purge) {
                  await Pacman.configurationRemove()

                  // eggs completion
                  execSync('rm -f /etc/bash_completion.d/eggs.bash')

                  // manpages
                  execSync('rm -f /usr/share/man/man1/eggs.1.gz')
               }
               Utils.warning('You are using  eggs as sources. I\'ll NOT remove it')
            }
         }
      }
   }
}

