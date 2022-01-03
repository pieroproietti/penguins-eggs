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
 * Ubuntu 18.10 (cosmic) expired
 * Ubuntu 19.04 (disco)  expired
 * Ubuntu 19.10 (eoan)   expired
 * Ubuntu 20.04 (focal) LTS active
 * Ubuntu 20.10 (groovy) active
 * Ubuntu 21.04 (hirsute) active
 * Ubuntu 21.10 (impish) active
 * Ubuntu 22.04 (jammy) LTS
 *
 */

'use strict'
import fs from 'node:fs'
import shell from 'shelljs'
import inquirer from 'inquirer'

import { IRemix, IDistro } from '../interfaces'

/**
 * Classe
 */
class Distro implements IDistro {
  familyId: string
  distroId: string
  distroLike: string
  versionId: string
  versionLike: string
  usrLibPath: string
  isolinuxPath: string
  syslinuxPath: string
  squashFs: string
  mountpointSquashFs: string
  homeUrl: string
  supportUrl: string
  bugReportUrl: string
  isCalamaresAvailable: boolean

  constructor(remix: IRemix) {
    this.familyId = 'debian'
    this.distroId = ''
    this.distroLike = ''
    this.versionId = ''
    this.versionLike = ''
    this.usrLibPath = '/usr/lib'
    this.isolinuxPath = ''
    this.syslinuxPath = ''
    this.squashFs = ''
    this.mountpointSquashFs = ''
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
     * lsb_release -cs per versione ed lsb_release -is per distribuzione
     */
    this.versionId = shell.exec('lsb_release -cs', { silent: true }).stdout.toString().trim()
    this.distroId = shell.exec('lsb_release -is', { silent: true }).stdout.toString().trim()

    /**
     * Per casi equivoci conviene normalizzare versionId
     */
    switch (this.versionId) {
      case 'n/a': {
        // può essere Deepin apricot
        if (this.distroId === 'Deepin') {
          this.versionId = 'apricot'
        } else if (fs.existsSync('/etc/debian_version')) {
          // bookworm?
          const debianVersion = fs.readFileSync('/etc/debian_version', 'utf8')
          if (debianVersion.trim() === 'bookworm/sid') {
            this.versionId = 'bookworm'
          }
        }

        break
      }

      case 'sid': {
        // sinora ho trovato solo siduction
        if (fs.existsSync('/etc/debian_version')) {
          const debianVersion = fs.readFileSync('/etc/debian_version', 'utf8')
          if (debianVersion.trim() === 'bullseye/sid') {
            this.versionId = 'siduction'
          }
        }

        break
      }

      case 'testing': {
        if (this.distroId === 'Netrunner') {
          this.versionId = 'buster/sid'
        }

        break
      }
      // No default
    }

    // Procedo analizzanto solo versionId...

    // prima Debian, Devuan ed Ubuntu
    switch (this.versionId) {
      case 'jessie': {
        // Debian 8 jessie
        this.distroLike = 'Debian'
        this.versionLike = 'jessie'

        break
      }

      case 'stretch': {
        // Debian 9 stretch
        this.distroLike = 'Debian'
        this.versionLike = 'stretch'

        break
      }

      case 'buster': {
        // Debian 10 buster
        this.distroLike = 'Debian'
        this.versionLike = 'buster'

        break
      }

      case 'bullseye': {
        // Debian 11 bullseye
        this.distroLike = 'Debian'
        this.versionLike = 'bullseye'

        break
      }

      case 'bookworm': {
        // Debian 11 bullseye
        this.distroLike = 'Debian'
        this.versionLike = 'bookworm'

        break
      }

      case 'beowulf': {
        this.distroLike = 'Devuan'
        this.versionLike = 'beowulf'

        break
      }

      case 'chimaera': {
        this.distroLike = 'Devuan'
        this.versionLike = 'chimaera'

        break
      }

      case 'daedalus': {
        this.distroLike = 'Devuan'
        this.versionLike = 'daedalus'

        break
      }

      case 'xenial': {
        // Ubuntu xenial
        this.distroLike = 'Ubuntu'
        this.versionLike = 'xenial'

        break
      }

      case 'bionic': {
        // Ubuntu 18.04 bionic LTS eol aprile 2023
        this.distroLike = 'Ubuntu'
        this.versionLike = 'bionic'

        break
      }

      case 'focal': {
        // Ubuntu 20.04 focal LTS
        this.distroLike = 'Ubuntu'
        this.versionLike = 'focal'

        break
      }

      case 'groovy': {
        // Ubuntu 20.10 groovy
        this.distroLike = 'Ubuntu'
        this.versionLike = 'groovy'

        break
      }

      case 'hirsute': {
        // Ubuntu 21.04 hirsute
        this.distroLike = 'Ubuntu'
        this.versionLike = 'hirsute'

        break
      }

      case 'impish': {
        // Ubuntu 21.10 impish
        this.distroLike = 'Ubuntu'
        this.versionLike = 'impish'

        break
      }

      case 'jammy': {
        // Ubuntu 22.04 jammy
        this.distroLike = 'Ubuntu'
        this.versionLike = 'jammy'

        // quindi le derivate...

        break
      }

      case 'kali-rolling': {
        // Kali
        this.distroLike = 'Debian'
        this.versionLike = 'bookworm'

        // UfficioZero roma

        break
      }

      case 'roma': {
        // UfficioZero roma
        this.distroLike = 'Devuan'
        this.versionLike = 'beowulf'

        break
      }

      case 'tropea': {
        // UfficioZero tropea
        this.distroLike = 'Ubuntu'
        this.versionLike = 'focal'

        break
      }

      case 'vieste': {
        // UfficioZero tropea
        this.distroLike = 'Ubuntu'
        this.versionLike = 'bionic'

        break
      }

      case 'siena': {
        // UfficioZero siena
        this.distroLike = 'Debian'
        this.versionLike = 'buster'

        break
      }

      case 'tara':
      case 'tessa':
      case 'tina':
      case 'tricia': {
        // LinuxMint 19.x
        this.distroLike = 'Ubuntu'
        this.versionLike = 'bionic'

        break
      }

      case 'ulyana':
      case 'ulyssa':
      case 'uma': {
        // LinuxMint 20.x
        this.distroLike = 'Ubuntu'
        this.versionLike = 'focal'

        break
      }

      case 'debbie': {
        // LMDE 4 debbie
        this.distroLike = 'Debian'
        this.versionLike = 'buster'

        break
      }

      case 'apricot': {
        // Deepin 20 apricot
        this.distroLike = 'Debian'
        this.versionLike = 'bullseye'

        break
      }

      case 'siduction': {
        // Debian 11 Siduction
        this.distroLike = 'Debian'
        this.versionLike = 'bullseye'

        break
      }

      case 'buster/sid': {
        // Netrunner
        this.distroLike = 'Debian'
        this.versionLike = 'buster'

        /**
         * ArchLinux
         */

        break
      }
      case 'Harpy-Eagle': {
        this.familyId = 'archlinux'
        this.distroLike = 'Arch'
        this.versionLike = 'rolling'
        break
      }

      case 'Qonos': {
        this.familyId = 'archlinux'
        this.distroLike = 'Arch'
        this.versionLike = 'rolling'
        break

        /**
         * Fedora
         */
      }

      case 'ThirtyFive': {
        this.familyId = 'fedora'
        this.distroLike = 'Fedora'
        this.versionLike = 'thirtyfive'
        break

        /**
         * openSuse
         */
      }

      case 'tumbleweed': {
        this.familyId = 'suse'
        this.distroLike = 'SUSE'
        this.versionId = 'tumbleweed'
        this.versionLike = 'tumbleweed'

        break
      }

      default: {
        /**
         * se proprio non riesco provo con Debian buster
         */
        console.log("This distro is not yet recognized, I'll try Debian buster")
        this.distroLike = 'Debian'
        this.versionLike = 'buster'

      }
    }

    /**
     * Selezione il mountpoint per squashfs
     */
    if (this.versionLike === 'jessie' || this.versionLike === 'stretch' || this.versionLike === 'bionic' || this.versionLike === 'xenial') {
      this.squashFs = '/lib/live/mount/medium/live/filesystem.squashfs'
      this.mountpointSquashFs = '/lib/live/mount/medium/live/filesystem.squashfs'
    } else {
      this.squashFs = '/run/live/medium/live/filesystem.squashfs'
      this.mountpointSquashFs = '/run/live/medium/live/filesystem.squashfs'
    }

    /**
     * setting paths: syslinux, isolinux, usrLib
     */
    switch (this.familyId) {
      case 'debian': {
        this.isolinuxPath = '/usr/lib/ISOLINUX/'
        this.syslinuxPath = '/usr/lib/syslinux/modules/bios/'
        this.usrLibPath = '/usr/lib/x86_64-linux-gnu/'
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
