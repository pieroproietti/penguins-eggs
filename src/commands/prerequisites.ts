import {Command, Flags} from '@oclif/core'
import {execSync} from 'node:child_process'
import {existsSync} from 'node:fs'

export default class Prerequisites extends Command {
  static description = 'Install system prerequisistes for Penguins Eggs'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --auto',
  ]

  static flags = {
    auto: Flags.boolean({char: 'a', description: 'Auto-install without confirmation'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Prerequisites)
    
    this.log('Penguins Eggs Dependency Installer')
    this.log('==================================')

    // Determina la distribuzione
    const distro = await this.detectDistro()
    this.log(`Detected distribution: ${distro}`)

    // Mostra i comandi di installazione
    const installCmd = this.getInstallCommand(distro)
    
    this.log('')
    this.log('Installation command:')
    this.log(`   ${installCmd}`)
    
    if (flags.auto) {
      this.log('')
      this.log('Auto-installing dependencies...')
      this.installDependencies(installCmd)
    } else {
      this.log('')
      this.log('To install automatically, run:')
      this.log(`   eggs install-deps --auto`)
      this.log('')
      this.log('Or run the command above manually with sudo')
    }
  }

  private async detectDistro(): Promise<string> {
    try {
      if (existsSync('/etc/os-release')) {
        const osRelease = execSync('cat /etc/os-release').toString()
        if (osRelease.includes('ID=debian')) return 'debian'
        if (osRelease.includes('ID=ubuntu')) return 'ubuntu' 
        if (osRelease.includes('ID=fedora')) return 'fedora'
        if (osRelease.includes('ID=arch')) return 'arch'
      }
      
      if (existsSync('/etc/redhat-release')) return 'rhel'
      if (existsSync('/etc/arch-release')) return 'arch'
      
      return 'unknown'
    } catch {
      return 'unknown'
    }
  }

  private getInstallCommand(distro: string): string {
    switch (distro) {
      case 'debian':
      case 'ubuntu':
        return 'sudo apt-get update && sudo apt-get install -y squashfs-tools xorriso rsync curl jq git parted cryptsetup dosfstools grub2-common grub-pc-bin grub-efi-amd64-bin isolinux syslinux syslinux-common ipxe lvm2 sshfs gnupg'
      
      case 'fedora':
      case 'rhel':
        return 'sudo dnf install -y squashfs-tools xorriso rsync curl jq git parted cryptsetup dosfstools grub2-tools grub2-tools-extra syslinux ipxe lvm2 sshfs gnupg'
      
      case 'arch':
        return 'sudo pacman -S --noconfirm squashfs-tools libisoburn rsync curl jq git parted cryptsetup dosfstools grub syslinux ipxe lvm2 sshfs gnupg'
      
      default:
        return 'Please install dependencies manually for your distribution'
    }
  }

  private installDependencies(cmd: string): void {
    try {
      execSync(cmd, {stdio: 'inherit'})
      this.log('')
      this.log('SUCCESS: All dependencies installed successfully!')
      this.log('You can now use Penguins Eggs without issues.')
    } catch (error) {
      this.log('ERROR: Failed to install dependencies. Please run the command manually.')
    }
  }
}