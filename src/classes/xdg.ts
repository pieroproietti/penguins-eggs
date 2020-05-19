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

        if (verbose) {
          console.log('Xdg: create')
        }

        // DESKTOP=Desktop
        let pathPromise = await this.path(user, chroot, 'DESKTOP', verbose)
        await exec(`chroot ${chroot} mkdir ${pathPromise}`, echo)

        // DOWNLOAD=Downloads
        pathPromise = await this.path(user, chroot, 'DOWNLOAD', verbose)
        if (!fs.existsSync(chroot+pathPromise)){
            await exec(`chroot ${chroot} mkdir ${pathPromise}`, echo)
        }

        // TEMPLATES=Templates
        pathPromise = await this.path(user, chroot, 'TEMPLATES', verbose)
        if (!fs.existsSync(chroot+pathPromise)){
            await exec(`chroot ${chroot} mkdir ${pathPromise}`, echo)
        }

        // PUBLICSHARE=Public
        pathPromise = await this.path(user, chroot, 'PUBLICSHARE', verbose)
        if (!fs.existsSync(chroot+pathPromise)){
            await exec(`chroot ${chroot} mkdir ${pathPromise}`, echo)
        }

        // DOCUMENTS=Documents
        pathPromise = await this.path(user, chroot, 'DOCUMENTS', verbose)
        if (!fs.existsSync(chroot+pathPromise)){
            await exec(`chroot ${chroot} mkdir ${pathPromise}`, echo)
        }

        // MUSIC=Music
        pathPromise = await this.path(user, chroot, 'MUSIC', verbose)
        if (!fs.existsSync(chroot+pathPromise)){
            await exec(`chroot ${chroot} mkdir ${pathPromise}`, echo)
        }

        // PICTURES=Pictures
        pathPromise = await this.path(user, chroot, 'PICTURES', verbose)
        if (!fs.existsSync(chroot+pathPromise)){
            await exec(`chroot ${chroot} mkdir ${pathPromise}`, echo)
        }

        // VIDEOS=Videos
        pathPromise = await this.path(user, chroot, 'VIDEOS', verbose)
        if (!fs.existsSync(chroot+pathPromise)){
            await exec(`chroot ${chroot} mkdir ${pathPromise}`, echo)
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
    static async autologin(olduser: string, newuser: string, chroot='/'){
          if (Pacman.packageIsInstalled('lightdm')) {
            shx.sed('-i', `autologin-user=${olduser}`, `autologin-user=${newuser}`, `${chroot}/etc/lightdm/lightdm.conf`)
          }
    }
    

}