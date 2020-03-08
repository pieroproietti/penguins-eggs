/* eslint-disable no-console */
/**
 * penguins-eggs: buster/config.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import shx = require('shelljs')
import path = require('path')
import fs = require('fs')
import Utils from '../../utils'
import { IDistro, IOses } from '../../../interfaces'
const exec = require('../../../lib/utils').exec

class Config {
    verbose = false

    distro: IDistro

    oses: IOses

    // boolean 
    displaymanager = false

    constructor(distro: IDistro, oses: IOses, verbose = false) {
        this.distro = distro
        this.oses = oses
        this.verbose = verbose
        this.displaymanager = Utils.packageIsInstalled('lightdm') // Crea displaymanager solo per 
    }

    go() {
        // configurazioni generali
        this.createSettings()
        this.createBranding()

        // work modules exec section
        this.modulePartition()
        this.moduleMount()
        this.moduleUnpackfs()
        this.moduleSourcesMedia()
        this.moduleMachineid()
        this.moduleFstab()
        this.moduleLocale()
        this.moduleKeyboard()
        this.moduleLocalecfg()
        this.moduleUsers()
        this.moduleNetworkcfg()
        this.moduleHwclock()
        this.moduleServicesSystemd()
        this.moduleBootloaderConfig()
        this.moduleGrubcfg()
        this.moduleBootloader()
        this.modulePackages()
        this.moduleLuksbootkeyfile()
        this.modulePlymouthcfg()
        this.moduleInitramfscfg()
        this.moduleInitramfs()
        this.moduleSourcesMediaUnmount()
        this.moduleSourcesFinal()
        this.moduleUmount()
    }

    /**
     * 
     */
    createSettings() {
        const settings = require('./settings').settings
        const dir = '/etc/calamares/'
        const file = dir + 'settings.conf'
        const content = settings()
        write(file, content, this.verbose)
    }

    /**
     * 
     */
    createBranding() {
        const branding = require('./branding').branding
        const dir = `/etc/calamares/branding/${this.distro.branding}/`
        const file = dir + 'branding.desc'
        const content = branding(this.distro, this.oses, this.verbose)
        write(file, content, this.verbose)
    }


    /**
     * 
     */
    modulePartition() {
        if (this.verbose) {
            console.log(`calamares: module partition, nothing to do`)
        }
    }

    /**
     * 
     */
    moduleMount() {
        const mount = require('./modules/mount').branding
        const dir = `/etc/calamares/modules/`
        const file = dir + 'mount.conf'
        const content = mount()
        write(file, content, this.verbose)
    }

    /**
     * 
     */
    moduleUnpackfs() {
        const unpackfs = require('./modules/unpackfs').unpackfs
        const dir = `/etc/calamares/modules/`
        const file = dir + 'unpackfs.conf'
        const content = unpackfs(this.oses.mountpointSquashFs)
        write(file, content, this.verbose)
    }

    /**
     * 
     */
    async moduleSourcesMedia() {
        const sourcesMedia = require('./calamares-modules/sources-media').sourcesMedia
        const dir = `/usr/lib/calamares/modules/sources-media/`
        const file = dir + 'module.desc'
        const content = sourcesMedia()
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        write(file, content, this.verbose)

        const scriptSourceMedia = require('./scripts/source-media').sourcesMedia
        const scriptDir = `/sbin/`
        const scriptFile = scriptDir + 'sources-media'
        const scriptContent = scriptSourceMedia()
        write(file, content, this.verbose)
        await exec(`chmod +x ${file}`)
    }

    /**
     * 
     */
    moduleMachineid() {
        const machineid = require('./modules/machineid').machineid
        const dir = `/etc/calamares/modules/`
        const file = dir + 'machineid.conf'
        const content = machineid()
        write(file, content, this.verbose)
    }

    /**
     * 
     */
    moduleFstab() {
        const fstab = require('./modules/fstab').fstab
        const dir = `/etc/calamares/modules/`
        const file = dir + 'fstab.conf'
        const content = fstab()
        write(file, content, this.verbose)
    }

    /**
     * 
     */
    moduleLocale() {
        if (this.verbose) {
            console.log(`calamares: module locale, nothing to do`)
        }
    }

    /**
     * 
     */
    moduleKeyboard() {
        if (this.verbose) {
            console.log(`calamares: module keyboard, nothing to do`)
        }
    }
    /**
     * 
     */
    moduleLocalecfg() {
        if (this.verbose) {
            console.log(`calamares: module localecfg, nothing to do`)
        }
    }

    /**
     * 
     */
    moduleUsers() {
        const users = require('./modules/users').users
        const dir = `/etc/calamares/modules/`
        const file = dir + 'users.conf'
        const content = users()
        write(file, content, this.verbose)
    }

    /**
     * 
     */
    moduleNetworkcfg() { 
        if (this.verbose) {
            console.log(`calamares: module networkcfg, nothing to do`)
        }
    }

    /**
     * 
     */
    moduleHwclock() { 
        if (this.verbose) {
            console.log(`calamares: module hwclock, nothing to do`)
        }
    }


    /**
     * 
     */
    moduleServicesSystemd() { 
        if (this.verbose) {
            console.log(`calamares: module servives-systemd, nothing to do`)
        }
    }

    /**
     * 
     */
    async moduleBootloaderConfig() {
        const bootloaderConfig = require('./calamares-modules/bootloader-config').bootloaderConfig
        const dir = `/usr/lib/calamares/modules/bootloader-config/`
        const file = dir + 'module.desc'
        const content = bootloaderConfig()
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        write(file, content, this.verbose)

        const scriptBootloaderConfig = require('./scripts/bootloader-config').bootloaderConfig
        const scriptDir = `/sbin/`
        const scriptFile = scriptDir + 'bootloader-config'
        const scriptContent = scriptBootloaderConfig()
        write(file, content, this.verbose)
        await exec(`chmod +x ${scriptFile}`)
    }

    /**
     * 
     */
    moduleGrubcfg() {
        if (this.verbose) {
            console.log(`calamares: module services-systemd, nothing to do`)
        }
    }

    /**
     * 
     */
    moduleBootloader() {
        const bootloader = require('./modules/bootloader').bootloader
        const dir = `/etc/calamares/modules/`
        const file = dir + 'bootloader.conf'
        const content = bootloader()
        write(file, content, this.verbose)
    }


    /**
     * 
     */
    modulePackages() { }

    /**
     * 
     */
    moduleLuksbootkeyfile() { }

    /**
     * 
     */
    modulePlymouthcfg() { }

    /**
     * 
     */
    moduleInitramfscfg() { }

    /**
     * 
     */
    moduleInitramfs() { }

    /**
     * 
     */
    moduleSourcesMediaUnmount() { }

    /**
     * 
     */
    moduleSourcesFinal() { }

    /**
     * 
     */
    moduleUmount() { }
}


/**
 * 
 * @param file 
 * @param content 
 * @param verbose 
 */
function write(file: string, content: string, verbose = false) {
    if (verbose) {
        console.log(`calamares: create ${file}`)
    }
    fs.writeFileSync(file, content, 'utf8')
}
