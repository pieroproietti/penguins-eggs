/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags, flush } from '@oclif/core'
import shx from 'shelljs'
import Utils from '../classes/utils'
import Prepare from '../classes/krill_prepare'
import Pacman from '../classes/pacman'
import { emitWarning } from 'node:process'
import chalk from 'chalk'

/**
 * Class Install
 */
export default class Install extends Command {
  static flags = {
    cli: Flags.boolean({ char: 'c', description: 'force use CLI installer' }),
    crypted: Flags.boolean({ char: 'k', description: 'crypted CLI installation' }),
    pve: Flags.boolean({ char: 'p', description: 'Proxmox VE install' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  static description = 'command-line system installer - the egg became a penguin!'

  // static aliases = ['krill']

  static examples = ['$ eggs install\nInstall the system using GUI or CLI installer\n']

  /**
   * Execute
   */
  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Install)

    let cli = false
    if (flags.cli) {
      cli = true
    }

    let crypted = false
    if (flags.crypted) {
      crypted = true
    }

    let pve = false
    if (flags.pve) {
      pve = true
      crypted = false
      cli = true
    }

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    if (Utils.isRoot()) {
      if (Utils.isLive()) {
        if (Pacman.packageIsInstalled('calamares') && Pacman.isRunningGui() && !cli) {
          shx.exec('/usb/sbin/install-debian')
        } else if (Pacman.packageIsInstalled('calamares') && !cli) {
          Utils.warning('Calamares installer is present, start GUI and choose calamares to install the system')
          Utils.warning('If you still want to use krill, type: ' + chalk.bold('sudo eggs install --cli'))
        } else {
          const krill = new Prepare()
          await krill.prepare(crypted, pve, verbose)
        }
      } else {
        Utils.warning('You are in an installed system!')
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
