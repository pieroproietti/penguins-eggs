/**
 * ./src/classes/families/suse.ts
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
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Opensuse {
  static packs4calamares = ['calamares']

  /**
   *
   */
  static async calamaresInstall(verbose = true): Promise<void> {
    const echo = Utils.setEcho(verbose)
    try {
      await exec(`zypper install ${this.packs4calamares.join(' ')}`, echo)
    } catch {
      Utils.error(`Opensuse.calamaresInstall()`)
    }
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
   * check if it's installed wayland
   * @returns true if wayland
   */
  static isInstalledWayland(): boolean {
    return this.packageIsInstalled('xwayland*')
  }

  /**
   * check if it's installed xorg
   * @returns true if xorg is installed
   */
  static isInstalledXorg(): boolean {
    return this.packageIsInstalled('xorg-x11-server')
  }

  /**
   * restuisce VERO se il pacchetto è installato
   * @param packageName
   */
  static async packageAvailable(packageName: string): Promise<boolean> {
    let available = false
    const cmd = `/usr/bin/zypper --not-installed-only ${packageName} | grep Package:`
    const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
    if (stdout.includes(packageName)) {
      available = true
    }

    return available
  }

  /**
   * Install the package packageName
   * @param packageName {string} Pacchetto da installare
   * @returns {boolean} True if success
   */
  static async packageInstall(packageName: string): Promise<boolean> {
    let retVal = false
    if (shx.exec(`/usr/bin/zypper install ${packageName}`, { silent: true }) === '0') {
      retVal = true
    }

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
    const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
    if (stdout.includes(packageName)) {
      installed = true
    }

    return installed
  }
}
