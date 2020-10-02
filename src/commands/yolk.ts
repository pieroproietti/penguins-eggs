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
         await this.createYolk(verbose)
      }
   }

   /**
    * 
    */
   async createYolk(verbose = false) {
      const echo = Utils.setEcho(verbose)
      const packages = ['grub-pc', 'grub-pc-bin', 'cryptsetup', 'keyutils']
      let arch = 'amd64'
      if (process.arch === 'ia32') {
         arch = 'i386'
         // packages.push('grub-efi-ia32')
         // packages.push('grub-efi-ia32-bin')
      } else {
         packages.push('grub-efi-amd64')
         packages.push('grub-efi-amd64-bin')
      }

      /**
       * riga apt
       * 
       * deb [trusted=yes] file:/usr/local/yolk ./
       * 
       */

      if (!fs.existsSync(`${Yolk.dir}`)) {
         shx.exec(`mkdir ${Yolk.dir} -p`)
      }

      process.chdir(Yolk.dir)
      for (let i = 0; i < packages.length; i++) {
         const cmd = `apt-get download ${packages[i]}`
         console.log(cmd)
         await exec(cmd, echo)
      }

      process.chdir(Yolk.dir)

      const cmd = 'dpkg-scanpackages -m . | gzip -c > Packages.gz'
      console.log(cmd)
      await exec(cmd, echo)

      const release = `Archive: stable\nComponent: yolk\nOrigin: penguins-eggs\nArchitecture: ${arch}\n`
      fs.writeFileSync('Release', release)
   }
}
