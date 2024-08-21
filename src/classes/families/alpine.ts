/**
 * ./src/classes/families/alpine.ts
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
 * Alpine
 * @remarks all the utilities
 */
export default class Alpine {
  static packs4calamares = [
    'calamares',
    'calamares-doc',
    'calamares-extensions',
    'calamares-lang',
    'calamares-mod-bootloader',
    'calamares-mod-displaymanager',
    'calamares-mod-finished',
    'calamares-mod-fsresizer',
    'calamares-mod-fstab',
    'calamares-mod-grubcfg',
    'calamares-mod-hostinfo',
    'calamares-mod-hwclock',
    'calamares-mod-interactiveterminal',
    'calamares-mod-keyboard',
    'calamares-mod-keyboardq',
    'calamares-mod-locale',
    'calamares-mod-localeq',
    'calamares-mod-luksbootkeyfile',
    'calamares-mod-luksopenswaphookcfg',
    'calamares-mod-machineid',
    'calamares-mod-mkinitfs',
    'calamares-mod-mount',
    'calamares-mod-networkcfg',
    'calamares-mod-packages',
    'calamares-mod-partition',
    'calamares-mod-plasmalnf',
    'calamares-mod-plymouthcfg',
    'calamares-mod-removeuser',
    'calamares-mod-services-openrc',
    'calamares-mod-shellprocess',
    'calamares-mod-summary',
    'calamares-mod-umount',
    'calamares-mod-unpackfs',
    'calamares-mod-users',
    'calamares-mod-webview',
    'calamares-mod-welcome',
    'calamares-mod-welcomeq'
  ]

  /**
   * Alpine: calamaresInstall
   */
  static async calamaresInstall(verbose = false): Promise<void> {
    const echo = Utils.setEcho(true)
    try {
      const cmd = 'apk update'
      await exec(cmd, echo)
    } catch {
      Utils.error(`Alpine.calamaresInstall(): apk update `)
    }
    const cmd = `apk add ${this.packs4calamares.join(' ')}`
    try {
      await exec(cmd, echo)
    } catch {
      Utils.error(`Alpine.calamaresInstall(): apk add calamares ... )`)
    }
  }

  /**
   * Alpine: calamaresPolicies
   */
  static async calamaresPolicies() {
    const policyFile = '/usr/share/polkit-1/actions/com.github.calamares.calamares.policy'
    await exec(`sed -i 's/auth_admin/yes/' ${policyFile}`)
  }

  /**
   * Alpine: calamaresRemove
   */
  static async calamaresRemove(verbose = true): Promise<boolean> {
    verbose = true // serve per pacman

    const removed = true
    const echo = Utils.setEcho(verbose)

    await exec(`apk del ${this.packs4calamares}`)
    await exec('rm /etc/calamares -rf', echo)

    return removed
  }

  /**
   * Alpine: isInstalledWayland
   * @returns true if wayland is installed
   */
  static isInstalledWayland(): boolean {
    return this.packageIsInstalled('xwayland')
  }

  /**
   * Alpine: isInstalledXorg
   * @returns true if xorg is installed
   */
  static isInstalledXorg(): boolean {
    return this.packageIsInstalled('xorg-server-common')
  }

  /**
   * Alpine: packageInstall
   * Install the package packageName
   * @param packageName {string} Pacchetto Debian da installare
   * @returns {boolean} True if success
   */
  static async packageInstall(packageName: string): Promise<boolean> {
    let retVal = false
    if (shx.exec(`/sbin/apk add ${packageName}`, { silent: true }) === '0') {
      retVal = true
    }

    return retVal
  }

  /**
   * Alpine: packageIsInstalled OK
   * restuisce VERO se il pacchetto è installato
   * @param packageName
   */
  static packageIsInstalled(packageName: string): boolean {
    let installed = false
    const cmd = `/sbin/apk info -e ${packageName}`
    const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
    if (stdout.includes(packageName)) {
      installed = true
    }

    return installed
  }

  /**
   * Alpine: packagePacmanAvailable
   * restuisce VERO se il pacchetto è installato
   * @param packageName
   */
  static async packagePacmanAvailable(packageName: string): Promise<boolean> {
    let available = false
    const cmd = `/sbin/apk search ${packageName} | awk '{ print $1 }'`
    const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
    if (stdout == packageName) {
      available = true
    }

    return available
  }

}
