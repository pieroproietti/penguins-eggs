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
  isolinuxPath: string
  liveMediumPath: string
  memdiskPath: string
  pxelinuxPath: string
  releaseId: string
  releaseLike: string
  squashfs: string
  supportUrl: string
  syslinuxPath: string
  usrLibPath: string

  /**
   * Costruttore
   */
  constructor() {
    let found = false

    this.bugReportUrl = 'https://github.com-pieroproietti/penguins-eggs/issue'
    this.codenameId = ''
    this.codenameLikeId = ''
    this.distroId = ''
    this.distroLike = ''
    this.familyId = 'debian'
    this.homeUrl = 'https://penguins-eggs.net'
    this.isCalamaresAvailable = true
    this.isolinuxPath = ''
    this.liveMediumPath = '/run/live/medium/'
    this.memdiskPath = ''
    this.pxelinuxPath = ''
    this.releaseId = ''
    this.releaseLike = ''
    this.squashfs = 'live/filesystem.squashfs'
    this.supportUrl = 'https://penguins-eggs.net'
    this.syslinuxPath = ''
    this.usrLibPath = '/usr/lib'

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

    /**
     * lsb_release -cs per codename (version)
     * lsb_release -is per distribuzione
     * lsb_release -rs per release
     */
    this.codenameId = shell.exec('lsb_release -cs', { silent: true }).stdout.toString().trim()
    this.releaseId = shell.exec('lsb_release -rs', { silent: true }).stdout.toString().trim()
    this.distroId = shell.exec('lsb_release -is', { silent: true }).stdout.toString().trim()

    /**
     * releaseLike = releaseId
     */
    this.releaseLike = this.releaseId

    /**
     * Per casi equivoci conviene normalizzare codenameId
     *  -i, --id           show distributor ID
     *  -r, --release      show release number of this distribution
     *  -c, --codename     show code name of this distribution
     */
    if (this.distroId === 'Debian' && this.releaseId === 'unstable' && this.codenameId === 'sid') {
      this.codenameId = 'trixie'
    } else if (this.distroId === 'Debian' && this.releaseId === 'testing/unstable') {
      this.codenameId = 'trixie'
      this.releaseLike = 'unstable'
    }

    /**
     * Analize distroId
     */
    switch (this.distroId) {
      /**
       * Alpine compatible
       */
      case 'Alpine': {
        this.familyId = 'alpine'
        break
      }

      /**
       * Fedora compatible
       */
      case 'NobaraLinux': 
      case 'Fedora': {
        this.familyId = 'fedora'

        break
      }

      /**
       * opensuse compatible
       */
      case 'openSUSE': {
        this.familyId = 'opensuse'
        break
      }

      /**
       * Arch/Debian/Devuan/Manjaro and Ubuntu
       */
      default: {
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

          /**
           * Ubuntu LTS + actual
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

          /**
           * Rhino
           */
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
           * find in derivatives
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
          }
        }

        /**
         * setting paths: syslinux, isolinux, usrLibPath
         */
        switch (this.familyId) {
          case 'debian': {
            this.isolinuxPath = '/usr/lib/ISOLINUX/'
            this.syslinuxPath = '/usr/lib/syslinux/modules/bios/'
            this.pxelinuxPath = '/usr/lib/PXELINUX/'
            this.memdiskPath = '/usr/lib/syslinux/'
            this.usrLibPath = '/usr/lib/' + Utils.usrLibPath()

            break
          }

          case 'archlinux': {
            this.syslinuxPath = '/usr/lib/syslinux/bios/'
            this.pxelinuxPath = this.syslinuxPath
            this.usrLibPath = '/usr/lib/'
            this.memdiskPath = this.syslinuxPath
            this.isolinuxPath = this.syslinuxPath

            break
          }
        } // Fine analisi codenameId
      }
    } // Fine analisi distroId

    /**
     * if lsb-release exists
     */
    const lsbConfig = '/etc/lsb-release'
    if (fs.existsSync(lsbConfig)) {
      this.distroId = Utils.searchOnFile(lsbConfig, `DISTRIB_ID`)
      this.codenameId = Utils.searchOnFile(lsbConfig, `DISTRIB_CODENAME`)
      // patch for BigLinux
      if (this.distroId.toLowerCase().includes('biglinux')) {
        this.distroId = 'biglinux'
      }
    }

    /**
     * ManjaroLinux and BigLinux
     */

    if (this.distroId === 'ManjaroLinux' || this.distroId.toLowerCase().includes('biglinux')) {
      this.liveMediumPath = '/run/miso/bootmnt/'
      this.squashfs = 'manjaro/x86_64/livefs.sfs'
    }

    /**
     * all the distros without codename: Alpine, fedora, opensuse
     */
    switch (this.familyId) {
      case 'alpine': {
        this.distroLike = 'Alpine'
        this.codenameId = 'rolling' // questo viene rimosso dal nome
        this.codenameLikeId = 'alpine' // prende alpine come codenaneLikeId
        this.liveMediumPath = '/mnt/' // Qua è deciso da noi

        this.syslinuxPath = '/usr/share/syslinux/' // correct
        this.pxelinuxPath = this.syslinuxPath
        this.usrLibPath = '/usr/lib/'
        this.memdiskPath = this.syslinuxPath
        this.isolinuxPath = this.syslinuxPath
        // At the moment
        this.isCalamaresAvailable = false
        found=true

        break
      }

      case 'fedora': {
        this.distroLike = 'Fedora'
        this.codenameId = 'rolling' // questo viene rimosso dal nome
        this.codenameLikeId = 'fedora'
        this.liveMediumPath = '/run/initramfs/live/'

        this.syslinuxPath = '/usr/share/syslinux/'
        this.pxelinuxPath = this.syslinuxPath
        this.usrLibPath = '/usr/lib/'
        this.memdiskPath = this.syslinuxPath
        this.isolinuxPath = this.syslinuxPath
        this.isCalamaresAvailable = true
        found=true

        break
      }

      case 'opensuse': {
        this.distroLike = 'openSUSE'
        this.codenameId = 'rolling'
        this.codenameLikeId = 'opensuse'
        this.liveMediumPath = '/run/initramfs/live/' // è il mount della root su cd di installatione

        this.syslinuxPath = '/usr/share/syslinux/'
        this.pxelinuxPath = this.syslinuxPath
        this.usrLibPath = '/usr/lib/'
        this.memdiskPath = this.syslinuxPath
        this.isolinuxPath = this.syslinuxPath
        this.isCalamaresAvailable = true
        found=true

        break
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

export default Distro
