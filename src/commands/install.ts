/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import Prepare from '../classes/krill_prepare'
import Pacman from '../classes/pacman'

/**
 * Class Install
 */
export default class Install extends Command {
   static flags = {
      cli: flags.boolean({ char: 'c', description: 'force use CLI installer' }),
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }
   static description = 'command-line system installer - the egg became a penguin!'

   static aliases = ['hatch', 'krill']

   static examples = [`$ eggs install\nInstall the system using GUI or CLI installer\n`]

   /**
    * Execute
    */
   async run() {
      Utils.titles(this.id + ' ' + this.argv)

      const { flags } = this.parse(Install)

      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      if (Utils.isRoot(this.id)) {
         if (Utils.isLive()) {
            if (Pacman.packageIsInstalled('calamares') && !flags.cli) {
               shx.exec('calamares')
            } else {
               const krill = new Prepare()
               await krill.prepare()
            }
         }
      } else {
         Utils.warning(`You are in an installed system!`)
      }
   }
}

