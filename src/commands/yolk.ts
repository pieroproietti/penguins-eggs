/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import fs = require('fs')

import Utils from '../classes/utils'
import Settings from '../classes/settings'
import Repo from '../classes/repo'

const exec = require('../lib/utils').exec

/**
 * 
 */
export default class Yolk extends Command {
   static description = 'configure eggs to install without internet'

   static examples = [`$ eggs yolk -v`]

   static flags = {
      help: flags.help({ char: 'h' }),
      user: flags.string({ char: 'u', description: 'user to be used' }),
      verbose: flags.boolean({ char: 'v' })
   }

   static dir = '/'

   /**
    * 
    */
   async run() {
      const { flags } = this.parse(Yolk)

      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      if (Utils.isRoot()) {
         const settings = new Settings()
         settings.load()
         Yolk.dir = '/usr/local/yolk'
         if (fs.existsSync(Yolk.dir)) {
            shx.exec(`rm ${Yolk.dir} -rf `)
         }

         const repo = new Repo()
         await repo.create(Yolk.dir, verbose)
      }
   }
}
