/**
 * info
 */

import { Command, Flags } from '@oclif/core'
import information from '../components/elements/information'

/**
 *
 */
export default class Info extends Command {
  static description = 're-thinking for a different approach to CLI'

  static flags = {
    verbose: Flags.boolean({ char: 'v' }),
    help: Flags.help({ char: 'h' })
  }

  /**
   *
   */
  async run(): Promise<void> {
    const { flags } = await this.parse(Info)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    await information(verbose)
  }
}
