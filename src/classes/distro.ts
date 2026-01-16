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
     * Ultimi ritocchi
     */

    /**
     * Debian: /usr/lib/x86_64-linux-gnu
     *         /usr/lib/aarch64-linux-gnu
     */
    if (this.familyId === 'debian') {
      this.usrLibPath = '/usr/lib/' + Utils.usrLibPath()
    } else if (this.familyId === 'opensuse') {
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
}

export default Distro
