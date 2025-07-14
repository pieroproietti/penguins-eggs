/**
 * ./src/classes/families/aldos.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
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
export default class Aldos {

  /**
   *
   */
  static async calamaresInstall(verbose = true): Promise<void> {
    const echo = Utils.setEcho(verbose)
    try {
      await exec(`yum install -y calamares}`, echo)
    } catch {
      Utils.error(`aldos.calamaresInstall()`)
    }
  }

  /**
   * 
   * calamaresPolicies
   */
  static async calamaresPolicies(verbose = false) {
    // nothing
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

    await exec('yum remove -y calamares', echo)
    return retVal
  }

  /**
   * check if it's installed wayland
   * @returns true if wayland
   */
  static isInstalledWayland(): boolean {
    return this.packageIsInstalled('xorg-x11-server-Xwayland*')
  }

  /**
   * check if it's installed xorg
   * @returns true if xorg is installed
   */
  static isInstalledXorg(): boolean {
    return this.packageIsInstalled('xorg-x11-server-Xorg.x86_64')
  }

  /**
   * restuisce VERO se il pacchetto è installato
   * @param packageName
   */
  static async packageAvailable(packageName: string): Promise<boolean> {
    let available = false
    const cmd = `/usr/bin/yum list --available ${packageName} | grep Package:`
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
    if (shx.exec(`/usr/bin/yum install ${packageName}`, { silent: true }) === '0') {
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
    const cmd = `/usr/bin/yum list installed ${packageName}`
    const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
    if (stdout.includes(packageName)) {
      installed = true
    }

    return installed
  }
}
