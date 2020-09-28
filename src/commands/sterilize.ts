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
/**
 *
 */
export default class Sterilize extends Command {
   static description = 'remove all packages installed as prerequisites and calamares'

   static flags = {
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }

   async run() {
      Utils.titles('sterilize')

      const { flags } = this.parse(Sterilize)
      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      if (Utils.isRoot() && await Pacman.prerequisitesCheck()) {
         const i = await Sterilize.thatWeRemove(verbose)
         if (await Utils.customConfirm(`Select yes to continue...`)) {
            if (i.calamares) {
               await Pacman.calamaresRemove()
            }

            if (i.configuration) {
               await Pacman.configurationRemove()
            }

            if (i.prerequisites) {
               await Pacman.prerequisitesRemove()
            }
         }
      } else {
         console.log('eggs prerequisites are not installed!')
      }
   }

      /**
    * 
    * @param links
    * @param verbose 
    */
   static async thatWeRemove(verbose = false): Promise<IInstall> {
      Utils.titles('That will be removed')

      let i = {} as IInstall

      i.calamares = await Pacman.calamaresCheck()
      i.prerequisites = await Pacman.prerequisitesCheck()
      i.configuration =  await Pacman.configurationCheck()


      if (i.calamares || i.prerequisites || i.configuration) {
         Utils.warning(`Removing prerequisites.\nEggs will execute the following tasks:`)

         if (i.calamares) {
            console.log('- remove calamares')
            const packages = Pacman.debs4calamares
            console.log(chalk.yellow('  apt purge --yes ' + Pacman.debs2line(packages) + '\n'))
         }

         if (i.prerequisites) {
            console.log('- remove prerequisites')
            const packages = Pacman.packages()
            console.log(chalk.yellow('  apt purge --yes ' + Pacman.debs2line(packages)))
            const packagesLocalisation = Pacman.packagesLocalisation()
            if (packagesLocalisation.length > 0) {
               console.log(chalk.yellow('  apt purge  --yes live-task-localisation ' + Pacman.debs2line(packagesLocalisation)) + '\n')
            } else {
               console.log()
            }
         }

         if (i.configuration) {
            console.log('- remove configuration\n')
         }
   }
      return i
   }

}
