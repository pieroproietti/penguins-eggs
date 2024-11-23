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
import shell from 'shelljs'

import { IDistro } from '../interfaces/index.js'
import Utils from './utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Classe
 */
class Distro implements IDistro {
  bugReportUrl: string
  codenameId: string
  codenameLikeId: string
  distroId: string
  distroLike: string
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
    let found = false
    // Tutti i default sono per Debian
    this.bugReportUrl = 'https://github.com-pieroproietti/penguins-eggs/issue'
    this.codenameId = ''
    this.codenameLikeId = ''
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
     * lsb_release -cs per codename (version)
     * lsb_release -is per distribuzione
     * lsb_release -rs per release
     */
    this.codenameId = shell.exec(`lsb_release -cs`, { silent: true }).stdout.toString().trim()
    this.releaseId = shell.exec(`lsb_release -rs`, { silent: true }).stdout.toString().trim()
    this.distroId = shell.exec(`lsb_release -is`, { silent: true }).stdout.toString().trim()

    if (this.distroId === 'Debian' && this.codenameId === 'sid') {
      this.codenameId = 'trixie'
    }

    if (this.distroId.includes('BigLinux')) {
      this.distroId = "BigLinux"
    }

    /**
     * Alpine, Fedora, openmamba, opensuse, VoidLinux solo distroId.
     * 
     * Debian, Devuan, Ubuntu e derivate ricadono in
     * default e si analizza il codebaseId
     * 
     */
    switch (this.distroId) {
      /**
       * ALDOS
       */
      case 'ALDOS': {
        this.familyId = 'aldos'
        this.distroLike = 'ALDOS'
        this.codenameId = 'rolling' // viene rimosso dal nome
        this.codenameLikeId = this.familyId // per krill
        this.liveMediumPath = '/run/initramfs/live/'

        break
      }


      /**
       * Alpine compatible
       */
      case 'Alpine': {
        this.familyId = 'alpine'
        this.distroLike = this.distroId
        this.codenameId = 'rolling' // viene rimosso dal nome
        this.codenameLikeId = this.familyId // per krill
        this.liveMediumPath = '/mnt/' // Qua è deciso da noi

        break
      }

      /**
       * Fedora compatible
       */
      case 'AlmaLinux':
        case 'NobaraLinux':
        case 'RockyLinux':
        case 'Fedora': {
        this.familyId = 'fedora'
        this.distroLike = 'Fedora'
        this.codenameId = 'rolling' // viene rimosso dal nome
        this.codenameLikeId = this.familyId // per krill
        this.liveMediumPath = '/run/initramfs/live/'

        break
      }


      /**
       * openmamba
       */
      case 'openmamba': {
        this.familyId = 'openmamba'
        this.distroLike = 'openmamba'
        this.codenameId = 'rolling' // viene rimosso dal nome
        this.codenameLikeId = this.familyId // per krill
        this.liveMediumPath = '/run/initramfs/live/'

        break
      }

      /**
       * opensuse compatible
       */
      case 'openSUSE': {
        this.familyId = 'opensuse'
        this.distroLike = this.distroId
        this.codenameId = 'rolling' // viene rimosso dal nome
        this.codenameLikeId = this.familyId // per krill
        this.liveMediumPath = '/run/initramfs/live/' // check

        break
      }

      /**
       * voidlinux compatible
       */
      case 'VoidLinux': {
        this.familyId = 'voidlinux'
        this.distroLike = this.distroId
        this.codenameId = 'rolling'
        this.codenameLikeId = this.familyId // per krill
        this.liveMediumPath = '/run/initramfs/live/' // we must discover

        break
      }


      /**
       * Arch/Debian/Devuan and Ubuntu
       * analizzo i codebase conosciuti
       */
      default: {
        /**
         * Debian
         */
        switch (this.codenameId) {
          case 'jessie': {
            this.distroLike = 'Debian'
            this.codenameLikeId = 'jessie'
            this.liveMediumPath = '/lib/live/mount/medium/'
            this.isCalamaresAvailable = false

            break
          }

          case 'stretch': {
            this.distroLike = 'Debian'
            this.codenameLikeId = 'stretch'
            this.liveMediumPath = '/lib/live/mount/medium/'
            this.isCalamaresAvailable = false

            break
          }

          case 'buster': {
            this.distroLike = 'Debian'
            this.codenameLikeId = 'buster'

            break
          }

          case 'bullseye': {
            this.distroLike = 'Debian'
            this.codenameLikeId = 'bullseye'

            break
          }

          case 'bookworm': {
            this.distroLike = 'Debian'
            this.codenameLikeId = 'bookworm'

            break
          }

          case 'trixie': {
            this.distroLike = 'Debian'
            this.codenameLikeId = 'trixie'

            break
          }

          /**
           * Devuan
           */
          case 'beowulf': {
            this.distroLike = 'Devuan'
            this.codenameLikeId = 'beowulf'

            break
          }

          case 'chimaera': {
            this.distroLike = 'Devuan'
            this.codenameLikeId = 'chimaera'

            break
          }

          case 'daedalus': {
            this.distroLike = 'Devuan'
            this.codenameLikeId = 'daedalus'

            break
          }

          case 'excalibur': {
            this.distroLike = 'Devuan'
            this.codenameLikeId = 'excalibur'

            break
          }

          /**
           * Ubuntu
           */
          case 'bionic': {
            this.distroLike = 'Ubuntu'
            this.codenameLikeId = 'bionic'
            this.liveMediumPath = '/lib/live/mount/medium/'

            break
          }

          case 'focal': {
            this.distroLike = 'Ubuntu'
            this.codenameLikeId = 'focal'

            break
          }

          case 'jammy': {
            this.distroLike = 'Ubuntu'
            this.codenameLikeId = 'jammy'

            break
          }

          case 'noble': {
            this.distroLike = 'Ubuntu'
            this.codenameLikeId = 'noble'

            break
          }

          // rhino
          case 'devel': {
            this.distroLike = 'Ubuntu'
            this.codenameLikeId = 'devel'

            break
          }

          /**
           * Arch
           */
          case 'n/a':
          case 'rolling': {
            this.familyId = 'archlinux'
            this.distroLike = 'Arch'
            this.codenameId = 'rolling'
            this.codenameLikeId = 'rolling'
            this.liveMediumPath = '/run/archiso/bootmnt/'
            this.squashfs = `arch/x86_64/airootfs.sfs`
            break
          }

          /**
           * derivatives
           */
          default: {
            interface IDistros {
              distroLike: string
              family: string
              id: string // codenameId
              ids: string[]
            }

            /**
             * patch per Roy VERIFICARE
             */
            let file = path.resolve(__dirname, '../../conf/derivatives.yaml')
            if (fs.existsSync('/etc/penguins-eggs.d/derivatives.yaml')) {
              file = '/etc/penguins-eggs.d/derivatives.yaml'
            }

            const content = fs.readFileSync(file, 'utf8')
            const distros = yaml.load(content) as IDistros[]
            for (const distro of distros) {
              if (distro.ids !== undefined) {
                for (let n = 0; n < distro.ids.length; n++) {
                  if (this.codenameId === distro.ids[n]) {
                    found = true
                    this.distroLike = distro.distroLike
                    this.codenameLikeId = distro.id
                    this.familyId = distro.family
                  }
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
    } // Fine analisi distroId


    /**
     * Ultimi ritocchi
     */

    /**
     * Debian: /usr/lib/x86_64-linux-gnu
     *         /usr/lib/aarch64-linux-gnu
     */
    if (this.familyId === "debian") {
      this.usrLibPath = '/usr/lib/' + Utils.usrLibPath()
    } else if (this.familyId === "opensuse") {
      this.usrLibPath = '/usr/lib64/'
    }  

    /**
     * ManjaroLinux e derivate
     */
    if (this.distroId === 'ManjaroLinux' || this.distroId === 'BigLinux') {
      this.liveMediumPath = '/run/miso/bootmnt/'
      this.squashfs = 'manjaro/x86_64/livefs.sfs'
    }

    /**
     * lottura os_release per i pulsanti
     */
    const os_release = '/etc/os-release'
    if (fs.existsSync(os_release)) {
      let lines: string[] = []
      if (fs.existsSync(os_release)) {
        const data = fs.readFileSync(os_release, 'utf8')
        lines = data.split('\n')
      }

      // per ogni riga
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
