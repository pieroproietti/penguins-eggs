/**
 * penguins-eggs
 * command: status.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command, Flags} from '@oclif/core'
import information from '../components/elements/information'
import Utils from '../classes/utils'

/**
 *
 */
export default class Status extends Command {
  static flags = {
    help: Flags.help({char: 'h'}),
    verbose: Flags.boolean({char: 'v'}),
  }

  static description = 'informations about eggs status'
  static examples = [
    'eggs status',
  ]

  /**
   *
   */
  async run(): Promise<void> {
    const {flags} = await this.parse(Status)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    await information(verbose)
    await Utils.pressKeyToExit()    
  }
}
