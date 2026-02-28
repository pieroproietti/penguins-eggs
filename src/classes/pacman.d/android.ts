/**
 * ./src/classes/pacman.d/android.ts
 * penguins-eggs
 * author: Piero Proietti / Android backend
 * license: MIT
 *
 * Package management adapter for Android/AOSP systems.
 * Android doesn't use apt/pacman/dnf — packages are APKs managed
 * via `pm` (package manager) or direct filesystem manipulation.
 */

import fs from 'node:fs'

import { exec, shx } from '../../lib/utils.js'
import Utils from '../utils.js'

export default class Android {
  /**
   * Calamares is not available on Android — use Krill only
   */
  static async calamaresInstall(verbose = true): Promise<void> {
    Utils.warning('Calamares is not supported on Android. Use krill installer instead.')
  }

  /**
   * No-op: no Calamares policies on Android
   */
  static async calamaresPolicies(verbose = false) {
    // no-op
  }

  /**
   * No-op: no Calamares to remove on Android
   */
  static async calamaresRemove(verbose = true): Promise<boolean> {
    return false
  }

  /**
   * Android: check if Wayland compositor is available
   * (SurfaceFlinger is Android's compositor, not Wayland)
   */
  static isInstalledWayland(): boolean {
    return false
  }

  /**
   * Android: check if Xorg is available
   * Some Android-x86 builds include Xorg for windowed mode
   */
  static isInstalledXorg(): boolean {
    return fs.existsSync('/system/bin/Xorg') || fs.existsSync('/usr/bin/Xorg')
  }

  /**
   * No-op: no polkit on Android
   */
  static async liveInstallerPolicies() {
    // no-op
  }

  /**
   * List installed Android packages via `pm list packages`
   * Falls back to scanning /system/app and /data/app directories
   */
  static listInstalledPackages(): string[] {
    // Try pm command first (works in running Android environment)
    const pmResult = shx.exec('pm list packages 2>/dev/null', { silent: true })
    if (pmResult.code === 0 && pmResult.stdout.trim()) {
      return pmResult.stdout
        .trim()
        .split('\n')
        .map((line: string) => line.replace('package:', '').trim())
        .filter(Boolean)
    }

    // Fallback: scan filesystem
    const packages: string[] = []
    const appDirs = ['/system/app', '/system/priv-app', '/data/app', '/product/app']

    for (const dir of appDirs) {
      if (fs.existsSync(dir)) {
        try {
          const entries = fs.readdirSync(dir)
          for (const entry of entries) {
            packages.push(entry)
          }
        } catch {
          // permission denied
        }
      }
    }

    return packages
  }

  /**
   * Android: install an APK package
   * Uses `pm install` in a running Android environment
   */
  static async packageInstall(packageName: string): Promise<boolean> {
    // If it's an APK file path
    if (packageName.endsWith('.apk') && fs.existsSync(packageName)) {
      const result = shx.exec(`pm install ${packageName}`, { silent: true })
      return result.code === 0
    }

    Utils.warning(`Cannot install '${packageName}' — provide an APK file path`)
    return false
  }

  /**
   * Android: check if a package is installed
   * Checks via `pm list packages` or filesystem presence
   */
  static packageIsInstalled(packageName: string): boolean {
    // Try pm command
    const pmResult = shx.exec(`pm list packages ${packageName} 2>/dev/null`, { silent: true })
    if (pmResult.code === 0 && pmResult.stdout.includes(`package:${packageName}`)) {
      return true
    }

    // Fallback: check common binary/lib locations
    const paths = [
      `/system/app/${packageName}`,
      `/system/priv-app/${packageName}`,
      `/system/bin/${packageName}`,
      `/system/xbin/${packageName}`,
    ]

    return paths.some((p) => fs.existsSync(p))
  }
}
