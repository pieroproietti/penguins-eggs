/**
 * penguins-eggs
 * class: distro.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import yaml from 'js-yaml'
import fs from 'node:fs'
import path from 'node:path'

import { IDistro } from '../interfaces/index.js'
import { shx } from '../lib/utils.js'
import Diversions from './diversions.js'
import Pacman from './pacman.js'
import Utils from './utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Map Android API levels to version codenames
 */
const androidCodenames: Record<string, string> = {
  '30': 'r',          // Android 11
  '31': 's',          // Android 12
  '32': 's-v2',       // Android 12L
  '33': 'tiramisu',   // Android 13
  '34': 'upside-down-cake', // Android 14
  '35': 'vanilla-ice-cream', // Android 15
  '36': 'baklava',    // Android 16
}

/**
 * Classe
 */
class Distro implements IDistro {
  bugReportUrl: string
  codenameId: string
  distroId: string
  distroLike: string
  distroUniqueId: string
  familyId: string
  homeUrl: string
  isCalamaresAvailable: boolean
  liveMediumPath: string
  releaseId: string
  squashfs: string
  supportUrl: string
  syslinuxPath: string
  usrLibPath: string

  /**
   * Costruttore
   */
  constructor() {
    // Tutti i default sono per Debian
    this.bugReportUrl = 'https://github.com-pieroproietti/penguins-eggs/issue'
    this.codenameId = ''
    this.distroUniqueId = ''
    this.distroId = ''
    this.distroLike = ''
    this.familyId = 'debian'
    this.homeUrl = 'https://penguins-eggs.net'
    this.isCalamaresAvailable = true
    this.liveMediumPath = '/run/live/medium/'
    this.releaseId = ''
    this.squashfs = 'live/filesystem.squashfs'
    this.supportUrl = 'https://penguins-eggs.net'
    this.syslinuxPath = path.resolve(__dirname, `../../syslinux`)
    this.usrLibPath = '/usr/lib'

    /**
     * getOsRelease
     */
    const osInfo = Utils.getOsRelease()
    this.distroId = osInfo.ID
    this.codenameId = osInfo.VERSION_CODENAME
    this.releaseId = osInfo.VERSION_ID

    if (this.distroId === 'Debian' && this.codenameId === 'sid') {
      this.codenameId = 'trixie'
    }

    if (this.distroId.includes('Biglinux')) {
      this.distroId = 'Biglinux'
    }

    if (this.distroId.includes('Bigcommunity')) {
      this.distroId = 'Bigcommunity'
    }

    /**
     * Alpine, Fedora, openmamba, opensuse analyze **distroId**
     *
     * Arch, Debian, Devuan, Ubuntu and derivatives we analyze **codebaseId**
     *
     */

    switch (this.distroId) {
      case 'Almalinux':
      case 'Fedora':
      case 'Nobara':
      case 'Rhel':
      case 'Rocky': {
        this.familyId = 'fedora'
        this.distroLike = 'Fedora'
        this.codenameId = 'rolling' // viene rimosso dal nome
        this.distroUniqueId = this.familyId // per krill
        this.liveMediumPath = '/run/initramfs/live/'

        /**
         * openmamba
         */

        break
      }

      case 'Alpine': {
        /**
         * Alpine compatible
         */

        this.familyId = 'alpine'
        this.distroLike = this.distroId
        this.codenameId = 'rolling' // viene rimosso dal nome
        this.distroUniqueId = this.familyId // per krill
        this.liveMediumPath = '/mnt/' // Qua è deciso da noi

        /**
         * Fedora family: Almalinux, Fedora, Nobara. Rhel, Rocky
         */

        break
      }

      case 'Gentoo': {
        this.familyId = 'gentoo'
        this.distroLike = 'Gentoo'
        this.codenameId = 'rolling'
        this.distroUniqueId = this.familyId
        this.liveMediumPath = '/run/initramfs/live/'

        break
      }

      case 'Openmamba': {
        this.familyId = 'openmamba'
        this.distroLike = 'Openmamba'
        this.codenameId = 'rolling' // viene rimosso dal nome
        this.distroUniqueId = this.familyId // per krill
        this.liveMediumPath = '/run/initramfs/live/'

        /**
         * opensuse compatible
         */

        break
      }

      /**
       * ChromiumOS family: ChromiumOS, ChromeOS, FydeOS/openFyde,
       * ThoriumOS, WayneOS, Brunch, and derivatives.
       * ChromiumOS is Gentoo-derived; uses Portage + Chromebrew.
       */
      case 'Chromiumos':
      case 'ChromiumOS':
      case 'Chromeos':
      case 'ChromeOS':
      case 'Fydeos':
      case 'FydeOS':
      case 'Openfyde':
      case 'openFyde':
      case 'Thoriumos':
      case 'ThoriumOS':
      case 'Wayneos':
      case 'WayneOS':
      case 'Brunch': {
        this.familyId = 'chromiumos'
        this.distroLike = 'ChromiumOS'
        this.codenameId = 'rolling'
        this.distroUniqueId = 'chromiumos'
        this.liveMediumPath = '/run/initramfs/live/'
        this.usrLibPath = '/usr/lib64/'
        this.isCalamaresAvailable = false // krill is the primary installer

        break
      }

      case 'Android':
      case 'BlissOS':
      case 'LineageOS':
      case 'GrapheneOS':
      case 'BassOS': {
        /**
         * Android/AOSP family
         */
        this.familyId = 'android'
        this.distroLike = 'Android'
        this.codenameId = this.getAndroidCodename()
        this.distroUniqueId = 'android'
        this.isCalamaresAvailable = false
        this.liveMediumPath = '/mnt/runtime/'
        this.squashfs = 'system.sfs'

        break
      }

      default: {
        if (this.distroId.includes('Opensuse')) {
          this.familyId = 'opensuse'
          this.distroLike = 'Opensuse' // this.distroId
          this.codenameId = 'rolling' // sistemare non
          this.distroUniqueId = this.familyId // per krill
          this.liveMediumPath = '/run/initramfs/live/' // check
        } else {
          /**
           * Debian/ARCH: we  analize **codenameId**
           */

          /**
           * Arch
           */
          switch (this.codenameId) {
            case 'beowulf': {
              this.distroLike = 'Devuan'
              this.distroUniqueId = 'beowulf'

              /**
               * Devuan chimaera
               */

              break
            }

            case 'bookworm': {
              this.distroLike = 'Debian'
              this.distroUniqueId = 'bookworm'

              /**
               * Debian 13 trixie
               */

              break
            }

            case 'bullseye': {
              this.distroLike = 'Debian'
              this.distroUniqueId = 'bullseye'

              /**
               * Debian 12 bookworm
               */

              break
            }

            case 'buster': {
              this.distroLike = 'Debian'
              this.distroUniqueId = 'buster'

              /**
               * Debian 11 bullseye
               */

              break
            }

            case 'chimaera': {
              this.distroLike = 'Devuan'
              this.distroUniqueId = 'chimaera'

              /**
               * Devuan daedalus
               */

              break
            }

            case 'daedalus': {
              this.distroLike = 'Devuan'
              this.distroUniqueId = 'daedalus'

              /**
               * Devuan excalibur
               */

              break
            }

            case 'devel': {
              this.distroLike = 'Ubuntu'
              this.distroUniqueId = 'devel'

              break
            }

            case 'excalibur': {
              this.distroLike = 'Devuan'
              this.distroUniqueId = 'excalibur'

              /**
               * Ubuntu focal
               */

              break
            }

            case 'focal': {
              this.distroLike = 'Ubuntu'
              this.distroUniqueId = 'focal'

              /**
               * Ubuntu jammy
               */

              break
            }

            case 'forky': {
              this.distroLike = 'Debian'
              this.distroUniqueId = 'forky'

              /**
               * Devuan beowulf
               */

              break
            }

            case 'jammy': {
              this.distroLike = 'Ubuntu'
              this.distroUniqueId = 'jammy'

              /**
               * Ubuntu noble
               */

              break
            }

            case 'jessie': {
              this.distroLike = 'Debian'
              this.distroUniqueId = 'jessie'
              this.liveMediumPath = '/lib/live/mount/medium/'
              this.isCalamaresAvailable = false

              /**
               * Debian 9 stretch
               */

              break
            }

            case 'n/a':

            case 'rolling': {
              this.familyId = 'archlinux'
              this.distroLike = 'Arch'
              this.codenameId = 'rolling'
              this.distroUniqueId = 'archlinux'
              this.liveMediumPath = '/run/archiso/bootmnt/'
              this.squashfs = `arch/x86_64/airootfs.sfs`

              /**
               * Debian 8 jessie
               */

              break
            }

            case 'noble': {
              this.distroLike = 'Ubuntu'
              this.distroUniqueId = 'noble'

              /**
               * Ubuntu devel
               */

              break
            }

            case 'stretch': {
              this.distroLike = 'Debian'
              this.distroUniqueId = 'stretch'
              this.liveMediumPath = '/lib/live/mount/medium/'
              this.isCalamaresAvailable = false

              /**
               * Debian 10 buster
               */

              break
            }

            case 'trixie': {
              this.distroLike = 'Debian'
              this.distroUniqueId = 'trixie'
              this.liveMediumPath = '/run/live/medium/' // initramfs

              /**
               * Debian 14 forky
               */

              break
            }

            default: {
              /**
               * we must to check derivatives
               */
              interface IDistros {
                distroLike: string
                family: string
                id: string // codenameId
                ids: string[]
              }

              /**
               * derivatives
               */
              let found = false

              /**
               * derivatives: families archlinux, debian
               */
              let archDebianDerivatives = path.resolve(__dirname, '../../conf/derivatives.yaml')
              if (fs.existsSync('/etc/penguins-eggs.d/derivatives.yaml')) {
                archDebianDerivatives = '/etc/penguins-eggs.d/derivatives.yaml'
              }

              const content = fs.readFileSync(archDebianDerivatives, 'utf8')
              const distros = yaml.load(content) as IDistros[]
              for (const distro of distros) {
                if (distro.ids !== undefined) {
                  for (let n = 0; n < distro.ids.length; n++) {
                    if (this.codenameId === distro.ids[n]) {
                      found = true
                      this.distroLike = distro.distroLike
                      this.distroUniqueId = distro.id
                      this.familyId = distro.family
                      found = true
                    }
                  }
                }
              }

              /**
               * derivatives: family fedora
               */
              if (!found) {
                let fedoraDerivatives = path.resolve(__dirname, '../../conf/derivatives_fedora.yaml')
                if (fs.existsSync('/etc/penguins-eggs.d/derivatives_fedora.yaml')) {
                  fedoraDerivatives = '/etc/penguins-eggs.d/derivatives_fedora.yaml'
                }

                const content = fs.readFileSync(fedoraDerivatives, 'utf8')
                const elem = yaml.load(content) as string[]
                if (elem.includes(this.distroId)) {
                  this.familyId = 'fedora'
                  this.distroLike = 'Fedora'
                  this.codenameId = 'rolling'
                  this.distroUniqueId = this.familyId
                  this.liveMediumPath = '/run/initramfs/live/'
                  found = true
                }
              }

              /**
               * derivatives: family chromiumos
               */
              if (!found) {
                let chromiumosDerivatives = path.resolve(__dirname, '../../conf/derivatives_chromiumos.yaml')
                if (fs.existsSync('/etc/penguins-eggs.d/derivatives_chromiumos.yaml')) {
                  chromiumosDerivatives = '/etc/penguins-eggs.d/derivatives_chromiumos.yaml'
                }

                if (fs.existsSync(chromiumosDerivatives)) {
                  const content = fs.readFileSync(chromiumosDerivatives, 'utf8')
                  const elem = yaml.load(content) as string[]
                  if (elem.includes(this.distroId)) {
                    this.familyId = 'chromiumos'
                    this.distroLike = 'ChromiumOS'
                    this.codenameId = 'rolling'
                    this.distroUniqueId = 'chromiumos'
                    this.liveMediumPath = '/run/initramfs/live/'
                    this.usrLibPath = '/usr/lib64/'
                    this.isCalamaresAvailable = false
                    found = true
                  }
                }
              }

              if (!found) {
                console.log(`This distro ${this.distroId}/${this.codenameId} is not yet recognized!`)
                console.log('')
                console.log('You can edit /usr/lib/penguins-eggs/conf/derivatives.yaml to add it -')
                console.log('after that - run: sudo eggs dad -d to re-configure eggs.')
                console.log('If you can create your new iso, you can contribute to the project')
                console.log('by suggesting your modification.')
                process.exit(0)
              }
            }
          }
        }
      }
    }

    /**
     * ChromiumOS fallback detection via /etc/lsb-release
     * ChromiumOS may not set ID in /etc/os-release the standard way.
     */
    if (this.familyId === 'debian' && fs.existsSync('/etc/lsb-release')) {
      const lsbContent = fs.readFileSync('/etc/lsb-release', 'utf8')
      if (lsbContent.includes('CHROMEOS_RELEASE') || lsbContent.includes('CHROMEOS_AUSERVER')) {
        this.familyId = 'chromiumos'
        this.distroLike = 'ChromiumOS'
        this.codenameId = 'rolling'
        this.distroUniqueId = 'chromiumos'
        this.liveMediumPath = '/run/initramfs/live/'
        this.usrLibPath = '/usr/lib64/'
        this.isCalamaresAvailable = false
      }
    }

    /**
     * Ultimi ritocchi
     */

    /**
     * Debian: /usr/lib/x86_64-linux-gnu
     *         /usr/lib/aarch64-linux-gnu
     */
    if (this.familyId === 'debian') {
      this.usrLibPath = '/usr/lib/' + Utils.usrLibPath()
    } else if (this.familyId === 'gentoo' || this.familyId === 'chromiumos' || this.familyId === 'opensuse') {
      this.usrLibPath = '/usr/lib64/'
    }

    /**
     * Manjarolinux anf derivatives (biglinux)
     */
    if (Diversions.isManjaroBased(this.distroId)) {
      this.liveMediumPath = '/run/miso/bootmnt/'
      this.squashfs = 'manjaro/x86_64/livefs.sfs'
      this.codenameId = shx.exec(`lsb_release -cs`, { silent: true }).stdout.toString().trim()
      this.distroUniqueId = 'manjaro'
    }

    /**
     * Fallback: detect Android environment via build.prop or Waydroid
     * if os-release didn't identify it
     */
    if (this.familyId !== 'android' && Distro.isAndroidEnvironment()) {
      this.familyId = 'android'
      this.distroLike = 'Android'
      this.distroId = Distro.detectAndroidDistroId()
      this.codenameId = this.getAndroidCodename()
      this.distroUniqueId = 'android'
      this.isCalamaresAvailable = false
      this.liveMediumPath = '/mnt/runtime/'
      this.squashfs = 'system.sfs'
    }

    /**
     * lettura os_release per i pulsanti
     */
    const os_release = '/etc/os-release'
    if (fs.existsSync(os_release)) {
      let lines: string[] = []
      if (fs.existsSync(os_release)) {
        const data = fs.readFileSync(os_release, 'utf8')
        lines = data.split('\n')
      }

      // read every line
      for (const line of lines) {
        if (line.startsWith('HOME_URL=')) {
          this.homeUrl = line.slice('HOME_URL='.length).replaceAll('"', '')
        } else if (line.startsWith('SUPPORT_URL=')) {
          this.supportUrl = line.slice('SUPPORT_URL='.length).replaceAll('"', '')
        } else if (line.startsWith('BUG_REPORT_URL=')) {
          this.bugReportUrl = line.slice('BUG_REPORT_URL='.length).replaceAll('"', '')
        }
      }
    }
  }

  /**
   * Read a property from Android's build.prop files
   */
  static readBuildProp(key: string): string {
    const buildPropPaths = [
      '/system/build.prop',
      '/vendor/build.prop',
      '/system/system/build.prop',
      '/var/lib/waydroid/overlay/system/build.prop',
    ]

    for (const propPath of buildPropPaths) {
      if (fs.existsSync(propPath)) {
        try {
          const data = fs.readFileSync(propPath, 'utf8')
          for (const line of data.split('\n')) {
            const trimmed = line.trim()
            if (trimmed.startsWith(key + '=')) {
              return trimmed.slice(key.length + 1)
            }
          }
        } catch {
          // permission denied or other read error, try next
        }
      }
    }

    return ''
  }

  /**
   * Detect if we're running in an Android environment
   * Checks: build.prop, Waydroid config, /proc/cmdline androidboot params
   */
  static isAndroidEnvironment(): boolean {
    // Check for Android build.prop
    if (fs.existsSync('/system/build.prop')) {
      return true
    }

    // Check for Waydroid
    if (fs.existsSync('/var/lib/waydroid/waydroid.cfg')) {
      return true
    }

    // Check for androidboot in kernel cmdline
    try {
      if (fs.existsSync('/proc/cmdline')) {
        const cmdline = fs.readFileSync('/proc/cmdline', 'utf8')
        if (cmdline.includes('androidboot')) {
          return true
        }
      }
    } catch {
      // ignore
    }

    return false
  }

  /**
   * Detect the Android distribution name from build.prop
   */
  static detectAndroidDistroId(): string {
    const displayId = Distro.readBuildProp('ro.build.display.id').toLowerCase()
    const brand = Distro.readBuildProp('ro.product.brand').toLowerCase()

    if (displayId.includes('bliss') || brand.includes('bliss')) return 'BlissOS'
    if (displayId.includes('bass')) return 'BassOS'
    if (displayId.includes('lineage') || brand.includes('lineage')) return 'LineageOS'
    if (displayId.includes('graphene') || brand.includes('graphene')) return 'GrapheneOS'

    // Check for Waydroid specifically
    if (fs.existsSync('/var/lib/waydroid/waydroid.cfg')) return 'Waydroid'

    return 'Android'
  }

  /**
   * Get Android version codename from build.prop SDK level
   */
  private getAndroidCodename(): string {
    const sdkVersion = Distro.readBuildProp('ro.build.version.sdk')
    if (sdkVersion && androidCodenames[sdkVersion]) {
      return androidCodenames[sdkVersion]
    }

    const versionRelease = Distro.readBuildProp('ro.build.version.release')
    if (versionRelease) {
      return `android-${versionRelease}`
    }

    return 'android'
  }
}

export default Distro
