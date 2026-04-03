/**
 * ./src/classes/pacman.d/chromiumos.ts
 * penguins-eggs / ecmascript 2020
 * author: Piero Proietti (original), unified-image-server contributors
 * license: MIT
 *
 * ChromiumOS family package manager backend.
 *
 * ChromiumOS is Gentoo-derived. Package management uses:
 *   1. emerge (Portage) — available in stage3 containers and cros_sdk chroots
 *   2. /var/db/pkg filesystem — native Portage package database
 *   3. crew (Chromebrew) — secondary package manager on runtime ChromeOS/ChromiumOS
 *
 * Stage3 awareness:
 *   Containers built from the chromiumos-stage3 component of this project
 *   include a full Portage tree and toolchain. They are detected via
 *   isCrosSdk() or hasPortage(), and prefer emerge over crew.
 *
 * Board awareness:
 *   openFyde hardware boards (rpi4-openfyde, rock5b-openfyde, etc.) are
 *   detected via detectBoard() and may have board-specific package atoms.
 *
 * Architecture support:
 *   Package management (emerge/crew) is arch-agnostic — Portage and Chromebrew
 *   handle arch internally. The EFI boot pipeline in make-efi.ts handles all
 *   four arches: amd64 (x64), arm64, i386 (ia32), riscv64.
 *
 *   riscv64 note: no shim is available for RISC-V; GRUB is used directly as
 *   the boot EFI binary (bootriscv64.efi). This is handled generically by
 *   make-efi.ts and requires no ChromiumOS-specific code.
 *
 *   initrd: ChromiumOS stage3 includes dracut. The initrdDracut builder
 *   (used by Fedora/Gentoo/openSUSE) is the correct builder for this family.
 *   See diversions.ts kernelParameters() for the ChromiumOS-specific
 *   kernel cmdline (adds cros_debug to the standard dracut live boot params).
 *
 * Calamares is not available in standard ChromiumOS builds.
 * krill (TUI installer) is the primary installer for this family.
 */

import fs from 'node:fs'
import path from 'node:path'
import { exec, shx } from '../../lib/utils.js'
import Utils from '../utils.js'

export default class ChromiumOS {
  /**
   * Calamares is not available on ChromiumOS.
   * Attempts emerge (stage3/cros_sdk) then crew, falls back to krill advisory.
   */
  static async calamaresInstall(verbose = true): Promise<void> {
    const echo = Utils.setEcho(verbose)

    if (Utils.commandExists('emerge')) {
      try {
        await exec('emerge --ask=n app-misc/calamares', echo)
        return
      } catch {
        // fall through to crew
      }
    }

    if (Utils.commandExists('crew')) {
      try {
        await exec('crew install calamares', echo)
        return
      } catch {
        // fall through to advisory
      }
    }

    Utils.error(
      'Cannot install calamares on ChromiumOS. Use krill (TUI) installer instead.\n' +
      'In a stage3 container, calamares may be available via emerge if an overlay provides it.'
    )
  }

  static async calamaresPolicies(_verbose = false): Promise<void> {
    // No special policies needed on ChromiumOS
  }

  static async calamaresRemove(verbose = true): Promise<boolean> {
    const echo = Utils.setEcho(verbose)
    let success = false

    if (Utils.commandExists('emerge')) {
      try {
        await exec('emerge --unmerge app-misc/calamares', echo)
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

  static isInstalledWayland(): boolean {
    return this.packageIsInstalled('xwayland')
  }

  static isInstalledXorg(): boolean {
    return this.packageIsInstalled('xorg-server')
  }

  /**
   * Check if a package is available for installation.
   * Checks Portage (equery/eix) first, then Chromebrew.
   */
  static async packageAvailable(packageName: string): Promise<boolean> {
    // Portage: equery
    if (Utils.commandExists('equery')) {
      const result = shx.exec(`equery list -po ${packageName}`, { silent: true })
      if (result.code === 0 && result.stdout.trim() !== '') return true
    }

    // Portage: eix (faster when available)
    if (Utils.commandExists('eix')) {
      const result = shx.exec(`eix -e ${packageName}`, { silent: true })
      if (result.code === 0) return true
    }

    // Chromebrew
    if (Utils.commandExists('crew')) {
      const result = shx.exec(`crew search ${packageName}`, { silent: true })
      if (result.code === 0 && result.stdout.includes(packageName)) return true
    }

    return false
  }

  /**
   * Install a package.
   * Prefers emerge in stage3/cros_sdk environments, falls back to crew.
   */
  static async packageInstall(packageName: string): Promise<boolean> {
    // In stage3 containers, always prefer emerge
    if (this.hasPortage()) {
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
   *
   * Detection order:
   *   1. equery (gentoolkit) — most reliable
   *   2. /var/db/pkg filesystem — works without gentoolkit
   *   3. crew list installed — Chromebrew fallback
   */
  static packageIsInstalled(packageName: string): boolean {
    // Method 1: equery
    if (Utils.commandExists('equery')) {
      const result = shx.exec(`equery -q list ${packageName}`, { silent: true })
      if (result.code === 0 && result.stdout.trim() !== '') return true
    }

    // Method 2: /var/db/pkg filesystem
    if (fs.existsSync('/var/db/pkg')) {
      if (this.findInVarDbPkg(packageName)) return true
    }

    // Method 3: Chromebrew
    if (Utils.commandExists('crew')) {
      const result = shx.exec(
        `crew list installed | grep -q "^${packageName}$"`,
        { silent: true }
      )
      if (result.code === 0) return true
    }

    return false
  }

  // ── Boot / initrd ─────────────────────────────────────────────────────────

  /**
   * Returns the initrd builder to use for this family.
   *
   * ChromiumOS stage3 containers include dracut (emerged as part of the base
   * package set). The dracut builder is used by Fedora, Gentoo, and openSUSE
   * and is the correct choice here.
   *
   * This method exists to make the selection explicit and testable rather than
   * relying on a fallthrough in the familyId switch in produce.ts.
   *
   * Kernel parameters (from diversions.ts kernelParameters()):
   *   root=live:CDLABEL=<volid> rd.live.image rd.live.dir=/live
   *   rd.live.squashimg=filesystem.squashfs cros_debug
   */
  static initrdBuilder(): 'dracut' {
    return 'dracut'
  }

  /**
   * Returns the EFI boot binary name for the current architecture.
   * Mirrors the logic in make-efi.ts bootEfiName() for documentation purposes.
   *
   * amd64  → bootx64.efi    (with shimx64.efi)
   * arm64  → bootaa64.efi   (with shimaa64.efi)
   * i386   → bootia32.efi   (with shimia32.efi)
   * riscv64 → bootriscv64.efi (no shim — GRUB used directly)
   */
  static efiBootBinary(): string {
    switch (process.arch) {
      case 'x64':     return 'bootx64.efi'
      case 'arm64':   return 'bootaa64.efi'
      case 'ia32':    return 'bootia32.efi'
      case 'riscv64': return 'bootriscv64.efi'
      default:        return 'bootx64.efi'
    }
  }

  // ── Environment detection ──────────────────────────────────────────────────

  /**
   * Detect which ChromiumOS variant is running.
   * Returns a string identifier matching derivatives_chromiumos.yaml entries.
   */
  static detectVariant(): string {
    // Check /etc/lsb-release first — ChromiumOS sets CHROMEOS_RELEASE_NAME here
    if (fs.existsSync('/etc/lsb-release')) {
      const lsb = fs.readFileSync('/etc/lsb-release', 'utf8')
      if (lsb.includes('CHROMEOS_RELEASE_NAME=FydeOS') ||
          lsb.includes('CHROMEOS_RELEASE_NAME=openFyde')) return 'openfyde'
      if (lsb.includes('CHROMEOS_RELEASE_NAME=Thorium')) return 'thoriumos'
      if (lsb.includes('CHROMEOS_RELEASE_NAME=Wayne')) return 'wayneos'
      if (lsb.includes('CHROMEOS_RELEASE_NAME=Brunch')) return 'brunch'
      if (lsb.includes('CHROMEOS_RELEASE')) return 'chromiumos'
    }

    if (!fs.existsSync('/etc/os-release')) return 'chromiumos'

    const content = fs.readFileSync('/etc/os-release', 'utf8').toLowerCase()
    if (content.includes('fydeos') || content.includes('openfyde')) return 'openfyde'
    if (content.includes('thorium')) return 'thoriumos'
    if (content.includes('wayne')) return 'wayneos'
    if (content.includes('brunch')) return 'brunch'
    if (content.includes('stage3')) return 'chromiumos-stage3'
    if (content.includes('chromeos') || content.includes('chrome os')) return 'chromeos'

    return 'chromiumos'
  }

  /**
   * Detect the openFyde board name, if running on a hardware-specific board.
   * Returns the board name (e.g. 'rpi4-openfyde') or null.
   */
  static detectBoard(): string | null {
    // openFyde boards set CHROMEOS_RELEASE_BOARD in /etc/lsb-release
    if (fs.existsSync('/etc/lsb-release')) {
      const lsb = fs.readFileSync('/etc/lsb-release', 'utf8')
      const match = lsb.match(/CHROMEOS_RELEASE_BOARD=(.+)/)
      if (match) return match[1].trim()
    }

    // stage3 containers set BOARD in /etc/chromiumos-stage3-board (written by build.sh)
    if (fs.existsSync('/etc/chromiumos-stage3-board')) {
      return fs.readFileSync('/etc/chromiumos-stage3-board', 'utf8').trim()
    }

    return null
  }

  /**
   * Returns true if running inside the cros_sdk chroot.
   */
  static isCrosSdk(): boolean {
    return fs.existsSync('/etc/cros_chroot_version')
  }

  /**
   * Returns true if a full Portage tree is available.
   * True in stage3 containers and cros_sdk chroots.
   */
  static hasPortage(): boolean {
    return (
      Utils.commandExists('emerge') &&
      (fs.existsSync('/var/db/repos/gentoo') ||
        fs.existsSync('/mnt/host/source/src/third_party/chromiumos-overlay') ||
        fs.existsSync('/build'))
    )
  }

  /**
   * Returns true if a Gentoo Prefix is available (sebanc/chromeos-gentoo-prefix).
   */
  static hasGentooPrefix(): boolean {
    return (
      fs.existsSync('/usr/local/etc/portage') ||
      fs.existsSync('/usr/local/portage')
    )
  }

  /**
   * Returns true if Chromebrew is installed.
   */
  static hasChromebrew(): boolean {
    return Utils.commandExists('crew')
  }

  /**
   * Returns a summary of the available package management capabilities.
   * Useful for diagnostics and installer selection.
   */
  static capabilities(): {
    portage: boolean
    chromebrew: boolean
    gentooPrefix: boolean
    crosSdk: boolean
    board: string | null
    variant: string
  } {
    return {
      portage: this.hasPortage(),
      chromebrew: this.hasChromebrew(),
      gentooPrefix: this.hasGentooPrefix(),
      crosSdk: this.isCrosSdk(),
      board: this.detectBoard(),
      variant: this.detectVariant(),
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Search /var/db/pkg for a package by name or full atom (category/name).
   */
  private static findInVarDbPkg(packageName: string): boolean {
    const dbPath = '/var/db/pkg'

    if (packageName.includes('/')) {
      // Full atom: category/name — check /var/db/pkg/<category>/<name>-*
      const [category, name] = packageName.split('/')
      const catPath = path.join(dbPath, category)
      if (!fs.existsSync(catPath)) return false
      return fs.readdirSync(catPath).some(
        (entry) => entry === name || entry.startsWith(name + '-')
      )
    }

    // Bare name — search all categories
    try {
      const categories = fs.readdirSync(dbPath)
      for (const cat of categories) {
        const catPath = path.join(dbPath, cat)
        try {
          if (
            fs.statSync(catPath).isDirectory() &&
            fs.readdirSync(catPath).some(
              (entry) => entry === packageName || entry.startsWith(packageName + '-')
            )
          ) {
            return true
          }
        } catch {
          // skip unreadable directories
        }
      }
    } catch {
      // /var/db/pkg not readable
    }

    return false
  }
}
