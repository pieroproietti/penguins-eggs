/**
 * ./src/classes/families/chromiumos.ts
 * penguins-eggs v.26.2.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 *
 * ChromiumOS family package manager backend.
 *
 * ChromiumOS is Gentoo-derived. Package queries use:
 *   1. equery (from gentoolkit, if available via Gentoo Prefix or cros_sdk)
 *   2. /var/db/pkg filesystem fallback (native Portage)
 *   3. crew (Chromebrew) as a secondary package manager
 *
 * Calamares is not available in standard ChromiumOS builds;
 * krill (TUI installer) is the primary installer for this family.
 */

import fs from 'node:fs'
import path from 'node:path'

import { exec, shx } from '../../lib/utils.js'
import Utils from '../utils.js'

export default class ChromiumOS {
  /**
   * Calamares is generally not available on ChromiumOS.
   * krill is the recommended installer.
   */
  static async calamaresInstall(verbose = true): Promise<void> {
    const echo = Utils.setEcho(verbose)

    // Try Portage first (Gentoo Prefix or cros_sdk)
    if (Utils.commandExists('emerge')) {
      try {
        await exec('emerge --ask=n calamares', echo)
        return
      } catch {
        // fall through
      }
    }

    // Try Chromebrew
    if (Utils.commandExists('crew')) {
      try {
        await exec('crew install calamares', echo)
        return
      } catch {
        // fall through
      }
    }

    Utils.error('Cannot install calamares on ChromiumOS. Use krill (TUI) installer instead.')
  }

  /**
   * calamaresPolicies
   */
  static async calamaresPolicies(verbose = false) {
    // no special policies needed
  }

  /**
   * calamaresRemove
   */
  static async calamaresRemove(verbose = true): Promise<boolean> {
    const echo = Utils.setEcho(verbose)
    let success = false

    if (Utils.commandExists('emerge')) {
      try {
        await exec('emerge --unmerge calamares', echo)
        success = true
      } catch {
        Utils.error('Cannot remove calamares via emerge')
      }
    } else if (Utils.commandExists('crew')) {
      try {
        await exec('crew remove calamares', echo)
        success = true
      } catch {
        Utils.error('Cannot remove calamares via crew')
      }
    }

    if (success && fs.existsSync('/etc/calamares')) {
      await exec('rm /etc/calamares -rf', echo)
    }

    return success
  }

  /**
   * Check if wayland is installed
   */
  static isInstalledWayland(): boolean {
    return this.packageIsInstalled('xwayland')
  }

  /**
   * Check if xorg is installed
   */
  static isInstalledXorg(): boolean {
    return this.packageIsInstalled('xorg-server')
  }

  /**
   * Check if a package is available for installation.
   * Checks Portage first, then Chromebrew.
   */
  static async packageAvailable(packageName: string): Promise<boolean> {
    // Portage: equery
    if (Utils.commandExists('equery')) {
      const cmd = `equery list -po ${packageName}`
      const result = shx.exec(cmd, { silent: true })
      if (result.code === 0 && result.stdout.trim() !== '') {
        return true
      }
    }

    // Portage: eix (faster if available)
    if (Utils.commandExists('eix')) {
      const cmd = `eix -e ${packageName}`
      const result = shx.exec(cmd, { silent: true })
      if (result.code === 0) {
        return true
      }
    }

    // Chromebrew
    if (Utils.commandExists('crew')) {
      const cmd = `crew search ${packageName}`
      const result = shx.exec(cmd, { silent: true })
      if (result.code === 0 && result.stdout.includes(packageName)) {
        return true
      }
    }

    return false
  }

  /**
   * Install a package.
   * Tries Portage (emerge) first, then Chromebrew (crew).
   */
  static async packageInstall(packageName: string): Promise<boolean> {
    if (Utils.commandExists('emerge')) {
      if (shx.exec(`emerge --ask=n ${packageName}`, { silent: false }).code === 0) {
        return true
      }
    }

    if (Utils.commandExists('crew')) {
      if (shx.exec(`crew install ${packageName}`, { silent: false }).code === 0) {
        return true
      }
    }

    return false
  }

  /**
   * Check if a package is installed.
   * Uses equery, /var/db/pkg filesystem, or Chromebrew.
   */
  static packageIsInstalled(packageName: string): boolean {
    // Method 1: equery (gentoolkit)
    if (Utils.commandExists('equery')) {
      const cmd = `equery -q list ${packageName}`
      const result = shx.exec(cmd, { silent: true })
      if (result.code === 0 && result.stdout.trim() !== '') {
        return true
      }
    }

    // Method 2: /var/db/pkg filesystem (works without gentoolkit)
    if (fs.existsSync('/var/db/pkg')) {
      const categories = fs.readdirSync('/var/db/pkg')
      for (const cat of categories) {
        const catPath = path.join('/var/db/pkg', cat)
        if (fs.statSync(catPath).isDirectory()) {
          const pkgs = fs.readdirSync(catPath)
          for (const pkg of pkgs) {
            // Package dirs are named category/name-version
            // Strip version: match if pkg starts with packageName
            const pkgName = pkg.replace(/-\d.*$/, '')
            if (pkgName === packageName) {
              return true
            }
          }
        }
      }
    }

    // Method 3: Chromebrew
    if (Utils.commandExists('crew')) {
      const cmd = `crew list installed | grep -q "^${packageName}$"`
      if (shx.exec(cmd, { silent: true }).code === 0) {
        return true
      }
    }

    return false
  }

  /**
   * Detect which ChromiumOS variant is running.
   * Returns a string identifier for the derivative.
   */
  static detectVariant(): string {
    const osRelease = '/etc/os-release'
    if (!fs.existsSync(osRelease)) {
      return 'chromiumos'
    }

    const content = fs.readFileSync(osRelease, 'utf8').toLowerCase()

    if (content.includes('fydeos') || content.includes('openfyde')) return 'fydeos'
    if (content.includes('thoriumos')) return 'thoriumos'
    if (content.includes('wayne')) return 'wayneos'
    if (content.includes('brunch')) return 'brunch'
    if (content.includes('chromeos') || content.includes('chrome os')) return 'chromeos'

    return 'chromiumos'
  }

  /**
   * Check if running inside the cros_sdk chroot.
   */
  static isCrosSdk(): boolean {
    return fs.existsSync('/etc/cros_chroot_version')
  }

  /**
   * Check if a Gentoo Prefix is available (sebanc/chromeos-gentoo-prefix).
   */
  static hasGentooPrefix(): boolean {
    return fs.existsSync('/usr/local/etc/portage') || fs.existsSync('/usr/local/portage')
  }

  /**
   * Check if Chromebrew is installed.
   */
  static hasChromebrew(): boolean {
    return Utils.commandExists('crew')
  }
}
