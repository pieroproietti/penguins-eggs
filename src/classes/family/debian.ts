/**
 * penguins-eggs-v8
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { array2spaced, depCommon, depArch, depVersions, depInit } from '../../lib/dependencies'

import fs = require('fs')
import os = require('os')
import path = require('path')
import shx = require('shelljs')
import { IRemix, IDistro } from '../../interfaces'

import Utils from '../utils'
import Distro from '../distro'
import Settings from '../settings'
import { execSync } from 'child_process'
import { IConfig } from '../../interfaces'
const exec = require('../../lib/utils').exec

import Pacman from '../pacman'

const config_file = '/etc/penguins-eggs.d/eggs.yaml' as string
const config_tools = '/etc/penguins-eggs.d/tools.yaml' as string

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Debian {
    static debs4calamares = ['calamares', 'qml-module-qtquick2', 'qml-module-qtquick-controls']

    distro = {} as IDistro

    remix = {} as IRemix

    /**
     * 
     * @returns 
     */
    static distro(): IDistro {
        const remix = {} as IRemix
        const distro = new Distro(remix)
        return distro
    }

    /**
     * check if it's installed xorg
     * @returns true if xorg is installed
     */
    static isInstalledXorg(): boolean {
        return this.packageIsInstalled('xserver-xorg-core')
    }

    /**
     * check if it's installed wayland
     * @returns true if wayland
     */
    static isInstalledWayland(): boolean {
        return this.packageIsInstalled('xwayland')
    }

    /**
     * Crea array packages dei pacchetti da installare
     */
    static packages(remove = false, verbose = false): string[] {
        let packages: string[] = []
        const packagesInstall: string[] = []
        const packagesRemove: string[] = []

        if (!Utils.isDebPackage()) {
            depCommon.forEach((elem) => {
                if (!this.packageIsInstalled(elem)) {
                    packagesInstall.push(elem)
                } else {
                    packagesRemove.push(elem)
                }
            })

            const arch = Utils.machineArch()
            depArch.forEach((dep) => {
                if (dep.arch.includes(arch)) {
                    if (!this.packageIsInstalled(dep.package)) {
                        packagesInstall.push(dep.package)
                    } else {
                        packagesRemove.push(dep.package)
                    }
                }
            })
        }

        // Version e initType da controllare
        const version = this.distro().versionLike
        depVersions.forEach((dep) => {
            if (dep.versions.includes(version)) {
                if (!this.packageIsInstalled(dep.package)) {
                    packagesInstall.push(dep.package)
                } else {
                    packagesRemove.push(dep.package)
                }
            }
        })

        const initType: string = shx.exec('ps --no-headers -o comm 1', { silent: !verbose }).trim()
        depInit.forEach((dep) => {
            if (dep.init.includes(initType)) {
                if (!this.packageIsInstalled(dep.package)) {
                    packagesInstall.push(dep.package)
                } else {
                    packagesRemove.push(dep.package)
                }
            }
        })

        packages = packagesInstall
        if (remove) {
            packages = packagesRemove
        }
        return packages
    }

    /**
     *
     */
    static async prerequisitesInstall(verbose = true): Promise<boolean> {
        const echo = Utils.setEcho(verbose)
        const retVal = false
        const versionLike = this.distro().versionLike

        await exec(`apt-get install --yes ${array2spaced(this.packages(false, verbose))}`, echo)


        if (!Pacman.isInstalledGui()) {
            /**
             * live-config-getty-generator
             * 
             * Viene rimosso in naked, altrimenti non funziona il login
             * generando un errore getty. 
             * Sarebbe utile individuarne le ragioni, forse rompe anche sul desktop
             * non permettendo di cambiare terminale e loggarsi
             * 
             * A che serve? 
             */
            const fileToRemove = '/lib/systemd/system-generators/live-config-getty-generator'
            if (fs.existsSync(fileToRemove)) {
                await exec(`rm ${fileToRemove}`)
            }
        }
        return retVal
    }

    /**
     * Torna verso se calamares è installato
     */
    static async calamaresCheck(): Promise<boolean> {
        let installed = true
        for (const i in this.debs4calamares) {
            if (!this.packageIsInstalled(this.debs4calamares[i])) {
                installed = false
                break
            }
        }
        return installed
    }


    /**
     *
     */
    static async calamaresInstall(verbose = true): Promise<void> {
        const echo = Utils.setEcho(verbose)
        try {
            await exec('apt-get update --yes', echo)
        } catch (e) {
            Utils.error('Pacman.calamaresInstall() apt-get update --yes ') // + e.error as string)
        }
        try {
            await exec(`apt-get install --yes ${array2spaced(this.debs4calamares)}`, echo)
        } catch (e) {
            Utils.error(`Pacman.calamaresInstall() apt-get install --yes ${array2spaced(this.debs4calamares)}`) // + e.error)
        }

    }

    /**
    * calamaresPolicies
    */
    static async calamaresPolicies() {
        const policyFile = '/usr/share/polkit-1/actions/com.github.calamares.calamares.policy'
        await exec(`sed -i 's/auth_admin/yes/' ${policyFile}`)
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
        await exec(`apt-get remove --purge --yes calamares`, echo)
        await exec('apt-get autoremove --yes', echo)
        return retVal
    }


    /**
    * restuisce VERO se il pacchetto è installato
    * @param debPackage
    */
    static packageIsInstalled(debPackage: string): boolean {

        let installed = false
        if (this.distro().familyId === 'debian') {
            const cmd = `/usr/bin/dpkg -s ${debPackage} | grep Status:`
            const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
            if (stdout === 'Status: install ok installed') {
                installed = true
            }
        } else if (this.distro().familyId === 'fedora') {
            const cmd = `/usr/bin/dnf list installed ${debPackage}|grep ${debPackage}`
            const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
            if (stdout.includes(debPackage)) {
                installed = true
            }
        }
        return installed
    }


    /**
    * restuisce VERO se il pacchetto è installato
    * @param debPackage
    */
    static async packageAptAvailable(packageName: string): Promise<boolean> {
        let available = false
        if (this.distro().familyId === 'debian') {
            const cmd = `apt-cache show ${packageName} | grep Package:`
            const test = `Package: ${packageName}`
            const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
            if (stdout === test) {
                available = true
            }
        } else if (this.distro().familyId === 'fedora') {
            const cmd = `/usr/bin/dnf list available ${packageName}|grep ${packageName}`
            const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
            if (stdout.includes(packageName)) {
                available = true
            }
        }

        return available
    }


    static async packageAptLast(debPackage: string): Promise<string> {
        let version = ''
        const cmd = `apt-cache show ${debPackage} | grep Version:`
        const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
        version = stdout.substring(9)
        // console.log('===================================')
        // console.log('[' + version + ']')
        // console.log('===================================')
        return version
    }

    /**
     * Install the package packageName
     * @param packageName {string} Pacchetto Debian da installare
     * @returns {boolean} True if success
     */
    static async packageInstall(packageName: string): Promise<boolean> {
        let retVal = false

        if (this.distro().familyId === 'debian') {
            if (shx.exec(`/usr/bin/apt-get install -y ${packageName}`, { silent: true }) === '0') {
                retVal = true
            }
        } else if (this.distro().familyId === 'fedora') {
            if (shx.exec(`/usr/bin/dnf install joe - y ${packageName}`, { silent: true }) === '0') {
                retVal = true
            }
        }
        return retVal
    }
}
