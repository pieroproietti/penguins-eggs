/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags, flush } from '@oclif/core'
import Utils from '../classes/utils'
import Krill from '../krill/krill-prepare'

/**
 * Class Install
 */
export default class Install extends Command {
  static flags = {
    crypted: Flags.boolean({ char: 'k', description: 'crypted CLI installation' }),
    pve: Flags.boolean({ char: 'p', description: 'Proxmox VE install' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  static aliases = [`krill`]

  static description = 'command-line system installer - the egg became a penguin!'

  static examples = ['$ eggs install\nInstall the system using krill installer\n']

  /**
   * Execute
   */
  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Install)

    let crypted = false
    if (flags.crypted) {
      crypted = true
    }

    let pve = false
    if (flags.pve) {
      pve = true
      crypted = false
    }

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    if (Utils.isRoot()) {
      if (Utils.isLive()) {
        const krill = new Krill()
        await krill.prepare(crypted, pve, verbose)
      } else {
        Utils.warning('You are in an installed system!')
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
