/**
 * ./src/classes/families/debian.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'node:fs'

import { exec, shx } from '../../lib/utils.js'
import Utils from '../utils.js'

/**
 * Debian
 * @remarks all the utilities
 */
export default class Debian {
  static debs4calamares = ['calamares', 'qml-module-qtquick2', 'qml-module-qtquick-controls']

  /**
   * Debian: calamaresInstall
   */
  static async calamaresInstall(verbose = true): Promise<void> {
    const echo = Utils.setEcho(verbose)
    try {
      await exec('apt-get update --yes', echo)
    } catch {
      Utils.error('Debian.calamaresInstall() apt-get update --yes ') // + e.error as string)
    }

    try {
      // await exec(`apt-get install --yes ${array2spaced(this.debs4calamares)}`, echo)
      await exec(`apt-get install --yes ${this.debs4calamares.join(' ')}`, echo)
    } catch {
      Utils.error(`Debian.calamaresInstall() apt-get install --yes ${array2spaced(this.debs4calamares)}`) // + e.error)
    }

    // remove others calamares links
    await exec('rm -f /usr/share/applications/calamares.desktop')
  }

  /**
   * Debian: calamaresPolicies
   */
  static async calamaresPolicies(verbose = false) {
    const echo = Utils.setEcho(verbose)
    const policyFile = '/usr/share/polkit-1/actions/io.calamares.calamares.policy'
    await exec(`sed -i 's/auth_admin/yes/' ${policyFile}`, echo)
  }


  /**
   * Debian: calamaresRemove
   */
  static async calamaresRemove(verbose = true): Promise<boolean> {
    const echo = Utils.setEcho(verbose)

    const retVal = false
    if (fs.existsSync('/etc/calamares')) {
      await exec('rm /etc/calamares -rf', echo)
    }

    await exec('apt-get remove --purge --yes calamares', echo)
    await exec('apt-get autoremove --yes', echo)
    return retVal
  }

  /**
   * Debian: isInstalledWayland
   * @returns true if wayland is installed
   */
  static isInstalledWayland(): boolean {
    return this.packageIsInstalled('xwayland')
  }

  /**
   * Debian: isInstalledXorg
   * @returns true if xorg is installed
   */
  static isInstalledXorg(): boolean {
    return this.packageIsInstalled('xserver-xorg-core')
  }

  /**
   * Debian: liveInstallerPolicies
   * liveInstallerPolicies is NOT USED
   */
  static async liveInstallerPolicies() {
    const policyFile = '/usr/share/polkit-1/actions/com.github.pieroproietti.penguins-eggs.policy'
    await exec(`sed -i 's/auth_admin/yes/' ${policyFile}`)
  }

  /**
   * Debian: packageAptAvailable
   * return TRUE if package is present on repository
   * @param debPackage
   */
  static async packageAptAvailable(packageName: string): Promise<boolean> {
    let available = false
    const cmd = `apt-cache show ${packageName} | grep Package:`
    const test = `Package: ${packageName}`
    const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
    if (stdout === test) {
      available = true
    }

    return available
  }

  /**
   * Debian: packageAptLast
   * @param debPackage
   * @returns version
   */
  static async packageAptLast(debPackage: string): Promise<string> {
    let version = ''
    const cmd = `apt-cache show ${debPackage} | grep Version:`
    const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
    version = stdout.slice(9)
    // console.log('===================================')
    // console.log('[' + version + ']')
    // console.log('===================================')
    return version
  }

  /**
   * Debian: packageInstall
   * @param packageName {string} Pacchetto Debian da installare
   * @returns {boolean} True if success
   */
  static async packageInstall(packageName: string): Promise<boolean> {
    let retVal = false
    if (shx.exec('/usr/bin/apt-get install -y ' + packageName, { silent: true }).code === 0) {
      retVal = true
    }

    return retVal
  }

  /**
   * Debian: packageIsInstalled
   * restuisce VERO se il pacchetto è installato
   * @param debPackage
   */
  static packageIsInstalled(debPackage: string): boolean {
    let installed = false
    const cmd = `/usr/bin/dpkg -s ${debPackage} | grep Status:`
    const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
    if (stdout === 'Status: install ok installed') {
      installed = true
    }

    return installed
  }
}

function array2spaced(oArray: string[]) {
  return oArray.join(' ')
}
