/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'

import fs = require('fs')
import ini = require('ini')
import Utils from '../classes/utils'
import Settings from '../classes/settings'
import { IWorkDir } from '../interfaces/i-workdir'

import { execute, pipe } from '@getvim/execute'


export default class Kill extends Command {
   config_file = '/etc/penguins-eggs.d/eggs.conf' as string
   snapshot_dir = '' as string
   work_dir = {} as IWorkDir

   static description = 'kill the eggs/free the nest'
   // static aliases = ['clean']

   static flags = {
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' }),
   }

   static examples = [
      `$ eggs kill\nkill the eggs/free the nest`
   ]

   async run() {
      Utils.titles(this.id + ' ' + this.argv)

      const { flags } = this.parse(Kill)
      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      const echo = Utils.setEcho(verbose)

      if (Utils.isRoot()) {
         Utils.warning('Cleaning the nest...')
         const settings = new Settings()
         await settings.load()
         await settings.listFreeSpace()
         if (await Utils.customConfirm()) {
            await execute(`rm ${settings.work_dir.path} -rf`, echo)
            await execute(`rm ${settings.snapshot_dir} -rf`, echo)
         }
      }
   }
}
