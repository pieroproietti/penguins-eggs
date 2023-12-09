/* eslint-disable no-console */
/**
 * penguins-eggs
 * classes/families: archilinux.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs, { truncate } from 'node:fs'
import shx from 'shelljs'
import Utils from '../utils'
import Pacman from '../pacman'
import { array2spaced } from '../../lib/dependencies'
import { exec } from '../../lib/utils'

/**
 * Archlinux
 * @remarks all the utilities
 */
export default class Archlinux {
  static packs4calamares = ['calamares-eggs']  // , 'calamares', 'calamares-git']

  /**
   * Archlinux: isInstalledXorg
   * @returns true if xorg is installed
   */
  static isInstalledXorg(): boolean {
    return this.packageIsInstalled('xorg-server-common')
  }

  /**
   * Archlinux: isInstalledWayland
   * @returns true if wayland is installed
   */
  static isInstalledWayland(): boolean {
    return this.packageIsInstalled('xwayland')
  }

  /**
   * Archlinux: packages
   * Create array packages to install/remove
   */
  static packages(remove = false, verbose = false): string[] {
    const packages = [''] // 'arch-install-scripts',  'e2fsprogs', 'erofs-utils', 'findutils', 'gzip', 'libarchive', 'libisoburn', 'mtools', 'openssl', 'rsync', 'sed', 'syslinux', 'squashfs-tools']

    const toInstall: string[] = []
    const toRemove: string[] = []

    for (const elem of packages) {
      if (!this.packageIsInstalled(elem)) {
        toInstall.push(elem)
      } else {
        toRemove.push(elem)
      }
    }

    if (remove) {
      return toRemove
    }

    return toInstall
  }

  /**
   * Archlinux: prerequisitesInstall
   */
  static async prerequisitesInstall(verbose = true): Promise<boolean> {
    const echo = Utils.setEcho(verbose)
    const retVal = false

    await exec(`pacman -Sy ${array2spaced(this.packages(false, verbose))}`, echo)

    if (!Pacman.isInstalledGui()) {
      /**
       * live-config-getty-generator
       *
       * Viene rimosso in naked, altrimenti non funziona il login
       * generando un errore getty.
       * Sarebbe utile individuarne le ragioni, forse rompe anche sul desktop
       * non permettendo di cambiare terminale e loggarsi
       *
       * A che serve?
       */
      const fileToRemove = '/lib/systemd/system-generators/live-config-getty-generator'
      if (fs.existsSync(fileToRemove)) {
        await exec(`rm ${fileToRemove}`)
      }
    }

    return retVal
  }

  /**
   * Archlinux: calamaresInstall
   */
  static async calamaresInstall(verbose = false): Promise<void> {
    verbose = true // serve per pacman
    const echo = Utils.setEcho(verbose)
    // const cal_eggs = 'calamares-eggs-3.3.0.r10616.11e1659ca-1-x86_64.pkg.tar.zst'
    // const cal_eggs = 'calamares-eggs-3.3.0.r10707.4b3278058-1-x86_64.pkg.tar.zst' // 2023-09-04 
    // const cal_eggs = 'arco-calamares-git-3.3.0.r10680.9becd7d1b-1-x86_64.pkg.tar.zst' // 2023-09-20 
    const cal_eggs = 'arco-calamares-3.3.0.alpha5-02-x86_64.pkg.tar.zst' // 2023-10-25
    let cmd = `wget -O /tmp/${cal_eggs} https://sourceforge.net/projects/penguins-eggs/files/PKGBUILD/${cal_eggs}/download`
    try {
      await exec(cmd, echo)
      cmd = `pacman -U /tmp/${cal_eggs}`
      try {
        await exec(cmd, echo)
      } catch {
        Utils.error(`Cannot install /tmp/${cal_eggs}`) // + e.error)
      }
    } catch {
      Utils.error(`Cannot download ${cal_eggs}`) // + e.error)
    }
  }

  /**
   * Archlinux: calamaresPolicies
   */
  static async calamaresPolicies() {
    const policyFile = '/usr/share/polkit-1/actions/com.github.calamares.calamares.policy'
    await exec(`sed -i 's/auth_admin/yes/' ${policyFile}`)
  }

  /**
   * Archlinux: calamaresRemove
   */
  static async calamaresRemove(verbose = true): Promise<boolean> {
    verbose = true // serve per pacman

    let removed = false
    const echo = Utils.setEcho(verbose)
    
    let calPKGs = [
      'arco-calamares-git',
      'calamares-eggs', 
      'calamares-git', 
      'calamares', 
    ]
    for(const calPKG of calPKGs){
      if (await this.packagePacmanAvailable(calPKG)) {
        await exec(`pacman -R ${calPKG}`, echo)
        removed = true
      }
    }

    if (removed) {
      if (fs.existsSync('/etc/calamares')) {
        await exec('rm /etc/calamares -rf', echo)
      }
    }
    return removed
  }

  /**
   * Archlinux: packageIsInstalled
   * restuisce VERO se il pacchetto è installato
   * @param packageName
   */
  static packageIsInstalled(packageName: string): boolean {
    let installed = false
    const cmd = `/usr/bin/pacman -Qi ${packageName}`
    const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
    if (stdout.includes(packageName)) {
      installed = true
    }

    return installed
  }

  /**
   * Archlinux: packageInstall
   * Install the package packageName
   * @param packageName {string} Pacchetto Debian da installare
   * @returns {boolean} True if success
   */
  static async packageInstall(packageName: string): Promise<boolean> {
    let retVal = false
    if (shx.exec(`/usr/bin/pacman -Si ${packageName}`, { silent: true }) === '0') {
      retVal = true
    }

    return retVal
  }

  /**
   * Archlinux: packagePacmanAvailable
   * restuisce VERO se il pacchetto è installato
   * @param packageName
   */
  static async packagePacmanAvailable(packageName: string): Promise<boolean> {
    let available = false
    const cmd = `/usr/bin/pacman -Q ${packageName} | awk '{ print $1 }'`
    const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
    if (stdout == packageName) {
      available = true
    }
    return available
  }

  /**
   * Archlinux: packagePacmanLast
   * @param packageName
   * @returns
   */
  static async packagePacmanLast(packageName: string): Promise<string> {
    let version = ''
    const cmd = `/usr/bin/pacman -Q ${packageName} | grep Version:`
    const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
    version = stdout.slice(9)
    // console.log('===================================')
    // console.log('[' + version + ']')
    // console.log('===================================')
    return version
  }
}
