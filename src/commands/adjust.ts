import {Command, flags} from '@oclif/command'
import Utils from '../classes/utils'

const exec = require('../lib/utils').exec

export default class Adjust extends Command {
  static description = 'auto adjust monitor resolution'


  static flags = {
    verbose: flags.boolean({ char: 'v' }),
    help: flags.help({char: 'h'}),
  }

  async run() {

    const { args, flags } = this.parse(Adjust)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    let echo = Utils.setEcho(verbose)

    //const {args, flags} = this.parse(Adjust)
    Utils.titles('adjust')
    Utils.warning('Adjust monitor configuration...')
    await exec(`xrandr --output Virtual-0 --auto`, echo)
    await exec(`xrandr --output Virtual-1 --auto`, echo)
    await exec(`xrandr --output Virtual-2 --auto`, echo)
    await exec(`xrandr --output Virtual-3 --auto`, echo)
  }
}
