/**
 * ./src/classes/families/gentoo.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 *
 * Gentoo Linux family support using Portage package manager.
 * Uses `equery` (from gentoolkit) for package queries and
 * `emerge` for package installation/removal.
 */

import fs from 'node:fs'

import { exec, shx } from '../../lib/utils.js'
import Utils from '../utils.js'

/**
 * Gentoo
 * @remarks all the utilities
 */
export default class Gentoo {
  static packs4calamares = ['app-misc/calamares']

  /**
   * Gentoo: calamaresInstall
   *
   * Calamares is not in the main Gentoo tree by default.
   * Users may need to add an overlay (e.g., GURU) that provides it.
   * For now, attempt emerge; if unavailable, advise using krill.
   */
  static async calamaresInstall(verbose = false): Promise<void> {
    verbose = true
    const echo = Utils.setEcho(verbose)
    try {
      const cmd = `emerge --ask=n --noreplace app-misc/calamares`
      await exec(cmd, echo)
    } catch {
      Utils.error(`Cannot install calamares on Gentoo. Consider using krill installer instead, or add an overlay providing calamares.`)
    }
  }

  /**
   * calamaresPolicies
   */
  static async calamaresPolicies(verbose = false) {
    const echo = Utils.setEcho(verbose)
    const policyFile = '/usr/share/polkit-1/actions/io.calamares.calamares.policy'
    if (fs.existsSync(policyFile)) {
      await exec(`sed -i 's/auth_admin/yes/' ${policyFile}`, echo)
    }
  }

  /**
   * Gentoo: calamaresRemove
   */
  static async calamaresRemove(verbose = true): Promise<boolean> {
    verbose = true
    let success = false
    const echo = Utils.setEcho(verbose)
    try {
      await exec('emerge --ask=n --depclean app-misc/calamares', echo)
      success = true
    } catch {
      Utils.error(`Cannot remove calamares`)
    }

    if (success && fs.existsSync('/etc/calamares')) {
      await exec('rm /etc/calamares -rf', echo)
    }

    return success
  }

  /**
   * Gentoo: isInstalledWayland
   * @returns true if wayland is installed
   */
  static isInstalledWayland(): boolean {
    return this.packageIsInstalled('x11-base/xwayland')
  }

  /**
   * Gentoo: isInstalledXorg
   * @returns true if xorg is installed
   */
  static isInstalledXorg(): boolean {
    return this.packageIsInstalled('x11-base/xorg-server')
  }

  /**
   * Gentoo: packageInstall
   * Install the package packageName
   * @param packageName {string} Gentoo package atom (e.g., app-misc/foo)
   * @returns {boolean} True if success
   */
  static async packageInstall(packageName: string): Promise<boolean> {
    let retVal = false
    if (shx.exec(`emerge --ask=n --noreplace ${packageName}`, { silent: true }).code === 0) {
      retVal = true
    }

    return retVal
  }

  /**
   * Gentoo: packageIsInstalled
   * Returns true if the package is installed.
   *
   * Uses `equery list` from gentoolkit if available,
   * falls back to checking /var/db/pkg directly.
   * @param packageName - can be a full atom (cat/pkg) or just a package name
   */
  static packageIsInstalled(packageName: string): boolean {
    let installed = false

    // Try equery first (from gentoolkit)
    if (fs.existsSync('/usr/bin/equery')) {
      const cmd = `/usr/bin/equery -q list ${packageName}`
      const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
      if (stdout.length > 0) {
        installed = true
      }
    } else {
      // Fallback: check /var/db/pkg directly
      // For a full atom like "app-misc/foo", check /var/db/pkg/app-misc/foo-*
      // For a bare name like "foo", search all categories
      if (packageName.includes('/')) {
        const parts = packageName.split('/')
        const category = parts[0]
        const name = parts[1]
        const pkgDir = `/var/db/pkg/${category}`
        if (fs.existsSync(pkgDir)) {
          const entries = fs.readdirSync(pkgDir)
          installed = entries.some((e: string) => e.startsWith(name + '-') || e === name)
        }
      } else {
        // Search all categories
        const dbPath = '/var/db/pkg'
        if (fs.existsSync(dbPath)) {
          const categories = fs.readdirSync(dbPath)
          for (const cat of categories) {
            const catPath = `${dbPath}/${cat}`
            try {
              const entries = fs.readdirSync(catPath)
              if (entries.some((e: string) => e.startsWith(packageName + '-') || e === packageName)) {
                installed = true
                break
              }
            } catch {
              // skip non-directories
            }
          }
        }
      }
    }

    return installed
  }

  /**
   * Gentoo: packagePacmanAvailable
   * Returns true if the package is available in the Portage tree
   * @param packageName
   */
  static async packagePacmanAvailable(packageName: string): Promise<boolean> {
    let available = false
    // Use emerge --search or equery
    if (fs.existsSync('/usr/bin/equery')) {
      const cmd = `/usr/bin/equery -q has ${packageName}`
      const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
      if (stdout.length > 0) {
        available = true
      }
    } else {
      const cmd = `emerge --search ${packageName}`
      const result = shx.exec(cmd, { silent: true })
      if (result.code === 0 && result.stdout.includes(packageName)) {
        available = true
      }
    }

    return available
  }

  /**
   * Gentoo: packagePacmanLast
   * Get the installed version of a package
   * @param packageName
   * @returns version string
   */
  static async packagePacmanLast(packageName: string): Promise<string> {
    let version = ''
    if (fs.existsSync('/usr/bin/equery')) {
      const cmd = `/usr/bin/equery -q list -F '$fullversion' ${packageName}`
      const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
      if (stdout.length > 0) {
        version = stdout.split('\n')[0]
      }
    }

    return version
  }
}
