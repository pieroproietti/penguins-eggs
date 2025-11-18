/**
 * ./src/commands/setup.ts
 * penguins-eggs v.25.11.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import {Command, Flags} from '@oclif/core'


export default class SetupCommand extends Command {
  static description = 'Automatically check and install system prerequisites'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --check',
    '<%= config.bin %> <%= command.id %> --force',
  ]

  static flags = {
    check: Flags.boolean({char: 'c', description: 'check status only, do not install'}),
    force: Flags.boolean({char: 'f', description: 'force installation even if already installed'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(SetupCommand)
    const setup = new Setup()

    this.log('Penguins Eggs - System Setup')
    this.log('============================')
    this.log('')

    if (flags.check) {
      // Solo check
      this.log('Checking system prerequisites...')
      const allInstalled = setup.checkPrerequisites()
      
      if (allInstalled) {
        this.log('SUCCESS: All prerequisites are installed')
        this.log('Your system is ready for Penguins Eggs!')
      } else {
        this.log('WARNING: Some prerequisites are missing')
        this.log('Run: eggs setup (without --check) to install them automatically')
      }
      return
    }

    // Setup automatico: check + install
    this.log('Checking current system status...')
    const allInstalled = setup.checkPrerequisites()

    if (allInstalled && !flags.force) {
      this.log('SUCCESS: All prerequisites are already installed')
      this.log('Your system is ready for Penguins Eggs!')
      this.log('')
      this.log('You can now use commands like:')
      this.log('  eggs produce --help')
      this.log('  eggs calamares --help')
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

    const success = await setup.installPrerequisites()
    
    if (success) {
      this.log('')
      this.log('SUCCESS: Penguins Eggs setup completed!')
      this.log('')
      this.log('You can now use all features:')
      this.log('  eggs produce    # Create custom ISO')
      this.log('  eggs calamares  # Install system')
      this.log('  eggs --help     # See all commands')
    } else {
      this.log('')
      this.log('ERROR: Setup failed')
      this.log('Please check your system and try again.')
      this.log('You can also install prerequisites manually using your package manager.')
    }
  }
}
