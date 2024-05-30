/**
 * penguins-eggs
 * classes/families: suse.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */


import fs from 'node:fs'
import shx from 'shelljs'
import Utils from '../utils'
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
   *
   */
  static async calamaresInstall(verbose = true): Promise<void> {
    const echo = Utils.setEcho(verbose)
    try {
      await exec(`zypper install ${this.packs4calamares.join(' ')}`, echo)
    } catch {
      Utils.error(`Fedora.calamaresInstall() pacman -Sy ${this.packs4calamares.join(' ')}`) // + e.error)
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
