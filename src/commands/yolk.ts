/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')

import Utils from '../classes/utils'
import Settings from '../classes/settings'
const exec = require('../lib/utils').exec

import fs = require('fs')
import { execSync } from 'child_process'


export default class Yolk extends Command {
   static description = 'configure eggs to install without internet'

   static examples = [`$ eggs yolk -v`]

   static flags = {
      help: flags.help({ char: 'h' }),
      user: flags.string({ char: 'u', description: 'user to be used' }),
      verbose: flags.boolean({ char: 'v' })
   }

   static dir = '/'


   async run() {
      const { flags } = this.parse(Yolk)

      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      if (Utils.isRoot()) {
         const settings = new Settings()
         settings.load()
         Yolk.dir = settings.work_dir.pathIso + '/yolk'
         if (fs.existsSync(Yolk.dir)) {
            shx.exec(`rm ${Yolk.dir} -rf `)
         }
         await this.createYolk(verbose)
      }
   }

   /**
    * 
    */
   async createYolk(verbose = false) {
      const echo = Utils.setEcho(verbose)
      const packages = ['grub-efi-amd64', 'grub-pc', 'cryptsetup', 'keyutils']

      if (!fs.existsSync(`${Yolk.dir}`)) {
         shx.exec(`mkdir ${Yolk.dir} -p`)
      }

      // pacchetti: 
      process.chdir(Yolk.dir)
      for (let i = 0; i < packages.length; i++) {
         const cmd = `apt-get download ${packages[i]}`
         console.log(cmd)
         await exec(cmd, echo)
      }
      
      process.chdir(Yolk.dir)
      const cmd = `dpkg-scanpackages . | gzip > Packages.gz`
      console.log(cmd)
      await exec(cmd, echo)
      const release = `Archive: unstable\nComponent: main\nOrigin: eggs\nArchitecture: amd64\n`
      fs.writeFileSync('Release', release)
   }
}
