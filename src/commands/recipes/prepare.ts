import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'

import { exec } from '../../lib/utils'

export default class Prepare extends Command {
  static description = 'prepare recipes'

  static flags = {
    verbose: Flags.boolean({ char: 'v' }),
    help: Flags.help({ char: 'h' })
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Prepare)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    const echo = Utils.setEcho(verbose)

    // const {args, flags} = this.parse(Adjust)
    Utils.titles(this.id + ' ' + this.argv)

    Utils.warning('Prepare recipes')
  }
}
