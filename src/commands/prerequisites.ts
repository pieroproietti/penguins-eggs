import {Command, Flags} from '@oclif/core'
import {execSync} from 'node:child_process'
import {existsSync} from 'node:fs'

export default class Prerequisites extends Command {
  static description = 'Check, install or remove system prerequisites'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --install',
    '<%= config.bin %> <%= command.id %> --remove',
    '<%= config.bin %> <%= command.id %> --check',
    '<%= config.bin %> <%= command.id %> --install --auto',
    '<%= config.bin %> <%= command.id %> --remove --auto',
  ]

  static flags = {
    install: Flags.boolean({description: 'install prerequisites'}),
    remove: Flags.boolean({description: 'remove prerequisites'}),
    check: Flags.boolean({description: 'check prerequisites status'}),
    auto: Flags.boolean({description: 'run without confirmation'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Prerequisites)
    
    this.log('Penguins Eggs - System Prerequisites')
    this.log('=====================================')

    const distro = await this.detectDistro()
    this.log(`Detected distribution: ${distro}`)

    if (distro === 'unknown') {
      this.log('ERROR: Could not detect your Linux distribution')
      this.log('Please install dependencies manually for your system.')
      return
    }

    // Se nessun flag, mostra status
    if (!flags.install && !flags.remove && !flags.check) {
      await this.showStatus(distro)
      return
    }

    if (flags.check) {
      await this.showStatus(distro)
    }

    if (flags.install) {
      await this.handleInstall(distro, flags.auto)
    }

    if (flags.remove) {
      await this.handleRemove(distro, flags.auto)
    }
  }

  private async showStatus(distro: string): Promise<void> {
    const packages = this.getPackages(distro)
    
    this.log('')
    this.log('Prerequisites status:')
    this.log('')

    let allInstalled = true
    let installedCount = 0
    const totalCount = packages.length

    for (const pkg of packages) {
      const isInstalled = this.isPackageInstalled(distro, pkg)
      const status = isInstalled ? '[INSTALLED]' : '[MISSING]  '
      this.log(`  ${status} ${pkg}`)
      
      if (isInstalled) {
        installedCount++
      } else {
        allInstalled = false
      }
    }

    this.log('')
    this.log(`Progress: ${installedCount}/${totalCount} packages installed`)
    
    if (allInstalled) {
      this.log('SUCCESS: All prerequisites are installed!')
      this.log('You can now use all Penguins Eggs features.')
    } else {
      this.log('WARNING: Some prerequisites are missing.')
      this.log('')
      this.log('To install missing packages, run:')
      this.log(`  eggs prerequisites --install`)
      this.log('')
      this.log('For automatic installation:')
      this.log(`  eggs prerequisites --install --auto`)
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
      this.log(`  eggs prerequisites --install --auto`)
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
    this.log('⚠️  WARNING: This will remove system packages!')
    this.log('Make sure you understand what you are removing.')
    this.log('Some of these packages might be used by other applications.')
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
      this.log(`  eggs prerequisites --remove --auto`)
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
          'syslinux-common', 'ipxe', 'lvm2', 'sshfs', 'gnupg',
          'fuse', 'libfuse2'
        ]
      
      case 'fedora':
      case 'rhel':
        return [
          'squashfs-tools', 'xorriso', 'rsync', 'curl', 'jq', 'git',
          'parted', 'cryptsetup', 'dosfstools', 'grub2-tools',
          'grub2-tools-extra', 'syslinux', 'ipxe', 'lvm2', 'sshfs', 'gnupg',
          'fuse', 'fuse-libs'
        ]
      
      case 'arch':
        return [
          'squashfs-tools', 'libisoburn', 'rsync', 'curl', 'jq', 'git',
          'parted', 'cryptsetup', 'dosfstools', 'grub', 'syslinux',
          'ipxe', 'lvm2', 'sshfs', 'gnupg',
          'fuse2'
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
        return `echo "Unsupported distribution: ${distro}"`
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
        return `echo "Unsupported distribution: ${distro}"`
    }
  }

  private executeCommand(cmd: string, action: 'install' | 'remove'): void {
    try {
      this.log('')
      this.log(`Executing: ${cmd}`)
      this.log('')
      
      execSync(cmd, {stdio: 'inherit'})
      
      this.log('')
      this.log(`SUCCESS: Dependencies ${action}ed successfully!`)
      
      if (action === 'install') {
        this.log('You can now use all Penguins Eggs features.')
      } else {
        this.log('Prerequisites have been removed from your system.')
      }
    } catch (error) {
      this.log('')
      this.log(`ERROR: Failed to ${action} dependencies.`)
      this.log('This might be due to:')
      this.log('  - Network connectivity issues')
      this.log('  - Package repository problems') 
      this.log('  - Insufficient permissions')
      this.log('')
      this.log('Please check your system and try again.')
    }
  }

  private isPackageInstalled(distro: string, pkg: string): boolean {
    try {
      switch (distro) {
        case 'debian':
        case 'ubuntu':
          // Verifica se il pacchetto è installato con dpkg
          const result = execSync(`dpkg -l | grep "^ii\\s*${pkg}\\s"`, {stdio: 'pipe'}).toString()
          return result.trim().length > 0
          
        case 'fedora':
        case 'rhel':
          execSync(`rpm -q ${pkg}`, {stdio: 'ignore'})
          return true
          
        case 'arch':
          execSync(`pacman -Q ${pkg}`, {stdio: 'ignore'})
          return true
          
        default:
          return false
      }
    } catch {
      return false
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
        if (osRelease.includes('ID=rocky')) return 'rhel'
        if (osRelease.includes('ID=alma')) return 'rhel'
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
