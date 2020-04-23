/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs = require('fs')
import path = require('path')
import shx = require('shelljs')

import Utils from './utils'

const exec = require('../lib/utils').exec

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Pacman {
  static debs4eggs = ['isolinux', 'live-boot', 'live-boot-initramfs-tools', 'live-config-systemd', 'squashfs-tools', 'xorriso', 'xterm', 'whois']
  static debs4calamares = ['calamares', 'qml-module-qtquick2', 'qml-module-qtquick-controls']


  static packageIsInstalled(debPackage: string): boolean {
    let isInstalled = false
    const cmd = `/usr/bin/dpkg -s ${debPackage} | grep Status`
    const stdout = shx.exec(cmd, { silent: true }).stdout.trim()

    if (stdout === 'Status: install ok installed') {
      isInstalled = true
    }
    return isInstalled
  }

  /**
     * Install the package debPackage
     * @param debPackage {string} Pacchetto Debian da installare
     * @returns {boolean} True if success
     */
  static packageInstall(debPackage: string): boolean {
    let retVal = false

    if (shx.exec('/usr/bin/apt-get update', { silent: true }) === '0') {
      if (shx.exec(`/usr/bin/apt-get install -y ${debPackage}`, { silent: true }) === '0') {
        retVal = true
      }
    }
    return retVal
  }


  /**
   * 
   * @param packages array packages
   */
  static debs2line(packages: string[]): string {
    let line = ''
    for (let i in packages) {
      line += packages[i] + ' '
    }
    return line
  }

  /**
   * 
   */
  static async prerequisitesEggsCheck(): Promise<boolean> {
    let retVal = true

    for (let i in this.debs4eggs) {
      if (!Utils.packageIsInstalled(this.debs4eggs[i])) {
        retVal = false
        break
      }
    }
    return retVal
  }

  /**
   * 
   */
  static async prerequisitesEggsInstall(verbose = true): Promise<boolean> {
    let echo = Utils.setEcho(verbose)
    let retVal = false

    await exec('apt-get update --yes')
    await exec(`apt-get install --yes ${Pacman.debs2line(Pacman.debs4eggs)}`, echo)
    return retVal
  }

  /**
   * 
   */
  static async prerequisitesEggsRemove(verbose = true): Promise<boolean> {
    let echo = Utils.setEcho(verbose)
    let retVal = false
    await exec(`apt-get remove --purge --yes ${Pacman.debs2line(Pacman.debs4eggs)}`, echo)
    await exec('apt-get autoremove --yes')
    return retVal
  }


  /**
   * 
   */
  static async prerequisitesCalamaresCheck(): Promise<boolean> {
    let retVal = true
    for (let i in this.debs4calamares) {
      if (Utils.packageIsInstalled(this.debs4calamares[i])) {
        retVal = false
        break
      }
    }
    return retVal
  }

  /**
 * 
 */
  static async prerequisitesCalamaresInstall(verbose = true): Promise<boolean> {
    let echo = Utils.setEcho(verbose)
    let retVal = false
    await exec('apt-get update --yes', echo)
    await exec(`apt-get install --yes ${Pacman.debs2line(Pacman.debs4calamares)}`, echo)
    return retVal
  }

  /**
  * 
  */
  static async prerequisitesCalamaresRemove(verbose = true): Promise<boolean> {
    let echo = Utils.setEcho(verbose)

    let retVal = false
    await exec('rm /etc/calamares -rf', echo)
    await exec(`apt-get install --yes ${Pacman.debs2line(Pacman.debs4calamares)}`, echo)
    await exec('apt-get autoremove --yes', echo)
    return retVal
  }

  /**
   * 
   */
  static async configurationCheck(): Promise<boolean> {
    return fs.existsSync('/etc/penguins-eggs.conf') && (fs.existsSync('/usr/local/share/excludes/penguins-eggs-exclude.list'))
  }

  /**
   * 
   */
  static async configurationInstall(): Promise<void> {
    shx.cp(path.resolve(__dirname, '../../conf/penguins-eggs.conf'), '/etc')
    shx.mkdir('-p', '/usr/local/share/excludes/')
    shx.cp(path.resolve(__dirname, '../../conf/penguins-eggs-exclude.list'), '/usr/local/share/excludes')
  }

  /**
   * 
   */
  static async clean(verbose = true): Promise<void> {
    let echo = Utils.setEcho(verbose)
    await exec('apt-get clean', echo)
    await exec('apt-get autoclean', echo)
  }
}
