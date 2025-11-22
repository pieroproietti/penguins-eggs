/**
 * ./src/appimage/prerequisites.ts
 * penguins-eggs v.25.11.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { execSync } from 'node:child_process'
import Utils from '../classes/utils.js'
import Distro from '../classes/distro.js'
import Diversions from '../classes/diversions.js'
import { DependencyManager } from './dependency-manager.js'
import * as path from 'path';

/**
 * 
 */
export class Prerequisites {
  private distro: Distro

  constructor() {
    this.distro = new Distro()
  }


  /**
   * install
   * @returns 
   */
  async install(force = false): Promise<boolean> {

    const packagesAll = this.getPackagesForDistro()

    if (packagesAll.length === 0) {
      console.log('ERROR: Unsupported distribution for automatic setup')
      return false
    }

    let packages = packagesAll.filter(pkg => !this.isPackageInstalled(pkg))
    if (force) {
      packages = packagesAll
    }


    console.log('')
    console.log('The following packages will be installed/reinstalled:')
    console.log(`${packages.join(', ')}`)
    console.log('')
    if (await Utils.customConfirm('Select yes to continue...')) {
      const installCmd = this.getInstallCommand(packages, force)
      Utils.titles(installCmd)

      try {
        console.log('Installing packages (this may take a few minutes)...')
        //execSync(installCmd, { stdio: 'inherit' })
        execSync(installCmd, { stdio: 'ignore' })

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
    return false
  }



  /**
   * 
   * @returns 
   */
  check(): boolean {
    try {
      const packages = this.getPackagesForDistro()
      if (packages.length === 0) {
        console.log('WARNING: Unsupported distribution - cannot check prerequisites')
        return false
      }

      const missing = packages.filter(pkg => !this.isPackageInstalled(pkg))

      if (missing.length > 0) {
        console.log(`MISSING: ${missing.length} of ${packages.length} packages`)
        console.log(`${missing.join(', ')}`)
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
   * @param packages 
   * @returns 
   */
  private getInstallCommand(packages: string[], forceReinstall: boolean = false): string {
    const packagesStr = packages.join(' ');

    switch (this.distro.familyId) {
      case 'debian':
        // apt richiede il flag --reinstall per forzare la sovrascrittura
        const aptCmd = forceReinstall ? 'install --reinstall' : 'install';
        return `sudo apt-get update && sudo apt-get ${aptCmd} -y ${packagesStr}`;

      case 'archlinux':
        // Pacman -S reinstalla di default. 
        // (Se volessimo evitare reinstallazioni su Arch useremmo --needed, ma qui va bene così)
        return `sudo pacman -S --noconfirm ${packagesStr}`;

      case 'fedora':
        // dnf ha un comando specifico 'reinstall'
        const dnfCmd = forceReinstall ? 'reinstall' : 'install';
        return `sudo dnf ${dnfCmd} -y ${packagesStr}`;

      default:
        return `echo "Unsupported distribution: ${this.distro.familyId}"`;
    }
  }

  /**
   * 
   * @param pkg 
   * @returns 
   */
  private isPackageInstalled(pkg: string): boolean {
    /**
     * normalize familyId
     */
    let familyId = this.distro.familyId
    if (this.distro.familyId === 'el9') {
      familyId = 'fedora'
    }

    try {
      switch (familyId) {
        case 'debian':
          execSync(`dpkg -s ${pkg}`, { stdio: 'ignore' })
          return true

        case 'archlinux':
          // patch manjaro-tools-iso
          if (pkg.includes('manjaro-tools-iso'))
            return false

          try {
            execSync(`pacman -T ${pkg}`, { stdio: 'ignore' });
            return true;
          } catch (e) {
            return false;
          }

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


  /**
   * 
   * @returns 
   */
  private installMetaPackage() {

    /**
     * normalize as familyId
     */
    let familyId = this.distro.familyId
    if (this.distro.familyId === 'archlinux' && Diversions.isManjaroBased(this.distro.distroLike)) {
      familyId = 'manjaro'
    }

    // Definiamo dove si trova la root dell'applicazione a runtime
    // In ambiente di sviluppo è diverso da AppImage, quindi gestiamo entrambi
    let appRoot = '';
    if (process.env.APPDIR) {
      // Se la cartella è in /usr/share/eggs/appimage-deps:
      appRoot = path.join(process.env.APPDIR, 'usr/share/eggs');
    } else {
      // Siamo in sviluppo locale (es. ~/penguins-eggs)
      appRoot = process.cwd();
    }

    // Chiamata al metodo statico
    try {
      const success = DependencyManager.installDrivers(familyId, appRoot);
      if (success) {
        console.log("Dipendenze installate correttamente.");
      } else {
        console.log("Nessuna dipendenza specifica installata (o pacchetto non trovato).");
      }
    } catch (e) {
      console.error("Installazione fallita. Impossibile procedere.");
      process.exit(1);
    }
  }
}

