/* eslint-disable no-console */
/**
 * penguins-eggs
 * classes/families: archilinux.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'node:fs'
import shx from 'shelljs'
import Utils from '../utils'
import Pacman from '../pacman'
import { array2spaced } from '../../lib/dependencies'
import { exec } from '../../lib/utils'

/**
 * Mockup
 * @remarks all the utilities
 */
export default class Mockup {

  /**
   * Mockup: isInstalledXorg
   * @returns true if xorg is installed
   */
  static isInstalledXorg(): boolean {
    return this.packageIsInstalled('xorg-server-common')
  }

  /**
   * Mockup: isInstalledWayland
   * @returns true if wayland is installed
   */
  static isInstalledWayland(): boolean {
    return this.packageIsInstalled('xwayland')
  }

  /**
   * Mockup: packages
   * Create array packages to install/remove
   */
  static packages(remove = false, verbose = false): string[] {
    let packages =['']
    return packages
  }

  /**
   * Mockup: prerequisitesInstall
   */
  static async prerequisitesInstall(verbose = true): Promise<boolean> {
    let retVal = false
    return retVal
  }

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
    let removed=false
    return removed
  }

  /**
   * Mockup: packageIsInstalled
   * restuisce VERO se il pacchetto è installato
   * @param packageName
   */
  static packageIsInstalled(packageName: string): boolean {
    let installed = false
    return installed
  }

  /**
   * Mockup: packageInstall
   * Install the package packageName
   * @param packageName {string}
   * @returns {boolean} True if success
   */
  static async packageInstall(packageName: string): Promise<boolean> {
    let retVal = false
    return retVal
  }

  /**
   * Mockup: packagePacmanAvailable
   * restuisce VERO se il pacchetto è installato
   * @param packageName
   */
  static async packagePacmanAvailable(packageName: string): Promise<boolean> {
    let available = false
    return available
  }

  /**
   * Mockup: packagePacmanLast
   * @param packageName
   * @returns
   */
  static async packagePacmanLast(packageName: string): Promise<string> {
    let version = ''
    return version
  }
}
