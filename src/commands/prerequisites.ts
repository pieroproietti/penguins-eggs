import {Command, Flags} from '@oclif/core'
import {execSync} from 'node:child_process'
import {existsSync} from 'node:fs'

export default class Prerequisites extends Command {
  static description = 'Install or remove system prerequisites for Penguins Eggs'

  static examples = [
    '<%= config.bin %> <%= command.id %> --add',
    '<%= config.bin %> <%= command.id %> --remove',
  ]

  static flags = {
    add: Flags.boolean({char: 'a', description: 'install prerequisites'}),
    remove: Flags.boolean({char: 'r', description: 'remove prerequisites'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Prerequisites)
    
    this.log('Penguins Eggs Dependency Manager')
    this.log('================================')

    // Verifica che sia specificato add o remove
    if (!flags.add && !flags.remove) {
      this.log('ERROR: Please specify --add to install or --remove to uninstall')
      this.log('')
      this.log('Examples:')
      this.log('  eggs prerequisites --add     # Install dependencies')
      this.log('  eggs prerequisites --remove  # Remove dependencies')
      return
    }

    // Determina la distribuzione
    const distro = await this.detectDistro()
    this.log(`Detected distribution: ${distro}`)

    if (distro === 'unknown') {
      this.log('ERROR: Could not detect your Linux distribution')
      return
    }

    // Gestisce installazione o rimozione
    if (flags.add) {
      await this.handleInstall(distro, flags.auto)
    } else if (flags.remove) {
      await this.handleRemove(distro, flags.auto)
    }
  }

  private async handleInstall(distro: string, auto: boolean): Promise<void> {
    const installCmd = this.getInstallCommand(distro)
    const packages = this.getPackages(distro)
    
    this.log('')
    this.log('The following packages will be installed:')
    packages.forEach(pkg => {
      this.log(`  - ${pkg}`)
    })

    this.log('')
    this.log('Installation command:')
    this.log(`  ${installCmd}`)

    if (auto) {
      this.log('')
      this.log('Auto-installing dependencies...')
      this.executeCommand(installCmd, 'install')
    } else {
      this.log('')
      this.log('To install automatically, run:')
      this.log(`  eggs prerequisites --add`)
      this.log('')
      this.log('Or run the command above manually with sudo')
    }
  }

  private async handleRemove(distro: string, auto: boolean): Promise<void> {
    const removeCmd = this.getRemoveCommand(distro)
    const packages = this.getPackages(distro)
    
    this.log('')
    this.log('The following packages will be removed:')
    packages.forEach(pkg => {
      this.log(`  - ${pkg}`)
    })

    this.log('')
    this.log('WARNING: This will remove system packages!')
    this.log('Make sure you understand what you are removing.')
    this.log('')
    this.log('Removal command:')
    this.log(`  ${removeCmd}`)

    if (auto) {
      this.log('')
      this.log('Auto-removing dependencies...')
      this.executeCommand(removeCmd, 'remove')
    } else {
      this.log('')
      this.log('To remove automatically, run:')
      this.log(`  eggs prerequisites --remove`)
      this.log('')
      this.log('Or run the command above manually with sudo')
    }
  }

  private getPackages(distro: string): string[] {
    switch (distro) {
      case 'debian':
      case 'ubuntu':
        return [
          'squashfs-tools', 'xorriso', 'rsync', 'curl', 'jq', 'git',
          'parted', 'cryptsetup', 'dosfstools', 'grub2-common',
          'grub-pc-bin', 'grub-efi-amd64-bin', 'isolinux', 'syslinux',
          'syslinux-common', 'ipxe', 'lvm2', 'sshfs', 'gnupg'
        ]
      
      case 'fedora':
      case 'rhel':
        return [
          'squashfs-tools', 'xorriso', 'rsync', 'curl', 'jq', 'git',
          'parted', 'cryptsetup', 'dosfstools', 'grub2-tools',
          'grub2-tools-extra', 'syslinux', 'ipxe', 'lvm2', 'sshfs', 'gnupg'
        ]
      
      case 'arch':
        return [
          'squashfs-tools', 'libisoburn', 'rsync', 'curl', 'jq', 'git',
          'parted', 'cryptsetup', 'dosfstools', 'grub', 'syslinux',
          'ipxe', 'lvm2', 'sshfs', 'gnupg'
        ]
      
      default:
        return []
    }
  }

  private getInstallCommand(distro: string): string {
    const packages = this.getPackages(distro).join(' ')
    
    switch (distro) {
      case 'debian':
      case 'ubuntu':
        return `sudo apt-get update && sudo apt-get install -y ${packages}`
      
      case 'fedora':
      case 'rhel':
        return `sudo dnf install -y ${packages}`
      
      case 'arch':
        return `sudo pacman -S --noconfirm ${packages}`
      
      default:
        return 'echo "Unsupported distribution"'
    }
  }

  private getRemoveCommand(distro: string): string {
    const packages = this.getPackages(distro).join(' ')
    
    switch (distro) {
      case 'debian':
      case 'ubuntu':
        return `sudo apt-get remove -y ${packages}`
      
      case 'fedora':
      case 'rhel':
        return `sudo dnf remove -y ${packages}`
      
      case 'arch':
        return `sudo pacman -Rs --noconfirm ${packages}`
      
      default:
        return 'echo "Unsupported distribution"'
    }
  }

  private executeCommand(cmd: string, action: 'install' | 'remove'): void {
    try {
      execSync(cmd, {stdio: 'inherit'})
      this.log('')
      this.log(`SUCCESS: Dependencies ${action}ed successfully!`)
    } catch (error) {
      this.log('')
      this.log(`ERROR: Failed to ${action} dependencies.`)
      this.log('Please check your system and try again.')
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
        if (osRelease.includes('ID=rhel')) return 'rhel'
        if (osRelease.includes('ID=centos')) return 'rhel'
      }
      
      if (existsSync('/etc/redhat-release')) return 'rhel'
      if (existsSync('/etc/arch-release')) return 'arch'
      if (existsSync('/etc/debian_version')) return 'debian'
      
      return 'unknown'
    } catch {
      return 'unknown'
    }
  }
}
