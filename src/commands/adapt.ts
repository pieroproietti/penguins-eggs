/**
 * ./src/commands/adapt.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'

import Utils from '../classes/utils.js'
import { exec } from '../lib/utils.js'

export default class Adapt extends Command {
  static description = 'adapt monitor resolution for VM only'
  static examples = ['eggs adapt']
  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v' })
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Adapt)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    const echo = Utils.setEcho(verbose)

    // const {args, flags} = this.parse(Adjust)
    Utils.titles(this.id + ' ' + this.argv)

    Utils.warning('Adapt monitor resolutions to the size of window in virtual machines')
    await exec('xrandr --output Virtual-0 --auto', echo)
    await exec('xrandr --output Virtual-1 --auto', echo)
    await exec('xrandr --output Virtual-2 --auto', echo)
    await exec('xrandr --output Virtual-3 --auto', echo)
  }
}
