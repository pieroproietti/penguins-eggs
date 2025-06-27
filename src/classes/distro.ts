/**
 * penguins-eggs - Refactored distros.ts
 * class: distro.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import yaml from 'js-yaml'
import fs from 'node:fs'
import path from 'node:path'
import shell from 'shelljs'
import { IDistro } from '../interfaces/index.js'
import Utils from './utils.js'
import Diversions from './diversions.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Configuration for different distribution families
 */
interface FamilyConfig {
  familyId: string
  distroLike: string
  codenameId: string
  codenameLikeId: string
  liveMediumPath: string
  squashfs?: string
  usrLibPath?: string
  isCalamaresAvailable?: boolean
}

/**
 * Default configurations for each family
 */
const FAMILY_CONFIGS: Record<string, FamilyConfig> = {
  debian: {
    familyId: 'debian',
    distroLike: 'Debian',
    codenameId: '',
    codenameLikeId: '',
    liveMediumPath: '/run/live/medium/',
    isCalamaresAvailable: true
  },
  archlinux: {
    familyId: 'archlinux',
    distroLike: 'Arch',
    codenameId: 'rolling',
    codenameLikeId: 'rolling',
    liveMediumPath: '/run/archiso/bootmnt/',
    squashfs: 'arch/x86_64/airootfs.sfs'
  },
  fedora: {
    familyId: 'fedora',
    distroLike: 'Fedora',
    codenameId: 'rolling',
    codenameLikeId: 'fedora',
    liveMediumPath: '/run/initramfs/live/'
  },
  alpine: {
    familyId: 'alpine',
    distroLike: 'Alpine',
    codenameId: 'rolling',
    codenameLikeId: 'alpine',
    liveMediumPath: '/mnt/'
  },
  opensuse: {
    familyId: 'opensuse',
    distroLike: 'Opensuse',
    codenameId: 'rolling',
    codenameLikeId: 'opensuse',
    liveMediumPath: '/run/initramfs/live/',
    usrLibPath: '/usr/lib64/'
  },
  openmamba: {
    familyId: 'openmamba',
    distroLike: 'openmamba',
    codenameId: 'rolling',
    codenameLikeId: 'openmamba',
    liveMediumPath: '/run/initramfs/live/'
  },
  voidlinux: {
    familyId: 'voidlinux',
    distroLike: 'Voidlinux',
    codenameId: 'rolling',
    codenameLikeId: 'voidlinux',
    liveMediumPath: '/run/initramfs/live/'
  }
}

/**
 * Special codename configurations
 */
const CODENAME_CONFIGS: Record<string, Partial<FamilyConfig>> = {
  // Debian versions
  jessie: { distroLike: 'Debian', codenameLikeId: 'jessie', liveMediumPath: '/lib/live/mount/medium/', isCalamaresAvailable: false },
  stretch: { distroLike: 'Debian', codenameLikeId: 'stretch', liveMediumPath: '/lib/live/mount/medium/', isCalamaresAvailable: false },
  buster: { distroLike: 'Debian', codenameLikeId: 'buster' },
  bullseye: { distroLike: 'Debian', codenameLikeId: 'bullseye' },
  bookworm: { distroLike: 'Debian', codenameLikeId: 'bookworm' },
  trixie: { distroLike: 'Debian', codenameLikeId: 'trixie' },
  
  // Devuan versions
  beowulf: { distroLike: 'Devuan', codenameLikeId: 'beowulf' },
  chimaera: { distroLike: 'Devuan', codenameLikeId: 'chimaera' },
  daedalus: { distroLike: 'Devuan', codenameLikeId: 'daedalus' },
  excalibur: { distroLike: 'Devuan', codenameLikeId: 'excalibur' },
  
  // Ubuntu versions
  bionic: { distroLike: 'Ubuntu', codenameLikeId: 'bionic', liveMediumPath: '/lib/live/mount/medium/' },
  focal: { distroLike: 'Ubuntu', codenameLikeId: 'focal' },
  jammy: { distroLike: 'Ubuntu', codenameLikeId: 'jammy' },
  noble: { distroLike: 'Ubuntu', codenameLikeId: 'noble' },
  devel: { distroLike: 'Ubuntu', codenameLikeId: 'devel' }
}

/**
 * Distribution family detector
 */
class DistroDetector {
  static detectByDistroId(distroId: string): string | null {
    const fedoraDistros = ['Almalinux', 'Fedora', 'Nobara', 'Rocky']
    
    if (distroId === 'Alpine') return 'alpine'
    if (fedoraDistros.includes(distroId)) return 'fedora'
    if (distroId === 'Openmamba') return 'openmamba'
    if (distroId.includes('Opensuse')) return 'opensuse'
    if (distroId === 'Voidlinux') return 'voidlinux'
    
    return null
  }
  
  static detectByCodename(codenameId: string): string | null {
    if (codenameId === 'rolling' || codenameId === 'n/a') return 'archlinux'
    if (CODENAME_CONFIGS[codenameId]) return 'debian' // All debian-family codenames
    
    return null
  }
  
  static detectFromDerivatives(distroId: string, codenameId: string): { familyId: string, config: Partial<FamilyConfig> } | null {
    // Check debian/arch derivatives
    const derivativesPath = this.getDerivativesPath('derivatives.yaml')
    if (fs.existsSync(derivativesPath)) {
      const result = this.searchInDerivatives(derivativesPath, codenameId)
      if (result) return result
    }
    
    // Check fedora derivatives
    const fedoraDerivativesPath = this.getDerivativesPath('derivatives_fedora.yaml')
    if (fs.existsSync(fedoraDerivativesPath)) {
      const result = this.searchInFedoraDerivatives(fedoraDerivativesPath, distroId)
      if (result) return result
    }
    
    return null
  }
  
  private static getDerivativesPath(filename: string): string {
    const userPath = `/etc/penguins-eggs.d/${filename}`
    const defaultPath = path.resolve(__dirname, `../../conf/${filename}`)
    
    return fs.existsSync(userPath) ? userPath : defaultPath
  }
  
  private static searchInDerivatives(filePath: string, codenameId: string): { familyId: string, config: Partial<FamilyConfig> } | null {
    try {
      interface IDistros {
        distroLike: string
        family: string
        id: string
        ids: string[]
      }
      
      const content = fs.readFileSync(filePath, 'utf8')
      const distros = yaml.load(content) as IDistros[]
      
      for (const distro of distros) {
        if (distro.ids?.includes(codenameId)) {
          return {
            familyId: distro.family,
            config: {
              distroLike: distro.distroLike,
              codenameLikeId: distro.id,
              familyId: distro.family
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read derivatives file ${filePath}:`, error)
    }
    
    return null
  }
  
  private static searchInFedoraDerivatives(filePath: string, distroId: string): { familyId: string, config: Partial<FamilyConfig> } | null {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const distros = yaml.load(content) as string[]
      
      if (distros.includes(distroId)) {
        return {
          familyId: 'fedora',
          config: {
            familyId: 'fedora',
            distroLike: 'Fedora',
            codenameId: 'rolling',
            codenameLikeId: 'fedora',
            liveMediumPath: '/run/initramfs/live/'
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read fedora derivatives file ${filePath}:`, error)
    }
    
    return null
  }
}

/**
 * OS Release parser
 */
class OsReleaseParser {
  static parseUrls(): { homeUrl: string, supportUrl: string, bugReportUrl: string } {
    const defaultUrls = {
      homeUrl: 'https://penguins-eggs.net',
      supportUrl: 'https://penguins-eggs.net',
      bugReportUrl: 'https://github.com/pieroproietti/penguins-eggs/issues'
    }
    
    const osReleasePath = '/etc/os-release'
    if (!fs.existsSync(osReleasePath)) {
      return defaultUrls
    }
    
    try {
      const data = fs.readFileSync(osReleasePath, 'utf8')
      const lines = data.split('\n')
      const result = { ...defaultUrls }
      
      for (const line of lines) {
        if (line.startsWith('HOME_URL=')) {
          result.homeUrl = line.slice('HOME_URL='.length).replaceAll('"', '')
        } else if (line.startsWith('SUPPORT_URL=')) {
          result.supportUrl = line.slice('SUPPORT_URL='.length).replaceAll('"', '')
        } else if (line.startsWith('BUG_REPORT_URL=')) {
          result.bugReportUrl = line.slice('BUG_REPORT_URL='.length).replaceAll('"', '')
        }
      }
      
      return result
    } catch (error) {
      console.warn('Warning: Could not parse /etc/os-release:', error)
      return defaultUrls
    }
  }
}

/**
 * Distribution configurator
 */
class DistroConfigurator {
  static applySpecialConfigurations(config: FamilyConfig & IDistro): void {
    // Apply family-specific configurations
    this.applyFamilySpecificConfig(config)
    
    // Apply distro-specific configurations
    this.applyDistroSpecificConfig(config)
  }
  
  private static applyFamilySpecificConfig(config: FamilyConfig & IDistro): void {
    // Debian family: dynamic usrLibPath
    if (config.familyId === 'debian') {
      config.usrLibPath = '/usr/lib/' + Utils.usrLibPath()
    }
    
    // OpenSUSE: specific usrLibPath
    if (config.familyId === 'opensuse') {
      config.usrLibPath = '/usr/lib64/'
    }
  }
  
  private static applyDistroSpecificConfig(config: FamilyConfig & IDistro): void {
    // Manjaro-based distributions
    if (Diversions.isManjaroBased(config.distroId)) {
      config.liveMediumPath = '/run/miso/bootmnt/'
      config.squashfs = 'manjaro/x86_64/livefs.sfs'
      config.codenameId = shell.exec('lsb_release -cs', { silent: true }).stdout.toString().trim()
    }
    
    // BigLinux variants
    if (config.distroId.includes('Biglinux')) {
      config.distroId = 'Biglinux'
    }
    
    if (config.distroId.includes('Bigcommunity')) {
      config.distroId = 'Bigcommunity'
    }
    
    // Debian sid → trixie
    if (config.distroId === 'Debian' && config.codenameId === 'sid') {
      config.codenameId = 'trixie'
    }
  }
}

/**
 * Main Distro class - Refactored
 */
class Distro implements IDistro {
  bugReportUrl!: string
  codenameId!: string
  codenameLikeId!: string
  distroId!: string
  distroLike!: string
  familyId!: string
  homeUrl!: string
  isCalamaresAvailable!: boolean
  liveMediumPath!: string
  releaseId!: string
  squashfs!: string
  supportUrl!: string
  syslinuxPath!: string
  usrLibPath!: string

  /**
   * Constructor - Now much cleaner and focused
   */
  constructor() {
    // Initialize with defaults
    this.initializeDefaults()
    
    // Get OS information
    const osInfo = Utils.getOsRelease()
    this.distroId = osInfo.ID
    this.codenameId = osInfo.VERSION_CODENAME
    this.releaseId = osInfo.VERSION_ID
    
    // Configure the distribution
    this.configure()
  }
  
  /**
   * Initialize with default values
   */
  private initializeDefaults(): void {
    const defaultConfig = FAMILY_CONFIGS.debian
    const urls = OsReleaseParser.parseUrls()
    
    Object.assign(this, defaultConfig, urls, {
      squashfs: 'live/filesystem.squashfs',
      syslinuxPath: path.resolve(__dirname, '../../syslinux'),
      usrLibPath: '/usr/lib',
      isCalamaresAvailable: true
    })
  }
  
  /**
   * Main configuration logic
   */
  private configure(): void {
    try {
      // Step 1: Detect family by distro ID
      let familyId = DistroDetector.detectByDistroId(this.distroId)
      
      // Step 2: If not found, detect by codename
      if (!familyId) {
        familyId = DistroDetector.detectByCodename(this.codenameId)
      }
      
      // Step 3: Apply family configuration
      if (familyId && FAMILY_CONFIGS[familyId]) {
        this.applyFamilyConfig(familyId)
      } else {
        // Step 4: Check derivatives
        const derivativeResult = DistroDetector.detectFromDerivatives(this.distroId, this.codenameId)
        
        if (derivativeResult) {
          this.applyCustomConfig(derivativeResult.familyId, derivativeResult.config)
        } else {
          this.handleUnknownDistro()
          return
        }
      }
      
      // Step 5: Apply codename-specific configurations
      this.applyCodenameConfig()
      
      // Step 6: Apply special configurations
      DistroConfigurator.applySpecialConfigurations(this as any)
      
    } catch (error) {
      console.error('Error during distro configuration:', error)
      this.handleUnknownDistro()
    }
  }
  
  /**
   * Apply family-based configuration
   */
  private applyFamilyConfig(familyId: string): void {
    const config = FAMILY_CONFIGS[familyId]
    this.familyId = config.familyId
    this.distroLike = config.distroLike
    
    if (config.codenameId) this.codenameId = config.codenameId
    if (config.codenameLikeId) this.codenameLikeId = config.codenameLikeId
    if (config.liveMediumPath) this.liveMediumPath = config.liveMediumPath
    if (config.squashfs) this.squashfs = config.squashfs
    if (config.usrLibPath) this.usrLibPath = config.usrLibPath
    if (config.isCalamaresAvailable !== undefined) this.isCalamaresAvailable = config.isCalamaresAvailable
  }
  
  /**
   * Apply custom configuration from derivatives
   */
  private applyCustomConfig(familyId: string, config: Partial<FamilyConfig>): void {
    this.familyId = familyId
    
    // Apply base family config first
    if (FAMILY_CONFIGS[familyId]) {
      this.applyFamilyConfig(familyId)
    }
    
    // Then override with custom config
    Object.assign(this, config)
  }
  
  /**
   * Apply codename-specific configurations
   */
  private applyCodenameConfig(): void {
    const codenameConfig = CODENAME_CONFIGS[this.codenameId]
    if (codenameConfig) {
      Object.assign(this, codenameConfig)
      
      // Set familyId to debian for debian-family codenames
      if (!this.familyId || this.familyId === 'debian') {
        this.familyId = 'debian'
      }
    }
  }
  
  /**
   * Handle unknown distribution
   */
  private handleUnknownDistro(): void {
    console.log(`This distro ${this.distroId}/${this.codenameId} is not yet recognized!`)
    console.log('')
    console.log('You can edit /usr/lib/penguins-eggs/conf/derivatives.yaml to add it -')
    console.log('after that - run: sudo eggs dad -d to re-configure eggs.')
    console.log('If you can create your new iso, you can contribute to the project')
    console.log('by suggesting your modification.')
    process.exit(0)
  }
}

export default Distro