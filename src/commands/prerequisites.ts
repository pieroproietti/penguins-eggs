/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'

export default class Prerequisites extends Command {
   static description = 'install packages prerequisites to run eggs'

   static flags = {
      help: flags.help({ char: 'h' }),
      configuration_only: flags.boolean({ char: 'c', description: 'creation of configuration files only' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }

   static examples = [`~$ eggs prerequisites\ninstall prerequisites and create configuration files\n`, `~$ eggs prerequisites -c\nonly create configuration files\n`]

   async run() {
      Utils.titles('prerequisites')

      const { flags } = this.parse(Prerequisites)
      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      if (Utils.isRoot()) {
         if (await Utils.customConfirm(`Select yes to continue...`)) {
            Utils.warning('Creating configuration files...')
            await Pacman.configurationInstall(verbose)
            if (!flags.configuration_only) {
               Utils.warning('Install eggs prerequisites...')
               await Pacman.prerequisitesEggsInstall(verbose)
            }
         }
      }
   }
}
