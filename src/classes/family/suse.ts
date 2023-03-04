/**
 * penguins-eggs-v8
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'node:fs'
import shx from 'shelljs'
import Utils from '../utils'
import Pacman from '../pacman'
import {array2spaced} from '../../lib/dependencies'
import {exec} from '../../lib/utils'

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Suse {
  static packs4calamares = ['calamares']

  /**
   * check if it's installed xorg
   * @returns true if xorg is installed
   */
  static isInstalledXorg(): boolean {
    return this.packageIsInstalled('xorg-x11-server')
  }

  /**
   * check if it's installed wayland
   * @returns true if wayland
   */
  static isInstalledWayland(): boolean {
    return this.packageIsInstalled('xwayland*')
  }

  /**
   * Crea array pacchetti da installare/rimuovere
   */
  static packages(remove = false, verbose = false): string[] {
    // Preso qualcosa da livecd-tools
    const packages = ['xorriso', 'syslinux', 'squashfs']

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

    await exec(`dnf install ${array2spaced(this.packages(false, verbose))}`, echo)

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
  static async calamaresInstall(verbose = true): Promise<void> {
    const echo = Utils.setEcho(verbose)
    try {
      await exec(`zypper install ${array2spaced(this.packs4calamares)}`, echo)
    } catch {
      Utils.error(`Fedora.calamaresInstall() pacman -Sy ${array2spaced(this.packs4calamares)}`) // + e.error)
    }
  }

  /**
   * calamaresPolicies
   */
  static async calamaresPolicies() {
    const policyFile = '/usr/share/polkit-1/actions/com.github.calamares.calamares.policy'
    /**
     * Su fedora occorre vedere come fare!
     */
    // await exec(`sed -i 's/auth_admin/yes/' ${policyFile}`)
  }

  /**
   *
   */
  static async calamaresRemove(verbose = true): Promise<boolean> {
    const echo = Utils.setEcho(verbose)

    const retVal = false
    if (fs.existsSync('/etc/calamares')) {
      await exec('rm /etc/calamares -rf', echo)
    }

    await exec('zypper remove calamares', echo)
    return retVal
  }

  /**
   * restuisce VERO se il pacchetto è installato
   * @param packageName
   */
  static packageIsInstalled(packageName: string): boolean {
    let installed = false
    // rpm -qa | grep -i nano
    const cmd = `/usr/bin/zypper search --installed-only ${packageName}`
    const stdout = shx.exec(cmd, {silent: true}).stdout.trim()
    if (stdout.includes(packageName)) {
      installed = true
    }

    return installed
  }

  /**
   * Install the package packageName
   * @param packageName {string} Pacchetto da installare
   * @returns {boolean} True if success
   */
  static async packageInstall(packageName: string): Promise<boolean> {
    let retVal = false
    if (shx.exec(`/usr/bin/zypper install ${packageName}`, {silent: true}) === '0') {
      retVal = true
    }

    return retVal
  }

  /**
   * restuisce VERO se il pacchetto è installato
   * @param packageName
   */
  static async packageAvailable(packageName: string): Promise<boolean> {
    let available = false
    const cmd = `/usr/bin/zypper --not-installed-only ${packageName} | grep Package:`
    const stdout = shx.exec(cmd, {silent: true}).stdout.trim()
    if (stdout.includes(packageName)) {
      available = true
    }

    return available
  }
}
