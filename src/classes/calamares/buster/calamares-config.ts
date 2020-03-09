/**
 * penguins-eggs: buster/calamares-config.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import fs = require('fs')
import Utils from '../../utils'
import { IDistro, IOses } from '../../../interfaces'
const exec = require('../../../lib/utils').exec

/**
 * 
 */
class calamaresConfig {
    verbose = false

    distro: IDistro

    oses: IOses

    displaymanager = false

    /**
     * 
     * @param distro 
     * @param oses 
     * @param verbose 
     */
    constructor(distro: IDistro, oses: IOses, verbose = false) {
        this.distro = distro
        this.oses = oses
        this.verbose = verbose
        this.displaymanager = Utils.packageIsInstalled('lightdm') // Crea displaymanager solo per lightdm
    }

    config() {
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
        if (this.displaymanager){
            this.moduleDisplaymanager()
        }
        this.moduleNetworkcfg()
        this.moduleHwclock()
        this.moduleServicesSystemd()
        this.moduleBootloaderConfig()
        this.moduleGrubcfg()
        this.moduleBootloader()
        this.modulePackages()
        this.moduleLuksbootkeyfile()
        // Luksopenswaphookcfg()
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
        const content = settings(this.displaymanager)
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
            console.log(`calamares: module partition. Nothing to do!`)
        }
    }

    /**
     * 
     */
    moduleMount() {
        const mount = require('./modules/mount').mount
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

        const scriptSourcesMedia = require('./scripts/sources-media').sourcesMedia
        const scriptDir = `/sbin/`
        const scriptFile = scriptDir + 'sources-media'
        const scriptContent = scriptSourcesMedia()
        write(scriptFile, scriptContent, this.verbose)
        await exec(`chmod +x ${scriptFile}`)
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
            console.log(`calamares: module locale. Nothing to do!`)
        }
    }

    /**
     * 
     */
    moduleKeyboard() {
        if (this.verbose) {
            console.log(`calamares: module keyboard. Nothing to do!`)
        }
    }
    /**
     * 
     */
    moduleLocalecfg() {
        if (this.verbose) {
            console.log(`calamares: module localecfg. Nothing to do!`)
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
    moduleDisplaymanager(){ 
        const displaymanager = require('./modules/displaymanager').displaymanager
        const dir = `/etc/calamares/modules/`
        const file = dir + 'displaymanager.conf'
        const content = displaymanager()
        write(file, content, this.verbose)
    }
    /**
     * 
     */
    moduleNetworkcfg() {
        if (this.verbose) {
            console.log(`calamares: module networkcfg. Nothing to do!`)
        }
    }

    /**
     * 
     */
    moduleHwclock() {
        if (this.verbose) {
            console.log(`calamares: module hwclock. Nothing to do!`)
        }
    }


    /**
     * 
     */
    moduleServicesSystemd() {
        if (this.verbose) {
        console.log(`calamares: module servives-systemd. Nothing to do!`)
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
        write(scriptFile, scriptContent, this.verbose)
        await exec(`chmod +x ${scriptFile}`)
    }

    /**
     * 
     */
    moduleGrubcfg() {
        if (this.verbose) {
            console.log(`calamares: module grubcfg. Nothing to do!`)
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
   * create module packages.conf
   */
    modulePackages() {
        const packages = require('./modules/packages').packages
        const dir = `/etc/calamares/modules/`
        const file = dir + 'packages.conf'
        const content = packages()
        write(file, content, this.verbose)
    }

    /**
     * 
     */
    moduleLuksbootkeyfile() {
        if (this.verbose) {
            console.log(`calamares: module luksbootkeyfile. Nothing to do!`)
        }
    }

    /**
     * 
     */
    moduleLuksopenswaphookcfg() {
        const lksopenswaphookcfg = require('./modules/lksopenswaphookcfg').lksopenswaphookcfg
        const dir = `/etc/calamares/modules/`
        const file = dir + 'lksopenswaphookcfg.conf'
        const content = lksopenswaphookcfg()
        write(file, content, this.verbose)
    }

    /**
     * 
     */
    modulePlymouthcfg() {
        if (this.verbose) {
            console.log(`calamares: module plymouthcfg. Nothing to do!`)
        }
    }

    /**
     * 
     */
    moduleInitramfscfg() { 
        if (this.verbose) {
            console.log(`calamares: module initramfscfg. Nothing to do!`)
        }
    }


    /**
     * 
     */
    moduleInitramfs() {
        if (this.verbose) {
            console.log(`calamares: module initramfs. Nothing to do!`)
        }
    }


    /**
     * 
     */
    moduleSourcesMediaUnmount() {
        const sourcesMediaUnmount = require('./calamares-modules/sources-media-unmount').sourcesMediaUnmount
        const dir = `/usr/lib/calamares/modules/sources-media-unmount/`
        const file = dir + 'module.desc'
        const content = sourcesMediaUnmount()
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        write(file, content, this.verbose)

        if (this.verbose) {
            console.log(`calamares: module source-media-unmount use the same script of source-media. Nothing to do!`)
        }

    }

    /**
     * 
     */
    async moduleSourcesFinal() { 
        const sourcesFinal = require('./calamares-modules/sources-final').sourcesFinal
        const dir = `/usr/lib/calamares/modules/sources-final/`
        const file = dir + 'module.desc'
        const content = sourcesFinal()
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        write(file, content, this.verbose)

        const scriptSourcesFinal = require('./scripts/sources-final').sourcesFinal
        const scriptDir = `/sbin/`
        const scriptFile = scriptDir + 'sources-final'
        const scriptContent = scriptSourcesFinal()
        write(scriptFile, scriptContent, this.verbose)
        await exec(`chmod +x ${scriptFile}`)
    }

    /**
     * 
     */
    moduleUmount() { 
        if (this.verbose) {
            console.log(`calamares: module unmount. Nothing to do!`)
        }
    }
}

export default calamaresConfig

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
