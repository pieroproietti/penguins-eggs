/**
 * info
 */

import { Command, Flags } from '@oclif/core'
import { Example } from '@oclif/core/lib/interfaces'
import information from '../components/elements/information'

/**
 *
 */
export default class Status extends Command {
  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v' })
  }
  static description = 'informations about eggs status'
  static examples = [
    "eggs status"
  ]

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
