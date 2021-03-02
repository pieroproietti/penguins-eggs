/* eslint-disable no-console */
/**
 * penguins-eggs: Distro.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

/**
 * Debian 11 bullseye
 * Debian 10 (buster) — l'attuale versione stable
 * Debian 9 (stretch) — l'attuale versione oldstable
 *
 * Devuan ASCII
 * Devuan beowlf
 * Devuan Chimaera
 *
 * Ubuntu 16.04 (xenial) LTS  active
 * Ubuntu 18.04 (bionic) LTS  active
 * Ubuntu 18.10 (cosmic) expired
 * Ubuntu 19.04 (disco)  expired
 * Ubuntu 19.10 (eoan)   expired
 * Ubuntu 20.04 (focal) LTS   active
 * Ubuntu 20.10 (groovy) active
 * 
 * active distros
 *
 * stretch old
 * buster
 * xenial old
 * bionic old
 * eoan
 * focal
 */

'use strict'
import fs = require('fs')
import shell = require('shelljs')

import { IRemix, IDistro } from '../interfaces'

/**
 * Classe
 */
class Distro implements IDistro {
   distroId: string
   distroLike: string
   versionId: string
   versionLike: string
   isolinuxPath: string
   syslinuxPath: string
   mountpointSquashFs: string
   homeUrl: string
   supportUrl: string
   bugReportUrl: string

   constructor(remix: IRemix) {
      this.distroId = ''
      this.distroLike = ''
      this.versionId = ''
      this.versionLike = ''
      this.isolinuxPath = ''
      this.syslinuxPath = ''
      this.mountpointSquashFs = ''
      this.homeUrl = ''
      this.supportUrl = ''
      this.bugReportUrl = ''

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
            this.homeUrl = data[temp].substring(os[info.HOME_URL].length).replace(/"/g, '')
         }

         if (!data[temp].search(os[info.SUPPORT_URL])) {
            this.supportUrl = data[temp].substring(os[info.SUPPORT_URL].length).replace(/"/g, '')
         }

         if (!data[temp].search(os[info.BUG_REPORT_URL])) {
            this.bugReportUrl = data[temp].substring(os[info.BUG_REPORT_URL].length).replace(/"/g, '')
         }
      }

      /**
       * lsb_release -c -s
       */
      this.versionId = shell.exec('lsb_release -c -s', { silent: true }).stdout.toString().trim()

      if (this.versionId === 'n/a') {
         // Configurazione per bullseye
         if (fs.existsSync('/etc/debian_version')) {
            const debianVersion = fs.readFileSync('/etc/debian_version', 'utf8')
            if (debianVersion.trim() === 'bullseye/sid') {
               this.versionId = 'bullseye'
            }
         }
      } else if (this.versionId === 'sid') {
         // Configurazione per siduction
         if (fs.existsSync('/etc/debian_version')) {
            const debianVersion = fs.readFileSync('/etc/debian_version', 'utf8')
            if (debianVersion.trim() === 'bullseye/sid') {
               this.versionId = 'siduction'
            }
         }
      } else if (this.versionId === 'testing') {
         // Configurazione per netrunner
         const debianVersion = fs.readFileSync('/etc/debian_version', 'utf8')
         if (debianVersion.trim() === 'buster/sid') {
            this.versionId = 'netrunner'
         }
      }
         

      
      /**
       * LINUX MINT dall 19 in poi
       */

      // LinuxMint 19 tara, 19.1 tessa, 19.2 Tina, 19.3 Tricia
      if (this.versionId === 'tara' || this.versionId === 'tessa' || this.versionId === 'tina' || this.versionId === 'tricia') {
         this.distroId = 'Linux Mint'
         this.distroLike = 'Ubuntu'
         this.versionLike = 'bionic'

         // LinuxMint 20 ulyana, 20.1 ulyssa
      } else if (this.versionId === 'ulyana' || this.versionId === 'ulyssa') {
         this.distroId = 'Linux Mint'
         this.distroLike = 'Ubuntu'
         this.versionLike = 'focal'

         /**
          * LINUX MINT DEBIAN EDITION (LMDE)
          */

         // LMDE 4 debbie
      } else if (this.versionId === 'debbie') {
         this.distroId = 'LMDE'
         this.distroLike = 'Debian'
         this.versionLike = 'buster'

         /**
          * DEBIAN
          */

         // Debian 11 bullseye
      } else if (this.versionId === 'bullseye') {
         this.distroId = 'Debian'
         this.distroLike = 'Debian'
         this.versionLike = 'bullseye'

         // Debian 11 siduction
      } else if (this.versionId === 'siduction') {
         this.distroId = 'Debian'
         this.distroLike = 'Debian'
         this.versionLike = 'bullseye'

      } else if (this.versionId === 'netrunner') {
         this.distroId = 'Debian'
         this.distroLike = 'Debian'
         this.versionLike = 'buster'

         // Debian 10 buster
      } else if (this.versionId === 'buster') {
         this.distroId = 'Debian'
         this.distroLike = 'Debian'
         this.versionLike = 'buster'

         // Debian 9 stretch
      } else if (this.versionId === 'stretch') {
         this.distroId = 'Debian'
         this.distroLike = 'Debian'
         this.versionLike = 'stretch'
      } // Deepin 20
      else if (this.versionId === 'n/a') {
         const checkDistroId = shell.exec('lsb_release -i -s', { silent: true }).stdout.toString().trim()
         if (checkDistroId === 'Deepin') {
            this.distroId = 'Deepin'
            this.versionId = 'apricot'
         } else {
            this.distroId = checkDistroId
            this.versionId = 'unknown'
         }
         this.distroLike = 'Debian'
         this.versionLike = 'bullseye'

         /**
          * DEVUAN
          */
      } else if (this.versionId === 'beowulf') {
         this.distroId = 'Devuan'
         this.versionId = 'beowulf'
         this.distroLike = 'Devuan'
         this.versionLike = 'beowulf'

         /**
          * UBUNTU
          */
         // 20.10 groovy
      } else if (this.versionId === 'groovy') {
         this.distroId = 'Ubuntu'
         this.distroLike = 'Ubuntu'
         this.versionLike = 'groovy'

         // 20.04 focal LTS
      } else if (this.versionId === 'focal') {
         this.distroId = 'Ubuntu'
         this.distroLike = 'Ubuntu'
         this.versionLike = 'focal'

         // Ubuntu 18.04 bionic LTS eol aprile 2023
      } else if (this.versionId === 'bionic') {
         this.distroId = 'Ubuntu'
         this.distroLike = 'Ubuntu'
         this.versionLike = 'bionic'
      } else {
         console.log("Sorry, this distro is not supported, I'll try Debian Buster mode!")
         this.distroId = 'custom'
         this.distroLike = 'Debian'
         this.versionLike = 'buster'
      }

      /**
       * Selezione il mountpoint per squashfs
       */
      if (this.versionLike === 'jessie' || this.versionLike === 'stretch' || this.versionLike === 'bionic' || this.versionLike === 'xenial') {
         this.mountpointSquashFs = '/lib/live/mount/medium/live/filesystem.squashfs'
      } else {
         this.mountpointSquashFs = '/run/live/medium/live/filesystem.squashfs'
      }
      /**
       * MX LINUX
       * ln -s /run/live/medium/live/filesystem.squashfs /live/boot-dev/antiX/linuxfs
       */
      if (fs.existsSync('/etc/antix-version')) {
         this.distroId = 'antiX/MX'
         // if (!fs.existsSync('/live/boot-dev/antiX/')) {
         //    shell.exec('mkdir /live/boot-dev/antiX/ -p')
         //  }
         // this.mountpointSquashFs = '/live/boot-dev/antiX/linuxfs'
      }
      /**
       * e le posizioni per isolinux e syslinux
       */
      this.isolinuxPath = '/usr/lib/ISOLINUX/'
      this.syslinuxPath = '/usr/lib/syslinux/modules/bios/'
   }
}

export default Distro
