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
import Pacman from '../classes/pacman'

import { IRemix } from '../interfaces'

export default class Calamares extends Command {
   static description = 'configure calamares or install and configure it'

   remix = {} as IRemix

   static flags = {
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v' }),
      branding: flags.string({ description: 'branding for calamares' }),
      install: flags.boolean({ char: 'i', description: 'install' })
   }

   static examples = [
      `~$ sudo eggs calamares \ncreate calamares configuration\n`,
      `~$ sudo eggs calamares -i \ninstall calamares  and configure it\n`
   ]

   async run() {
      Utils.titles('calamares')

      const { flags } = this.parse(Calamares)
      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      let install = false
      if (flags.install) {
         install = true
      }

      // Nome del brand di calamares
      let branding = 'eggs'
      if (flags.branding !== undefined) {
         branding = flags.branding
         console.log(`calamares branding: ${branding}`)
      }

      console.log(`install: ${install}`)
      if (Utils.isRoot()) {
         if (Pacman.isXInstalled()) {
            console.log(`isXInstalled: true`)

            if (await Utils.customConfirm(`Select yes to continue...`)) {
               if (install) {
                  Utils.warning('Installing calamares prerequisites...')
                  await Pacman.prerequisitesCalamaresInstall()
               }

               if (branding === '') {
                  this.remix.branding = 'eggs'
               } else {
                  this.remix.branding = branding
               }

               Utils.warning('Configuring calamares...')
               const ovary = new Ovary()
               if (await ovary.loadSettings()) {
                  ovary.loadRemix('custom', 'eggs')
                  await ovary.calamaresConfigure(verbose)
               }
            }
         }
      }
   }
}
