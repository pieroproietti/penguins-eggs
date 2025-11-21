/**
 * ./src/commands/setup.ts
 * penguins-eggs v.25.11.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import Utils from '../classes/utils.js'
import Pacman from '../classes/pacman.js'
import { Prerequisites } from '../appimage/prerequisites.js'
import { Command, Flags } from '@oclif/core'


export default class Setup extends Command {
  static description = 'Automatically check and install system prerequisites'

  static flags = {
    check: Flags.boolean({ char: 'c', description: 'check status only, do not install' }),
    force: Flags.boolean({ char: 'f', description: 'force installation even if already installed' }),
  }

  static examples = [
    'sudo eggs setup                      # install prerequisites',
    'sudo eggs setup --check              # check prerequisites presence',
    'sudo eggs setup --force              # force prerequisites install',
  ]

  /**
   * 
   * @returns 
   */
  public async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Setup)


    if (!Utils.isAppImage()) {
      console.log("The eggs setup command is only used on the AppImage version.")
      process.exit()
    }

    const prerequisites = new Prerequisites()

    if (Utils.isRoot()) {
      // Install autocomplete e manPages
      await Pacman.autocompleteInstall()
      await Pacman.manPageInstall()

      if (flags.check) {
        this.log('Checking system prerequisites...')
        const allInstalled = prerequisites.check()

        if (allInstalled) {
          this.log('SUCCESS: All prerequisites are installed')
          this.log('Your system is ready for penguins-eggs!')
        } else {
          this.log('WARNING: Some prerequisites are missing')
          this.log('Run: eggs setup (without --check) to install them automatically')
        }
        return
      }

      // Setup automatico: check + install
      this.log('Checking current system status...')
      const allInstalled = prerequisites.check()

      if (allInstalled && !flags.force) {
        this.log('SUCCESS: All prerequisites are already installed')
        return
      }

      if (allInstalled && flags.force) {
        this.log('Force flag detected: reinstalling prerequisites...')
      } else {
        this.log('Some prerequisites are missing.')
      }

      this.log('')
      this.log('Starting automatic installation...')
      this.log('This will install system packages and requires sudo privileges.')
      this.log('')

      const success = await prerequisites.install()

      if (success) {
        this.log('')
        this.log('SUCCESS: penguins-eggs setup completed!')
      } else {
        this.log('')
        this.log('ERROR: Setup failed')
        this.log('Please check your system and try again.')
        this.log('You can also install prerequisites manually using your package manager.')
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
