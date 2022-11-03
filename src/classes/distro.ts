/* eslint-disable no-console */
/**
 * penguins-eggs: Distro.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

/**
 * Debian 8 (jessie)
 * Debian 9 (stretch)
 * Debian 10 (buster) — old-stable
 * Debian 11 bullseye - stable
 * Debian 12 bookworm - testing/unstable
 *
 * Devuan ASCII
 * Devuan beowlf - old-stable
 * Devuan Chimaera - stable
 *
 * Ubuntu 16.04 (xenial) LTS  active
 * Ubuntu 18.04 (bionic) LTS  active
 * Ubuntu 20.04 (focal) LTS active
 * Ubuntu 22.04 (jammy) LTS
 * Ubuntu 22.10 (kinetic)
 * 
 * Arch
 * Manjaro Qonos
 * Manjaro Ruah
 *
 */

'use strict'
import fs from 'node:fs'
import shell from 'shelljs'

import { IRemix, IDistro } from '../interfaces'

/**
 * Classe
 */
class Distro implements IDistro {
  familyId: string
  distroId: string
  distroLike: string
  codenameId: string
  codenameLikeId: string
  releaseId: string
  releaseLike: string
  usrLibPath: string
  isolinuxPath: string
  syslinuxPath: string
  pxelinuxPath: string 
  memdiskPath: string
  liveMediumPath: string
  squashfs: string
  homeUrl: string
  supportUrl: string
  bugReportUrl: string
  isCalamaresAvailable: boolean

  constructor(remix = {} as IRemix) {
    this.familyId = 'debian'
    this.distroId = ''
    this.distroLike = ''
    this.codenameId = ''
    this.codenameLikeId = ''
    this.releaseId = ''
    this.releaseLike = ''
    this.usrLibPath = '/usr/lib'
    this.isolinuxPath = ''
    this.syslinuxPath = ''
    this.pxelinuxPath = ''
    this.memdiskPath  = ''
    this.liveMediumPath = `/run/live/medium/`
    this.squashfs = `live/filesystem.squashfs`
    this.homeUrl = ''
    this.supportUrl = ''
    this.bugReportUrl = ''
    this.isCalamaresAvailable = true

    const file = '/etc/os-release'
    let data: any
    if (fs.existsSync(file)) {
      data = fs.readFileSync(file, 'utf8')
    }

    // inizio
    enum info {
      HOME_URL,
      SUPPORT_URL,
      BUG_REPORT_URL
    }

    const os: Array<string> = []
    os[info.HOME_URL] = 'HOME_URL='
    os[info.SUPPORT_URL] = 'SUPPORT_URL='
    os[info.BUG_REPORT_URL] = 'BUG_REPORT_URL='
    for (const temp in data) {
      if (!data[temp].search(os[info.HOME_URL])) {
        this.homeUrl = data[temp].slice(os[info.HOME_URL].length).replace(/"/g, '')
      }

      if (!data[temp].search(os[info.SUPPORT_URL])) {
        this.supportUrl = data[temp].slice(os[info.SUPPORT_URL].length).replace(/"/g, '')
      }

      if (!data[temp].search(os[info.BUG_REPORT_URL])) {
        this.bugReportUrl = data[temp].slice(os[info.BUG_REPORT_URL].length).replace(/"/g, '')
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
      this.codenameId = 'bookworm'
    } else if (this.distroId === 'Debian' && this.releaseId === 'testing/unstable') {
      this.codenameId = 'bookworm'
      this.releaseLike = 'unstable'
    }


    /**
     * Procedo analizzanto: codenameId, prima Debian, Devuan ed Ubuntu poi gli altri
     */
    switch (this.codenameId) {
      case 'jessie': {
        // Debian 8 jessie
        this.distroLike = 'Debian'
        this.codenameLikeId = 'jessie'
        this.liveMediumPath = '/lib/live/mount/medium/'
        this.isCalamaresAvailable = false

        break
      }

      case 'stretch': {
        // Debian 9 stretch
        this.distroLike = 'Debian'
        this.codenameLikeId = 'stretch'
        this.liveMediumPath = '/lib/live/mount/medium/'
        this.isCalamaresAvailable = false

        break
      }

      case 'buster': {
        // Debian 10 buster
        this.distroLike = 'Debian'
        this.codenameLikeId = 'buster'

        break
      }

      case 'bullseye': {
        // Debian 11 bullseye
        this.distroLike = 'Debian'
        this.codenameLikeId = 'bullseye'

        break
      }

      case 'bookworm': {
        // Debian 11 bullseye
        this.distroLike = 'Debian'
        this.codenameLikeId = 'bookworm'

        break
      }

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
        // Ubuntu 18.04 bionic LTS eol aprile 2023
        this.distroLike = 'Ubuntu'
        this.codenameLikeId = 'bionic'
        this.liveMediumPath = '/lib/live/mount/medium/'

        break
      }

      case 'focal': {
        // Ubuntu 20.04 focal LTS
        this.distroLike = 'Ubuntu'
        this.codenameLikeId = 'focal'

        break
      }


      case 'jammy': {
        // Ubuntu 22.04 jammy
        this.distroLike = 'Ubuntu'
        this.codenameLikeId = 'jammy'

        break
      }

      case 'kinetic': {
        // Ubuntu 22.10 kinetic
        this.distroLike = 'Ubuntu'
        this.codenameLikeId = 'kinetic'

        // quindi le derivate...

        break
      }


      case 'kali-rolling': {
        // Kali
        this.distroLike = 'Debian'
        this.codenameLikeId = 'bookworm'

        break
      }

      case `hera`: {
        // Elementary
        this.distroLike = 'Ubuntu'
        this.codenameLikeId = 'bionic'

        break
      }

      case `jolnir`: {
        // Elementary
        this.distroLike = 'Ubuntu'
        this.codenameLikeId = 'focal'

        break
      }

      case 'roma': {
        // UfficioZero roma
        this.distroLike = 'Devuan'
        this.codenameLikeId = 'beowulf'

        break
      }

      case 'tropea': {
        // UfficioZero tropea
        this.distroLike = 'Ubuntu'
        this.codenameLikeId = 'focal'

        break
      }

      case 'vieste': {
        // UfficioZero tropea
        this.distroLike = 'Ubuntu'
        this.codenameLikeId = 'bionic'

        break
      }

      case 'siena': {
        // UfficioZero siena
        this.distroLike = 'Debian'
        this.codenameLikeId = 'buster'

        break
      }

      case 'tara':
      case 'tessa':
      case 'tina':
      case 'tricia': {
        // LinuxMint 19.x
        this.distroLike = 'Ubuntu'
        this.codenameLikeId = 'bionic'

        break
      }

      case 'ulyana':
      case 'ulyssa':
      case 'uma':
      case 'una':
      case 'vanessa': {
        // LinuxMint 20.x
        this.distroLike = 'Ubuntu'
        this.codenameLikeId = 'jammy'

        break
      }

      case 'debbie': {
        // LMDE 4 debbie
        this.distroLike = 'Debian'
        this.codenameLikeId = 'buster'

        break
      }

      case 'elsie': {
        // LMDE 5 elsie
        this.distroLike = 'Debian'
        this.codenameLikeId = 'bullseye'

        break
      }

      case 'apricot': {
        // Deepin 20 apricot
        this.distroLike = 'Debian'
        this.codenameLikeId = 'bullseye'

        break
      }

      case 'mierda': {
        // Caraco
        this.distroLike = 'Debian'
        this.codenameLikeId = 'bullseye'

        break
      }

      case 'filadelfia': {
        // SysLinuxOS
        this.distroLike = 'Debian'
        this.codenameLikeId = 'bullseye'

        break
      }

      case 'siduction': {
        // Debian 11 Siduction
        this.distroLike = 'Debian'
        this.codenameLikeId = 'bullseye'

        break
      }

      case 'buster/sid': {
        // Netrunner
        this.distroLike = 'Debian'
        this.codenameLikeId = 'buster'

        break
      }

      /**
       * Arch Linux
       */
      case 'n/a': {
        this.familyId = 'archlinux'
        this.distroLike = 'Arch'
        this.liveMediumPath = `/run/archiso/bootmnt/`
        this.codenameId = 'rolling'
        this.codenameLikeId = 'rolling'
        break
      }

      /**
       * Manjaro
       */
      case 'Qonos':
        case 'Ruah': 
        case 'Sikaris': {
        this.familyId = 'archlinux'
        this.distroLike = 'Arch'
        // this.liveMediumPath = `/run/miso/bootmnt/`
        // this.liveMediumPath = `/run/archiso/airootfs/`
        this.liveMediumPath = `/run/archiso/copytoram/`
        this.codenameLikeId = 'rolling'
        break
      }

      /**
       * GARUDA
       */
      case 'Harpy-Eagle':
      case 'White-tailed-eagle': {
        this.familyId = 'archlinux'
        this.distroLike = 'Arch'
        this.codenameLikeId = 'rolling'
        break
      }

      /**
       * FEDORA
       */


      case 'ThirtyFive': {
        this.familyId = 'fedora'
        this.distroLike = 'Fedora'
        this.codenameLikeId = 'thirtyfive'
        break

        /**
         * openSuse
         */
      }

      case 'tumbleweed': {
        this.familyId = 'suse'
        this.distroLike = 'SUSE'
        this.codenameId = 'tumbleweed'
        this.codenameLikeId = 'tumbleweed'

        break
      }

      default: {
        /**
         * se proprio non riesco provo con Debian buster
         */
        console.log("This distro is not yet recognized, I'll try Debian buster")
        this.distroLike = 'Debian'
        this.codenameLikeId = 'buster'

      }
    }

    /**
     * Selezione il mountpoint per squashfs
     */
     if (this.distroId === 'ManjaroLinux') {
      this.liveMediumPath = '/run/miso/bootmnt/'
      this.squashfs = `manjaro/x86_64/livefs.sfs`

    } else if (this.distroId === 'Arch') {
      this.liveMediumPath = '/run/archiso/bootmnt/'
      this.squashfs = `arch/x86_64/airootfs.sfs`
    }


    /**
     * setting paths: syslinux, isolinux, usrLib
     */
    switch (this.familyId) {
      case 'debian': {
        this.isolinuxPath = '/usr/lib/ISOLINUX/'
        this.syslinuxPath = '/usr/lib/syslinux/modules/bios/'
        this.pxelinuxPath = '/usr/lib/PXELINUX/'
        this.usrLibPath = '/usr/lib/x86_64-linux-gnu/'
        this.memdiskPath ='/usr/lib/syslinux/'
        if (process.arch === 'ia32') {
          this.usrLibPath = '/usr/lib/i386-linux-gnu/'
        }
        break
      }

      case 'fedora': {
        this.syslinuxPath = '/usr/share/syslinux/'
        this.isolinuxPath = this.syslinuxPath

        break
      }

      case 'archlinux': {
        this.syslinuxPath = '/usr/lib/syslinux/bios/'
        this.pxelinuxPath = this.syslinuxPath 
        this.memdiskPath = this.syslinuxPath 
        this.isolinuxPath = this.syslinuxPath

        break
      }

      case 'suse': {
        this.syslinuxPath = '/usr/share/syslinux/'
        this.isolinuxPath = this.syslinuxPath
        this.usrLibPath = '/usr/lib64/'

        break
      }
      // No default
    }

    /**
     * Special cases...
     */

    /**
     * MX LINUX
     * ln -s /run/live/medium/live/filesystem.squashfs /live/boot-dev/antiX/linuxfs
     */
    if (fs.existsSync('/etc/antix-version')) {
      this.distroId = 'MX'
    }
  }
}

export default Distro
