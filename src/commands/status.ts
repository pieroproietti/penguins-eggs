/**
 * ./src/commands/status.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'

import Information from '../krill/components/information.js'

/**
 *
 */
export default class Status extends Command {
  static description = 'informations about eggs status'

  static examples = ['eggs status']

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v' })
  }

  /**
   *
   */
  async run(): Promise<void> {
    const { flags } = await this.parse(Status)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    Information(verbose)
  }
}
