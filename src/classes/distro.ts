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
import inquirer = require('inquirer')

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
   guiInstaller: boolean

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
      this.guiInstaller = true


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
       * lsb_release -cs per versione ed lsb_release -is per distribuzione
       */
      this.versionId = shell.exec('lsb_release -cs', { silent: true }).stdout.toString().trim()
      this.distroId = shell.exec('lsb_release -is', { silent: true }).stdout.toString().trim()

      /**
       * Per casi equivoci conviene normalizzare versionId
       */
      if (this.versionId === 'n/a') {
         // può essere Deepin apricot
         if (this.distroId === 'Deepin') {
            this.versionId = 'apricot'
         } else if (fs.existsSync('/etc/debian_version')) {
            const debianVersion = fs.readFileSync('/etc/debian_version', 'utf8')
            if (debianVersion.trim() === 'bullseye/sid') {
               this.versionId = 'bullseye'
            }
         }
      } else if (this.versionId === 'sid') {
         // sinora ho trovato solo siduction
         if (fs.existsSync('/etc/debian_version')) {
            const debianVersion = fs.readFileSync('/etc/debian_version', 'utf8')
            if (debianVersion.trim() === 'bullseye/sid') {
               this.versionId = 'siduction'
            }
         }
      } else if (this.versionId === 'testing') {
         if (this.distroId === 'Netrunner') {
            this.versionId = 'buster/sid'
         }
      }

      // Procedo analizzanto solo versionId...

      // prima Debian, Devuan ed Ubuntu
      if (this.versionId === 'jessie') {
         // Debian 8 jessie
         this.distroLike = 'Debian'
         this.versionLike = 'jessie'
      } else if (this.versionId === 'stretch') {
         // Debian 9 stretch
         this.distroLike = 'Debian'
         this.versionLike = 'stretch'
      } else if (this.versionId === 'buster') {
         // Debian 10 buster
         this.distroLike = 'Debian'
         this.versionLike = 'buster'
      } else if (this.versionId === 'bullseye') {
         // Debian 11 bullseye
         this.distroLike = 'Debian'
         this.versionLike = 'bullseye'

      } else if (this.versionId === 'beowulf') {
         this.distroLike = 'Devuan'
         this.versionLike = 'beowulf'

      } else if (this.versionId === 'xenial') {
         // Ubuntu xenial
         this.distroLike = 'Ubuntu'
         this.versionLike = 'xenial'
      } else if (this.versionId === 'bionic') {
         // Ubuntu 18.04 bionic LTS eol aprile 2023
         this.distroLike = 'Ubuntu'
         this.versionLike = 'bionic'
      } else if (this.versionId === 'focal') {
         // Ubuntu 20.04 focal LTS
         this.distroLike = 'Ubuntu'
         this.versionLike = 'focal'
      } else if (this.versionId === 'groovy') {
         // Ubuntu 20.10 groovy
         this.distroLike = 'Ubuntu'
         this.versionLike = 'groovy'

         // quindi le derivate...

      } else if (this.versionId === 'roma') {
         // UfficioZero roma
         this.distroLike = 'Devuan'
         this.versionLike = 'beowulf'
      } else if (this.versionId === 'tropea') {
         // UfficioZero tropea
         this.distroLike = 'Ubuntu'
         this.versionLike = 'focal'
      } else if (this.versionId === 'vieste') {
         // UfficioZero tropea
         this.distroLike = 'Ubuntu'
         this.versionLike = 'bionic'
      } else if (this.versionId === 'siena') {
         // UfficioZero siena
         this.distroLike = 'Debian'
         this.versionLike = 'buster'

      } else if (this.versionId === 'tara' || this.versionId === 'tessa' || this.versionId === 'tina' || this.versionId === 'tricia') {
         // LinuxMint 19.x
         this.distroLike = 'Ubuntu'
         this.versionLike = 'bionic'
      } else if (this.versionId === 'ulyana' || this.versionId === 'ulyssa') {
         // LinuxMint 20.x
         this.distroLike = 'Ubuntu'
         this.versionLike = 'focal'
      } else if (this.versionId === 'debbie') {
         // LMDE 4 debbie
         this.distroLike = 'Debian'
         this.versionLike = 'buster'

      } else if (this.versionId === 'apricot') {
         // Deepin 20 apricot
         this.distroLike = 'Debian'
         this.versionLike = 'bullseye'

      } else if (this.versionId === 'siduction') {
         // Debian 11 Siduction
         this.distroLike = 'Debian'
         this.versionLike = 'bullseye'
      } else if (this.versionId === 'buster/sid') {
         // Netrunner
         this.distroLike = 'Debian'
         this.versionLike = 'buster'
      } else {

         // se proprio non riesco chiedo l'intervento dell'utente
         console.log("This distro is not yet recognized, but you can choose a compatible version")
         // Dato che occorre await evito al momento
         // this.distroLike = await getDistroLike()
         // this.versionLike = await getVersionLike(this.distroLike)
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
       * isCalamaresCompliant
       */
       if (this.versionLike === 'jessie' || this.versionLike === 'stretch' || this.versionLike === 'xenial') {
          this.guiInstaller = false
      }
      

      /**
       * MX LINUX
       * ln -s /run/live/medium/live/filesystem.squashfs /live/boot-dev/antiX/linuxfs
       */
      if (fs.existsSync('/etc/antix-version')) {
         this.distroId = 'MX'
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
