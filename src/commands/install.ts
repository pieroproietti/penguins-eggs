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
    unattended: Flags.boolean({ char: 'u', description: 'Unattended installation' }),
    // hostname
    ip: Flags.boolean({ char: 'i', description: 'hostname as ip, eg: ip-192-168-1-33' }),
    random: Flags.boolean({ char: 'r', description: 'Add random to hostname, eg: colibri-ay412dt' }),
    // append: Flags.string({char: 'a', description: 'append to hostname: ip, random'}),
    domain: Flags.string({char: 'd', description: 'Domain name, defult: .local'}),
    // swap
    // swap: Flags.string({char: 's', description: 'swap: none, small, suspend'}),
    suspend: Flags.boolean({ char: 'S', description: 'Swap suspend: RAM x 2' }),
    small: Flags.boolean({ char: 's', description: 'Swap small: RAM' }),
    none: Flags.boolean({ char: 'n', description: 'Swap none: 256M' }),
    // 
    crypted: Flags.boolean({ char: 'k', description: 'Crypted CLI installation' }),
    pve: Flags.boolean({ char: 'p', description: 'Proxmox VE install' }),
    // generic
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'Verbose' })
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

    let domain = '.local'
    if (flags.domain) {
      domain = flags.domain
    }

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
        await krill.prepare(unattended, ip, random, domain, suspend, small, none, crypted, pve, verbose)
      } else {
        Utils.warning('You are in an installed system!')
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
