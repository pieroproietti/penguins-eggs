import { Command, flags } from '@oclif/command'

import Utils from '../../classes/utils'
import chalk = require('chalk')
import Initrd from '../../classes/initrd'
import { IInitrd } from '../../interfaces'

export default class DevInitrd extends Command {
   static description = 'Test initrd'


   static flags = {
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v' }),
      clean: flags.string({description: 'clean the initrd.img' }),
      check: flags.string({ description: 'check if necessary to clean initrd.img' })
   }


   async run() {
      Utils.titles('howto:initrd')
      console.log(chalk.cyanBright('Commands to boot in the grub shell'))
      console.log()

      const { flags } = this.parse(DevInitrd)

      const initrd = new Initrd()

      let file2clean = '/initrd.img'
      if (flags.clean !== undefined){
         file2clean = flags.clean
      }

      let file2check = '/initrd.img'
      if (flags.check !== undefined){
         file2check = flags.check
      }
      

       let result = initrd.check()
       if (result.cryptoroot) console.log('cryptoroot')
       if (result.crypttab) console.log('crypttab')
       if (result.resume) console.log('resume')
       if (result.zz_resume_auto) console.log('zz-resume-auto')
       

   }
}
