/**
 * ./src/classes/families/archlinux.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'node:fs'
import shx from 'shelljs'

import { exec } from '../../lib/utils.js'
import Utils from '../utils.js'

/**
 * Archlinux
 * @remarks all the utilities
 */
export default class Archlinux {
  static packs4calamares = ['calamares-eggs'] // , 'calamares']

  /**
   * Archlinux: calamaresInstall
   */
  static async calamaresInstall(verbose = false): Promise<void> {
    verbose = true // serve per pacman
    const echo = Utils.setEcho(verbose)
    // const cal_eggs = 'calamares-eggs-3.3.9-1-x86_64.pkg.tar.zst' // 01/09/2024
    const cal_eggs = 'calamares-eggs-3.3.10-1-x86_64.pkg.tar.zst' // 24/10/2024
    let cmd = `wget -O /tmp/${cal_eggs} https://sourceforge.net/projects/penguins-eggs/files/Packages/AUR/${cal_eggs}/download`
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
   * Archlinux: calamaresRemove
   */
  static async calamaresRemove(verbose = true): Promise<boolean> {
    verbose = true // serve per pacman

    let removed = false
    const echo = Utils.setEcho(verbose)

    const calPKGs = ['calamares', 'calamares-eggs']
    for (const calPKG of calPKGs) {
      if (await this.packagePacmanAvailable(calPKG)) {
        await exec(`pacman -R ${calPKG}`, echo)
        removed = true
      }
    }

    if (removed && fs.existsSync('/etc/calamares')) {
      await exec('rm /etc/calamares -rf', echo)
    }

    return removed
  }

  /**
   * Archlinux: isInstalledWayland
   * @returns true if wayland is installed
   */
  static isInstalledWayland(): boolean {
    return this.packageIsInstalled('xwayland')
  }

  /**
   * Archlinux: isInstalledXorg
   * @returns true if xorg is installed
   */
  static isInstalledXorg(): boolean {
    return this.packageIsInstalled('xorg-server-common')
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
