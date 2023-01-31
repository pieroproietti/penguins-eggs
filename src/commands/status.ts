/**
 * info
 */

import { Command, Flags } from '@oclif/core'
import information from '../components/elements/information'

/**
 *
 */
export default class Status extends Command {
  static description = 'informations about eggs status'

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

    await information(verbose)
  }
}
