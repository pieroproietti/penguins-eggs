/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import fs = require('fs')

import Utils from '../../classes/utils'
import Yolk from '../../classes/yolk'

/**
 * 
 */
export default class DevYolk extends Command {
   static description = 'configure eggs to install without internet'

   static examples = [`$ eggs yolk -v`]

   static flags = {
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v' })
   }

   static dir = '/'

   /**
    * 
    */
   async run() {
      const { flags } = this.parse(DevYolk)

      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      if (Utils.isRoot()) {
         if (fs.existsSync(DevYolk.dir)) {
            shx.exec(`rm ${DevYolk.dir} -rf `)
         }

         const yolk = new Yolk()
         await yolk.create(verbose)
      }
   }
}
