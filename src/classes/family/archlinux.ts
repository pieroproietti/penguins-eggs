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
import Pacman from '../pacman'
const exec = require('../../lib/utils').exec

const config_file = '/etc/penguins-eggs.d/eggs.yaml' as string
const config_tools = '/etc/penguins-eggs.d/tools.yaml' as string

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Archlinux {
    static debs4calamares = ['calamares']
    // Dipendenze pacman -Qi calamares
    // kconfig  kcoreaddons  kiconthemes  ki18n  kio solid  yaml-cpp  kpmcore>=4.2.0 mkinitcpio-openswap  
    // boost-libs  ckbcomp  hwinfo qt5-svg  polkit-qt5  gtk-update-icon-cache plasma-framework  
    // qt5-xmlpatterns  squashfs-tools libpwquality  appstream-qt  icu

    /**
     * check if it's installed xorg
     * @returns true if xorg is installed
     */
    static isInstalledXorg(): boolean {
        return this.packageIsInstalled('xorg-server-common')
    }

    /**
     * check if it's installed wayland
     * @returns true if wayland
     */
    static isInstalledWayland(): boolean {
        return this.packageIsInstalled('xwayland')
    }

    /**
     * Crea array pacchetti da installare/rimuovere
     */
    static packages(remove = false, verbose = false): string[] {
        let packages = [
            'arch-install-scripts',
            'awk', 
            'dosfstools',
            'e2fsprogs',
            'erofs-utils',
            'findutils',
            'gzip',
            'libarchive',
            'libisoburn',
            'mtools',
            'openssl',
            'pacman',
            'sed',
            'squashfs-tools',
        ]

        let packagesInstall: string[] = []
        let packagesRemove: string[] = []

        packages.forEach((elem) => {
            if (!this.packageIsInstalled(elem)) {
                packagesInstall.push(elem)
            } else {
                packagesRemove.push(elem)
            }
        })

        if (remove) {
            return packagesRemove
        } else {
            return packagesInstall
        }
    }

    /**
     *
     */
    static async prerequisitesInstall(verbose = true): Promise<boolean> {
        const echo = Utils.setEcho(verbose)
        const retVal = false

        await exec(`pacman -S --yes ${array2spaced(this.packages(false, verbose))}`, echo)

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
            await exec('pacman -Sy', echo)
        } catch (e) {
            Utils.error('Archlinux.calamaresInstall() apt-get update --yes ') // + e.error as string)
        }
        try {
            await exec(`pacman -Sy ${array2spaced(this.debs4calamares)}`, echo)
        } catch (e) {
            Utils.error(`Archlinux.calamaresInstall() apt-get install --yes ${array2spaced(this.debs4calamares)}`) // + e.error)
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
        await exec(`yay -Rns calamares`, echo)
        return retVal
    }


    /**
    * restuisce VERO se il pacchetto è installato
    * @param packageName
    */
    static packageIsInstalled(packageName: string): boolean {

        let installed = false
        const cmd = `/usr/bin/pacman -Qi ${packageName} | grep Status:`
        const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
        if (stdout.includes(packageName) {
            installed = true
        }
        return installed
    }

    /**
     * Install the package packageName
     * @param packageName {string} Pacchetto Debian da installare
     * @returns {boolean} True if success
     */
    static async packageInstall(packageName: string): Promise<boolean> {
        let retVal = false
        if (shx.exec(`/usr/bin/pacman -Si ${packageName}`, { silent: true }) === '0') {
            retVal = true
        }
        return retVal
    }


    /**
    * restuisce VERO se il pacchetto è installato
    * @param packageName
    */
    static async packageAptAvailable(packageName: string): Promise<boolean> {
        let available = false
        const cmd = `/usr/bin/pacman -Q ${packageName} | grep Package:`
        const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
        if (stdout.includes(packageName)) {
            available = true
        }
        return available
    }

    /**
     * 
     * @param packageName 
     * @returns 
     */
    static async packageAptLast(packageName: string): Promise<string> {
        let version = ''
        const cmd = `/usr/bin/pacman -Q ${packageName} | grep Version:`
        const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
        version = stdout.substring(9)
        // console.log('===================================')
        // console.log('[' + version + ']')
        // console.log('===================================')
        return version
    }

}
