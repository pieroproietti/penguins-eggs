/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'

import fs = require('fs')
import ini = require('ini')
import shx = require('shelljs')
import Utils from '../classes/utils'
import Ovary from '../classes/ovary'
import { IWorkDir } from '../interfaces/i-workdir'
import chalk = require('chalk')

const exec = require('../lib/utils').exec

export default class Kill extends Command {
   config_file = '/etc/penguins-eggs.conf' as string
   snapshot_dir = '' as string
   work_dir = {} as IWorkDir

   static description = 'kill the eggs/free the nest'
   // static aliases = ['clean']

   static flags = {
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' }),
      umount: flags.boolean({ char: 'u', description: 'umount' })
   }

   static examples = [
      `$ eggs kill
kill the eggs/free the nest
`
   ]

   async run() {
      Utils.titles('kill')

      const { args, flags } = this.parse(Kill)
      let verbose = false
      if (flags.verbose) {
         verbose = true
      }
      let umount = false
      if (flags.umount) {
         umount = true
      }

      const echo = Utils.setEcho(verbose)

      if (Utils.isRoot()) {
         if (this.loadSettings()) {
            Utils.warning('Cleaning the nest...')
            const ovary = new Ovary()
            await ovary.fertilization()
            if (umount) {
               await ovary.uBindLiveFs(verbose)
            }
            await exec(`rm ${this.work_dir.path} -rf`, echo)
            await exec(`rm ${this.snapshot_dir} -rf`, echo)
         }
      }
   }

   /*
    * Load configuration from /etc/penguins-eggs.conf
    * @returns {boolean} Success
    */
   loadSettings(): boolean {
      let foundSettings: boolean

      const settings = ini.parse(fs.readFileSync(this.config_file, 'utf-8'))
      if (settings.General.snapshot_dir === '') {
         foundSettings = false
      } else {
         foundSettings = true
         if (settings.General.snapshot_dir !== undefined) {
            this.snapshot_dir = settings.General.snapshot_dir.trim()
            if (!this.snapshot_dir.endsWith('/')) {
               this.snapshot_dir += '/'
            }
            this.work_dir.path = this.snapshot_dir + 'work/'
         }
      }
      // console.log(`work_dir: ${this.work_dir.path}`)
      // console.log(`foundSettings: ${foundSettings}`)
      return foundSettings
   }
}
