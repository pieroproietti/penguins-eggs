/**
 * penguins-eggs-v8
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs, { truncate } from 'node:fs'
import shx from 'shelljs'
import Utils from '../utils'
import Pacman from '../pacman'
import {array2spaced} from '../../lib/dependencies'
import {exec} from '../../lib/utils'

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Archlinux {
  static packs4calamares = ['calamares','arco-calamares-git']

  /**
   * check if it's installed xorg
   * @returns true if xorg is installed
   */
  static isInstalledXorg(): boolean {
    return this.packageIsInstalled('xorg-server-common')
  }

  /**
   * check if it's installed wayland
   * @returns true if wayland
   */
  static isInstalledWayland(): boolean {
    return this.packageIsInstalled('xwayland')
  }

  /**
   * Crea array pacchetti da installare/rimuovere
   */
  static packages(remove = false, verbose = false): string[] {
    /**
     * praticamente non serve, perche prende dal pacchetto o da pkgbuild
     */
    // non può essere pacman è universalmente presente
    // 'pacman', 'awk', 'dosfstools'
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
   *
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
   * Torna verso se calamares è installato
   */
  static async calamaresCheck(): Promise<boolean> {
    let installed = true
    for (const i in this.packs4calamares) {
      if (!this.packageIsInstalled(this.packs4calamares[i])) {
        installed = false
        break
      }
    }

    return installed
  }

  /**
   *
   */
  static async calamaresInstall(verbose = false): Promise<void> {
    verbose = true // serve per pacman
    const echo = Utils.setEcho(verbose)
    const cmd = `pacman -Sy --noconfirm ${array2spaced(this.packs4calamares)}`
    try {
      await exec(cmd, echo)
    } catch {
      Utils.error(`Archlinux.calamaresInstall(): ${cmd}`) // + e.error)
    }
  }

  /**
   * calamaresPolicies
   */
  static async calamaresPolicies() {
    const policyFile = '/usr/share/polkit-1/actions/com.github.calamares.calamares.policy'
    await exec(`sed -i 's/auth_admin/yes/' ${policyFile}`)
  }

  /**
   *
   */
  static async calamaresRemove(verbose = true): Promise<boolean> {
    verbose = true // serve per pacman

    let removed = false
    const echo = Utils.setEcho(verbose)

    if (await this.packagePacmanAvailable('calamares')){
      await exec('pacman -R calamares', echo)
      removed = true
    } else if (await this.packagePacmanAvailable('calamares-git')){
      await exec('pacman -R calamares-git', echo)
      removed = true
    }

    if (removed) {
      if (fs.existsSync('/etc/calamares')) {
        await exec('rm /etc/calamares -rf', echo)
      }
    }
    return removed
  }

  /**
   * restuisce VERO se il pacchetto è installato
   * @param packageName
   */
  static packageIsInstalled(packageName: string): boolean {
    let installed = false
    const cmd = `/usr/bin/pacman -Qi ${packageName}`
    const stdout = shx.exec(cmd, {silent: true}).stdout.trim()
    if (stdout.includes(packageName)) {
      installed = true
    }

    return installed
  }

  /**
   * Install the package packageName
   * @param packageName {string} Pacchetto Debian da installare
   * @returns {boolean} True if success
   */
  static async packageInstall(packageName: string): Promise<boolean> {
    let retVal = false
    if (shx.exec(`/usr/bin/pacman -Si ${packageName}`, {silent: true}) === '0') {
      retVal = true
    }

    return retVal
  }

  /**
   * restuisce VERO se il pacchetto è installato
   * @param packageName
   */
  static async packagePacmanAvailable(packageName: string): Promise<boolean> {
    let available = false
    const cmd = `/usr/bin/pacman -Q ${packageName} | awk '{ print $1 }'`
    const stdout = shx.exec(cmd, {silent: true}).stdout.trim()
    if (stdout == packageName) {
      available = true
    }
    return available
  }

  /**
   *
   * @param packageName
   * @returns
   */
  static async packagePacmanLast(packageName: string): Promise<string> {
    let version = ''
    const cmd = `/usr/bin/pacman -Q ${packageName} | grep Version:`
    const stdout = shx.exec(cmd, {silent: true}).stdout.trim()
    version = stdout.slice(9)
    // console.log('===================================')
    // console.log('[' + version + ']')
    // console.log('===================================')
    return version
  }
}
