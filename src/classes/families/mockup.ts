/**
 * ./src/classes/families/mockup.ts
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
 * Mockup
 * @remarks all the utilities
 */
export default class Mockup {

  /**
   * Mockup: calamaresInstall
   */
  static async calamaresInstall(verbose = false): Promise<void> {
  }

  /**
   * Mockup: calamaresPolicies
   */
  static async calamaresPolicies() {
  }

  /**
   * Mockup: calamaresRemove
   */
  static async calamaresRemove(verbose = true): Promise<boolean> {
    const removed=false
    return removed
  }

  /**
   * Mockup: isInstalledWayland
   * @returns true if wayland is installed
   */
  static isInstalledWayland(): boolean {
    return this.packageIsInstalled('xwayland')
  }

  /**
   * Mockup: isInstalledXorg
   * @returns true if xorg is installed
   */
  static isInstalledXorg(): boolean {
    return this.packageIsInstalled('xorg-server-common')
  }

  /**
   * Mockup: packageInstall
   * Install the package packageName
   * @param packageName {string}
   * @returns {boolean} True if success
   */
  static async packageInstall(packageName: string): Promise<boolean> {
    const retVal = false
    return retVal
  }

  /**
   * Mockup: packageIsInstalled
   * restuisce VERO se il pacchetto è installato
   * @param packageName
   */
  static packageIsInstalled(packageName: string): boolean {
    const installed = false
    return installed
  }

  /**
   * Mockup: packagePacmanAvailable
   * restuisce VERO se il pacchetto è installato
   * @param packageName
   */
  static async packagePacmanAvailable(packageName: string): Promise<boolean> {
    const available = false
    return available
  }

  /**
   * Mockup: packagePacmanLast
   * @param packageName
   * @returns
   */
  static async packagePacmanLast(packageName: string): Promise<string> {
    const version = ''
    return version
  }
}
