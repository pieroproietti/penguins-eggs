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
 * Class Krill
 */
export default class Install extends Command {
  static flags = {
    unattended: Flags.boolean({ char: 'u', description: 'unattended CLI installation' }),
    ip: Flags.boolean({ char: 'i', description: 'add ip to hostname' }),
    random: Flags.boolean({ char: 'r', description: 'add random to hostname' }),
    suspend: Flags.boolean({ char: 'S', description: 'suspend: swap siza = RAM x 2' }),
    small: Flags.boolean({ char: 'S', description: 'small: swap size = RAM' }),
    none: Flags.boolean({ char: 'n', description: 'nome: swap size = 256M' }),
    crypted: Flags.boolean({ char: 'k', description: 'crypted CLI installation' }),
    pve: Flags.boolean({ char: 'p', description: 'Proxmox VE install' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  static description = 'command-line system installer - the egg became a penguin!'

  static examples = ['$ eggs install\nInstall the system using krill installer\n']

  /**
   * Execute
   */
  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Install)

    let unattended = flags.unattended

    // hostname
    let ip = flags.ip
    let random = flags.random

    // swap
    let suspend =flags.suspend
    let small = flags.small
    let none = flags.none

    let crypted = flags.crypted

    let pve = flags.pve
    if (pve) {
      crypted = false
    }

    let verbose = flags.verbose

    if (Utils.isRoot()) {
      if (Utils.isLive()) {
        const krill = new Krill()
        await krill.prepare(unattended, ip, random, suspend, small, none, crypted, pve, verbose)
      } else {
        Utils.warning('You are in an installed system!')
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
