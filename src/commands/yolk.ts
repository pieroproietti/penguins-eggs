/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import Utils from '../classes/utils'
import Settings from '../classes/settings'

import fs = require('fs')

export default class Yolk extends Command {
   static description = 'configure eggs to install without internet'

   static examples = [`$ eggs yolk -v`]

   static flags = {
      help: flags.help({ char: 'h' }),
      user: flags.string({ char: 'u', description: 'user to be used' }),
      verbose: flags.boolean({ char: 'v' })
   }

   async run() {
      const { flags } = this.parse(Yolk)

      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      if (Utils.isRoot()) {
         const settings = new Settings()
         settings.load()
         const yolk = settings.work_dir.pathIso + '/yolk'
         if (!fs.existsSync(yolk)) {
            console.log('yolk già esiste!')
            process.exit(0)
         } else {
            this.createYolk()
         }
      }
   }

   /**
    * 
    */
   createYolk () {
      const packages = ['grub-efi-amd64.deb', 'grub-pc.deb', 'cryptsetup.deb', 'keyutils.deb']
      const source = 'http://deb.debian.org/debian/'
      
      // pacchetti: 

      // Creare Packages.gz in yoik
   }
}
