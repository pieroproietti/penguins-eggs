/**
 * penguins-eggs-v8
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
 import { Command, Flags } from '@oclif/core'
 import path from 'node:path'
 import Utils from '../classes/utils'
 
 import { exec } from '../lib/utils'
 
 export default class Bro extends Command {
   static description = 'bro: waydroid helper'
 
   static flags = {
     help: Flags.help({ char: 'h' })
   }
 
   async run(): Promise<void> {
     Utils.titles(this.id + ' ' + this.argv)

     const { args, flags } = await this.parse(Bro)
     // No sudo!
     if (process.getuid && process.getuid() === 0) {
       Utils.warning('You must to be kind with your bro, call him without sudo')
       process.exit(0)
     }
 
     const cmd = path.resolve(__dirname, '../../scripts/bros/waydroid-helper.sh')
     await exec(cmd)
   }
 }
 