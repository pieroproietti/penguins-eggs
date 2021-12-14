/**
 * penguins-eggs-v8
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command, flags} from '@oclif/command'
import path from 'node:path'
import Utils from '../classes/utils'

import {exec} from '../lib/utils'

export default class Mom extends Command {
   static description = 'ask for mommy - gui helper'

   static flags = {
     help: flags.help({char: 'h'}),
   }

   async run() {
     Utils.titles(this.id + ' ' + this.argv)
     // No sudo!
     if (process.getuid && process.getuid() === 0) {
       Utils.warning('You must to be kind with your mom! Call her without sudo')
       process.exit(0)
     }

     const cmd = path.resolve(__dirname, '../../scripts/mom-cli.sh')
     await exec(cmd)
   }
}
