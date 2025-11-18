/**
 * ./src/classes/setup.ts
 * penguins-eggs v.25.11.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */


import { execSync } from 'node:child_process'
import Distro from './distro.js'
import Diversions from './diversions.js'

export class Setup {
  private distro: Distro

  constructor() {
    this.distro = new Distro()
  }

  async installPrerequisites(): Promise<boolean> {
    try {
      console.log('Penguins Eggs - System Setup')
      console.log('============================')

      console.log(`Detected: ${this.distro.distroLike} ${this.distro.codenameId}`)
      console.log(`Family: ${this.distro.familyId}`)

      const packages = this.getPackagesForDistro()

      if (packages.length === 0) {
        console.log('ERROR: Unsupported distribution for automatic setup')
        return false
      }

      console.log('')
      console.log('The following packages will be installed:')
      packages.forEach(pkg => console.log(`  - ${pkg}`))

      const installCmd = this.getInstallCommand(packages)

      console.log('')
      console.log('Installation command:')
      console.log(`  ${installCmd}`)
      console.log('')

      // Esegui l'installazione
      console.log('Installing packages (this may take a few minutes)...')
      execSync(installCmd, { stdio: 'inherit' })

      console.log('')
      console.log('SUCCESS: Prerequisites installed successfully!')
      return true

    } catch (error) {
      console.log('')
      console.log('ERROR: Failed to install prerequisites')
      console.log('Error details:', error instanceof Error ? error.message : 'Unknown error')
      console.log('')
      console.log('Please check your system and try again.')
      console.log('You can also install prerequisites manually using your package manager.')
      return false
    }
  }

  private getPackagesForDistro(): string[] {

    switch (this.distro.familyId) {
      case 'debian':
        return [
          'squashfs-tools', 'xorriso', 'rsync', 'curl', 'jq', 'git',
          'parted', 'cryptsetup', 'dosfstools', 'grub2-common',
          'grub-pc-bin', 'grub-efi-amd64-bin', 'isolinux', 'syslinux',
          'syslinux-common', 'ipxe', 'lvm2', 'sshfs', 'gnupg',
          'fuse', 'libfuse2'
        ]

      case 'archlinux':
        if (Diversions.isManjaroBased(this.distro.distroLike)) {
          console.log('create packages list')
          // Manjaro
          return []
        } else {
          // archlinuxx
          return [
            'arch-install-scripts',
            'cryptsetup',
            'dosfstools',
            'efibootmgr',
            'erofs-utils',
            'findutils',
            'git',
            'grub',
            'jq',
            'libarchive',
            'libisoburn',
            'lvm2',
            'mkinitcpio-archiso',
            'mkinitcpio-nfs-utils',
            'mtools',
            'nbd',
            'nodejs',
            'pacman-contrib',
            'parted',
            'polkit',
            'procps-ng',
            'pv',
            'python',
            'rsync',
            'squashfs-tools',
            'sshfs',
            'syslinux',
            'wget',
            'xdg-utils',

            // Aggiunti per compatibilità
            'fuse2',
            'gnupg',
            'curl'
          ]

        }

      case 'fedora':
      case 'fedora':
      case 'ef9':
        return [
          'cryptsetup', 'curl', 'device-mapper', 'dosfstools', 'dracut',
          'efibootmgr', 'fuse', 'git', 'jq', 'lvm2', 'nodejs', 'nvme-cli',
          'parted', 'polkit', 'rsync', 'wget', 'xdg-utils', 'xorriso',
          'zstd', 'sshfs', 'dracut-live', 'squashfs-tools'
        ]

      case 'opensuse':
      case 'suse':
        return [
          'cryptsetup', 'curl', 'device-mapper', 'dosfstools', 'dracut',
          'efibootmgr', 'fuse', 'git', 'jq', 'lvm2', 'nodejs', 'nvme-cli',
          'parted', 'polkit', 'rsync', 'wget', 'xdg-utils', 'xorriso',
          'zstd', 'fuse-sshfs', 'dracut-kiwi-live', 'squashfs-tools'
        ]

      default:
        console.log(`Debug: Unsupported familyId: '${this.distro.familyId}'`)
        return []
    }
  }


  private getInstallCommand(packages: string[]): string {
    const packagesStr = packages.join(' ')

    switch (this.distro.familyId) {
      case 'debian':
        return `sudo apt-get update && sudo apt-get install -y ${packagesStr}`

      case 'archlinux':
        return `sudo pacman -S --noconfirm ${packagesStr}`

      case 'fedora':
        return `sudo dnf install -y ${packagesStr}`

      default:
        return `echo "Unsupported distribution: ${this.distro.familyId}"`
    }
  }

  // Metodo per verificare se i prerequisiti sono già installati
  checkPrerequisites(): boolean {
    try {
      const packages = this.getPackagesForDistro()

      if (packages.length === 0) {
        console.log('WARNING: Unsupported distribution - cannot check prerequisites')
        return false
      }

      const missing = packages.filter(pkg => !this.isPackageInstalled(pkg))

      if (missing.length > 0) {
        console.log(`MISSING: ${missing.length} of ${packages.length} packages`)
        console.log('Missing packages:')
        missing.forEach(pkg => console.log(`  - ${pkg}`))
        return false
      }

      console.log(`SUCCESS: All ${packages.length} packages are installed`)
      return true

    } catch (error) {
      console.log('ERROR: Failed to check prerequisites')
      console.log('Error details:', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  private isPackageInstalled(pkg: string): boolean {
    try {
      switch (this.distro.familyId) {
        case 'debian':
          // Verifica se il pacchetto è installato
          execSync(`dpkg -s ${pkg}`, { stdio: 'ignore' })
          return true

        case 'archlinux':
          // Verifica se il pacchetto è installato su Arch
          execSync(`pacman -Q ${pkg}`, { stdio: 'ignore' })
          return true

        case 'fedora':
          // Verifica se il pacchetto è installato su fedora/Fedora
          execSync(`rpm -q ${pkg}`, { stdio: 'ignore' })
          return true

        default:
          return false
      }
    } catch {
      return false
    }
  }

  // Metodo per ottenere informazioni sulla distribuzione (utile per debug)
  getDistroInfo(): string {
    return `
Distribution: ${this.distro.distroLike}
Codename: ${this.distro.codenameId}
Family: ${this.distro.familyId}
    `.trim()
  }
}