/* eslint-disable no-console */
/**
 * penguins-eggs: Distro.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

'use strict'
import fs = require('fs')
import { IRemix, IDistro } from '../interfaces'

import Utils from './utils'

import shell = require('shelljs')


/**
 * Classe 
 */
class Distro implements IDistro {
  distroName: string
  distroId: string
  distroLike: string
  versionId: string
  versionLike: string
  isolinuxPath: string
  syslinuxPath: string
  mountpointSquashFs: string
  append: string
  appendSafe: string
  aqs: string
  menuTitle: string
  homeUrl: string
  supportUrl: string
  bugReportUrl: string
  distroVersionNumber: string

  constructor(remix: IRemix) {
    this.distroName = ''
    this.distroId = ''
    this.distroLike = ''
    this.distroVersionNumber = ''
    this.versionId = ''
    this.versionLike = ''
    this.isolinuxPath = ''
    this.syslinuxPath = ''
    this.mountpointSquashFs = ''
    this.append = ''
    this.appendSafe = ''
    this.aqs = ''
    this.menuTitle = ''
    this.homeUrl = ''
    this.supportUrl = ''
    this.bugReportUrl = ''


    const file = '/etc/os-release'
    let data: string
    if (fs.existsSync(file)) {
      data = fs.readFileSync(file, 'utf8')
    }


    // inizio
    enum info { HOME_URL, SUPPORT_URL, BUG_REPORT_URL }

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
    this.versionId = (shell.exec('lsb_release -c -s', { silent: true }).stdout).toString().trim()
    this.isolinuxPath = '/usr/lib/ISOLINUX/'
    this.syslinuxPath = '/usr/lib/syslinux/modules/bios/'
    this.mountpointSquashFs = '/lib/live/mount/medium/live/filesystem.squashfs'
    this.distroName = remix.name
    this.distroVersionNumber = remix.versionNumber

    /** 
     * LINUX MINT
     */

    // LinuxMint 18. Sarah, 18.1 Serena, 18.2 Sonia, 18.3 Sylvia
    if (this.versionId === 'sarah' || this.versionId === 'serena' || this.versionId === 'sonya' || this.versionId === 'sylvia') {
      this.distroId = 'Linux Mint'
      this.distroLike = 'Ubuntu'
      this.versionLike = 'xenial'

      // LinuxMint 19 tara, 19.1 tessa, 19.2 Tina, 19.3 Tricia
    } else if (this.versionId === 'tara' || this.versionId === 'tessa' || this.versionId === 'tina' || this.versionId === 'tricia') {
      this.distroId = 'Linux Mint'
      this.distroLike = 'Ubuntu'
      this.versionLike = 'bionic'
      this.mountpointSquashFs = '/lib/live/mount/medium/live/filesystem.squashfs'

      /** 
       * LINUX MINT DEBIAN EDITION (LMDE)
       */

      // LMDE 4 debbie
    } else if (this.versionId === 'debbie') {
      this.distroId = 'LMDE'
      this.distroLike = 'Debian'
      this.versionLike = 'buster'
      this.mountpointSquashFs = '/run/live/medium/live/filesystem.squashfs'

      /** 
       * DEBIAN
       */

      // Debian 11 bullseye
    } else if (this.versionId === 'bullseye') {
      this.distroId = 'Debian'
      this.distroLike = 'Debian'
      this.versionLike = 'bullseye'
      this.mountpointSquashFs = '/run/live/medium/live/filesystem.squashfs'

      // Debian 10 buster
    } else if (this.versionId === 'buster') {
      this.distroId = 'Debian'
      this.distroLike = 'Debian'
      this.versionLike = 'buster'
      this.mountpointSquashFs = '/run/live/medium/live/filesystem.squashfs'

      // Debian 9 stretch
    } else if (this.versionId === 'stretch') {
      this.distroId = 'Debian'
      this.distroLike = 'Debian'
      this.versionLike = 'stretch'
      this.mountpointSquashFs = '/lib/live/mount/medium/live/filesystem.squashfs'

      /**
       * UBUNTU
       */
      // 20.04 focal LTS 
    } else if (this.versionId === 'focal') {
      this.distroId = 'Ubuntu'
      this.distroLike = 'Ubuntu'
      this.versionLike = 'focal'
      this.mountpointSquashFs = '/run/live/medium/live/filesystem.squashfs'

      // 19.10 eoan
    } else if (o.versionId === 'eoan') {
      this.distroId = 'Ubuntu'
      this.distroLike = 'Ubuntu'
      this.versionLike = 'eoan'
      this.mountpointSquashFs = '/run/live/medium/live/filesystem.squashfs'

      // Ubuntu 19.04 disco
    } else if (o.versionId === 'disco') {
      this.distroId = 'Ubuntu'
      this.distroLike = 'Ubuntu'
      this.versionLike = 'disco'
      this.mountpointSquashFs = '/run/live/medium/live/filesystem.squashfs'

      // Ubuntu 18.10 cosmic
    } else if (o.versionId === 'cosmic') {
      this.distroId = 'Ubuntu'
      this.distroLike = 'Ubuntu'
      this.versionLike = 'cosmic'
      this.mountpointSquashFs = '/run/live/medium/live/filesystem.squashfs'

      // Ubuntu 18.04 bionic LTS
    } else if (o.versionId === 'bionic') {
      this.distroId = 'Ubuntu'
      this.distroLike = 'Ubuntu'
      this.versionLike = 'bionic'
      this.mountpointSquashFs = '/lib/live/mount/medium/live/filesystem.squashfs'

    } else {
      console.log('Sorry, distro non supported!')
    }

    // Sia per Ubuntu che per Debian
    this.append = 'append initrd=/live/initrd.img boot=live live-config quiet splash'
    this.appendSafe = 'append initrd=/live/initrd.img boot=live live-config xforcevesa nomodeset verbose'
    this.menuTitle = `MENU TITLE ${this.distroName} a ${this.distroId}/${this.versionId} derivated. ${Utils.formatDate(new Date())}`
  }
}

export default Distro

