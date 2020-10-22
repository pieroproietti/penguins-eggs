import { Command, flags } from '@oclif/command'
import Utils from '../classes/utils'

const exec = require('../lib/utils').exec

export default class Adaptp extends Command {
   static description = 'adapt monitor resolution for VM only'
   static aliases = ['adjust']

   static flags = {
      verbose: flags.boolean({ char: 'v' }),
      help: flags.help({ char: 'h' })
   }

   async run() {
      const { args, flags } = this.parse(Adaptp)

      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      const echo = Utils.setEcho(verbose)

      //const {args, flags} = this.parse(Adjust)
      Utils.titles('adapt')
      Utils.warning('Adapt monitor resolutions to the size of window in virtual machines')
      await exec(`xrandr --output Virtual-0 --auto`, echo)
      await exec(`xrandr --output Virtual-1 --auto`, echo)
      await exec(`xrandr --output Virtual-2 --auto`, echo)
      await exec(`xrandr --output Virtual-3 --auto`, echo)
   }
}
