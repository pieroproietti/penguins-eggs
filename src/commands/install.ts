/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'
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
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  static description = 'command-line system installer - the egg became a penguin!'

  static aliases = ['hatch', 'krill']

  static examples = ['$ eggs install\nInstall the system using GUI or CLI installer\n']

  /**
   * Execute
   */
  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Install)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    if (Utils.isRoot(this.id)) {
      if (Utils.isLive()) {
        if (Pacman.packageIsInstalled('calamares') && Pacman.isRunningGui() && !flags.cli) {
          shx.exec('/usb/sbin/install-debian')
        } else if (Pacman.packageIsInstalled('calamares') && !flags.cli) {
          Utils.warning('Calamares installer is present, start GUI and choose calamares to install the system')
          Utils.warning('If you still want to use krill, type: ' + chalk.bold('sudo eggs install --cli'))
        } else {
          const krill = new Prepare()
          await krill.prepare()
        }
      }
    } else {
      Utils.warning('You are in an installed system!')
    }
  }
}
