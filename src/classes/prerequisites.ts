/**
 * ./src/classes/prerequisites.ts
 * penguins-eggs v.25.11.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */


import { execSync } from 'node:child_process'
import Utils from './utils.js'
import Distro from './distro.js'
import Diversions from './diversions.js'

export class Prerequisites {
  private distro: Distro

  constructor() {
    this.distro = new Distro()
  }


  /**
   * install
   * @returns 
   */
  async install(): Promise<boolean> {
    try {
      const osInfo = Utils.getOsRelease()
      const codenameId = osInfo.VERSION_CODENAME
      const releaseId = osInfo.VERSION_ID
      const distroId = osInfo.ID
      console.log(`distro: ${distroId}/${codenameId} compatible: ${this.distro.distroLike}/${this.distro.distroUniqueId} family: ${this.distro.familyId}`)

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


  /**
   * 
   * @returns 
   */
  check(): boolean {
    try {
      const osInfo = Utils.getOsRelease()
      const codenameId = osInfo.VERSION_CODENAME
      const releaseId = osInfo.VERSION_ID
      const distroId = osInfo.ID
      console.log(`distro: ${distroId}/${codenameId} compatible: ${this.distro.distroLike}/${this.distro.distroUniqueId} family: ${this.distro.familyId}`)

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


  /**
   * 
   * @returns 
   */
  private getPackagesForDistro(): string[] {

    /**
     * normalize as packageList
     */
    let packagesList = this.distro.familyId
    if (this.distro.familyId === 'el9') {
      packagesList = 'fedora'
    }

    if (this.distro.familyId === 'archlinux' && Diversions.isManjaroBased(this.distro.distroLike)) {
      packagesList = 'manjaro'
    }



    /**
     * we select from packageList
     */
    if (packagesList === 'alpine') {
      return [
        'alpine-conf', 
        'apk-tools', 
        'bash', 
        'bash-completion', 
        'cryptsetup', 
        'curl', 
        'device-mapper-libs', 
        'dosfstools', 
        'fuse', 
        'git', 
        'grub-bios',
        'grub-efi', 
        'jq', 
        'lsblk', 
        'lvm2', 
        'mkinitfs', 
        'musl-locales', 
        'nodejs', 
        'parted', 
        'polkit', 
        'rsync', 
        'shadow', 
        'squashfs-tools', 
        'sshfs', 
        'xorriso', 
        'zstd', 
        'libc6-compat',
      ]
      
    } else if (packagesList === 'archlinux') {
      return [
        'arch-install-scripts',
        'cryptsetup',
        'curl',
        'dosfstools',
        'efibootmgr',
        'erofs-utils',
        'findutils',
        'fuse2',
        'git',
        'gnupg',
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
      ]

    } else if (packagesList === 'debian') {
      return [
        'cryptsetup',
        'curl',
        'dosfstools',
        'fuse',
        'git',
        'gnupg',
        'grub-efi-amd64-bin',
        'grub-pc-bin',
        'grub2-common',
        'ipxe',
        'isolinux',
        'jq',
        'libfuse2t64',
        'lvm2',
        'nodejs',
        'parted',
        'rsync',
        'squashfs-tools',
        'sshfs',
        'syslinux-common',
        'syslinux',
        'xorriso',
      ]

    } else if (packagesList === 'fedora') {
      return [
        'cryptsetup',
        'curl',
        'device-mapper',
        'dosfstools',
        'dracut-live',
        'dracut',
        'efibootmgr',
        'fuse',
        'git',
        'jq',
        'lvm2',
        'nodejs',
        'nvme-cli',
        'parted',
        'polkit',
        'rsync',
        'squashfs-tools',
        'sshfs',
        'wget',
        'xdg-utils',
        'xorriso',
        'zstd',
      ]

    } else if (packagesList === 'manjaro') {
      return [
        'arch-install-scripts',
        'curl',
        'dosfstools',
        'efibootmgr',
        'erofs-utils',
        'findutils',
        'fuse2',
        'git',
        'gnupg',
        'grub',
        'jq',
        'libarchive',
        'libisoburn',
        'lvm2',
        'manjaro-tools-iso',
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
        'wget',
        'xdg-utils',
      ]

    } else if (packagesList === 'opensuse') {
      return [
        'cryptsetup',
        'curl',
        'device-mapper',
        'dosfstools',
        'dracut-kiwi-live',
        'dracut',
        'efibootmgr',
        'fuse-sshfs',
        'fuse',
        'git',
        'jq',
        'lvm2',
        'nodejs',
        'nvme-cli',
        'parted',
        'polkit',
        'rsync',
        'squashfs-tools',
        'wget',
        'xdg-utils',
        'xorriso',
        'zstd',
      ]

    } else {
      console.log(`This distro ${this.distro.distroId}/${this.distro.codenameId} is not yet recognized!`)
      return []
    }
  }


  /**
   * 
   * @param packages 
   * @returns 
   */
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


  /**
   * 
   * @param pkg 
   * @returns 
   */
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
}
