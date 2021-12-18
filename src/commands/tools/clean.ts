/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import Bleach from '../../classes/bleach'

export default class Clean extends Command {
  static description = 'clean system log, apt, etc'

  static aliases = ['clean']

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Clean)
    Utils.titles(this.id + ' ' + this.argv)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    if (Utils.isRoot() && (await Utils.customConfirm('Select yes to continue...'))) {
      const bleach = new Bleach()
      bleach.clean(verbose)
    }
  }
}
