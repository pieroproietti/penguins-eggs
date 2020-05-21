/**
 * xdg-utils
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import shx = require('shelljs')
import fs = require('fs')
import os = require('os')
import Pacman from './pacman'
import Utils from './utils'

// libraries
const exec = require('../lib/utils').exec

/**
 * Xdg: xdg-user-dirs, etc
 * @remarks all the utilities
 */
export default class Xdg {
    /**
     * 
     * @param user 
     * @param chroot 
     * @param verbose 
     */
    static async create(user: string, chroot: string, verbose = false) {
        let echo = Utils.setEcho(verbose)


        // DESKTOP=Desktop
        let pathPromise = await this.path(user, chroot, 'DESKTOP', verbose)
        Xdg.mk(chroot, pathPromise)

        // DOWNLOAD=Downloads
        pathPromise = await this.path(user, chroot, 'DOWNLOAD', verbose)
        Xdg.mk(chroot, pathPromise)

        // TEMPLATES=Templates
        pathPromise = await this.path(user, chroot, 'TEMPLATES', verbose)
        Xdg.mk(chroot, pathPromise)

        // PUBLICSHARE=Public
        pathPromise = await this.path(user, chroot, 'PUBLICSHARE', verbose)
        Xdg.mk(chroot, pathPromise)

        // DOCUMENTS=Documents
        pathPromise = await this.path(user, chroot, 'DOCUMENTS', verbose)
        Xdg.mk(chroot, pathPromise)

        // MUSIC=Music
        pathPromise = await this.path(user, chroot, 'MUSIC', verbose)
        Xdg.mk(chroot, pathPromise)

        // PICTURES=Pictures
        pathPromise = await this.path(user, chroot, 'PICTURES', verbose)
        Xdg.mk(chroot, pathPromise)

        // VIDEOS=Videos
        pathPromise = await this.path(user, chroot, 'VIDEOS', verbose)
        Xdg.mk(chroot, pathPromise)
    }

    /**
     * 
     * @param chroot 
     * @param pathPromise 
     */
    static async mk(chroot: string, pathPromise: string, verbose = false) {
        let echo = Utils.setEcho(verbose)
        console.log(chroot + pathPromise)        
        if (!fs.existsSync(chroot + pathPromise)) {
            await exec(`mkdir ${chroot}${pathPromise}`, echo)
        }
    }
    /**
     * 
     * @param user 
     * @param chroot 
     * @param type 
     * @param verbose 
     */
    static async  path(user: string, chroot = '/', type = 'DESKTOP', verbose = false): Promise<string> {

        const pathPromise = await exec(`chroot ${chroot} sudo -u ${user} xdg-user-dir ${type}`, { echo: verbose, ignore: false, capture: true })
        const pathTo = pathPromise.data.trim() // /home/live/Scrivania
        return pathTo
    }

    /**
     * 
     * @param olduser 
     * @param newuser 
     * @param chroot 
     */
    static async autologin(olduser: string, newuser: string, chroot = '/') {
        if (Pacman.packageIsInstalled('lightdm')) {
            shx.sed('-i', `autologin-user=${olduser}`, `autologin-user=${newuser}`, `${chroot}/etc/lightdm/lightdm.conf`)
        }
    }


}