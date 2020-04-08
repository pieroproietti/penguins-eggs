/**
 * penguins-eggs: buster/calamares-config.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import fs = require('fs')
import path = require('path')
import shx = require('shelljs')
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

    sourcesMedia = false

    sourcesTrusted = true

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
        this.displaymanager = (Utils.packageIsInstalled('lightdm') || Utils.packageIsInstalled('sddm'))
        this.sourcesMedia = false
    }

    config() {
        // configurazioni generali
        this.createCalamaresDirs()
        this.createSettings()
        this.createBranding()
        this.createInstallDebian()

        // work modules exec section
        this.modulePartition()
        this.moduleMount()
        this.moduleUnpackfs()
        if (this.sourcesMedia) {
            this.moduleSourcesMedia()
        }
        if (this.sourcesTrusted) {
            this.moduleSourcesTrusted()
        }
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
        this.moduleCreateTmp()
        this.moduleBootloaderConfig()
        this.moduleGrubcfg()
        this.moduleBootloader()
        this.modulePackages()
        this.moduleLuksbootkeyfile()
        this.moduleLuksopenswaphookcfg()
        this.modulePlymouthcfg()
        this.moduleInitramfscfg()
        this.moduleInitramfs()
        this.moduleRemoveuser()
        if (this.sourcesMedia) {
            this.moduleSourcesMediaUnmount()
        }
        if (this.sourcesTrusted) {
            this.moduleSourcesTrustedUnmount()
        }
        this.moduleSourcesFinal()
        this.moduleUmount()
    }

    /**
     * 
     */
    createCalamaresDirs(){
        if (!fs.existsSync('/etc/calamares')){
            fs.mkdirSync('/etc/calamares')
        }
        if (!fs.existsSync('/etc/calamares/branding')){
            fs.mkdirSync('/etc/calamares/branding')
        }
        if (!fs.existsSync('/etc/calamares/branding/eggs')){
            fs.mkdirSync('/etc/calamares/branding/eggs')
        }
        if (!fs.existsSync('/etc/calamares/modules')){
            fs.mkdirSync('/etc/calamares/modules')
        }
        if (!fs.existsSync('/usr/lib/calamares')){
            fs.mkdirSync('/usr/lib/calamares/')
        }
        if (!fs.existsSync('/usr/lib/calamares/modules')){
            fs.mkdirSync('/usr/lib/calamares/modules')
        }

        shx.cp(path.resolve(__dirname, '../../../../assets/calamares/install-debian.desktop'), '/usr/share/applications/install-debian.desktop')
        shx.cp('-r', path.resolve(__dirname, '../../../../assets/calamares/branding/*'), '/etc/calamares/branding/')
        shx.cp(path.resolve(__dirname, '../../../../assets/calamares/install-debian'), '/sbin/install-debian')
        shx.cp(path.resolve(__dirname, '../../../../assets/calamares/artwork/install-debian.png'), '/usr/share/icons/install-debian.png')
    }


    /**
     * 
     */
    async createInstallDebian() {
       const scriptInstallDebian = require('./scripts/install-debian').installDebian
       const scriptDir = `/usr/bin/`
       const scriptFile = scriptDir + 'install-debian'
       const scriptContent = scriptInstallDebian()
       write(scriptFile, scriptContent, this.verbose)
       await exec(`chmod +x ${scriptFile}`)
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
    createSettings() {
        const settings = require('./settings').settings
        const dir = '/etc/calamares/'
        const file = dir + 'settings.conf'
        const content = settings(this.displaymanager, this.sourcesMedia, this.sourcesTrusted)
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
        const scriptDir = `/usr/sbin/`
        const scriptFile = scriptDir + 'sources-media'
        const scriptContent = scriptSourcesMedia()
        write(scriptFile, scriptContent, this.verbose)
        await exec(`chmod +x ${scriptFile}`)
    }


    /**
     * 
     */
    async moduleSourcesTrusted() {
        const sourcesTrusted = require('./calamares-modules/sources-trusted').sourcesTrusted
        const dir = `/usr/lib/calamares/modules/sources-trusted/`
        const file = dir + 'module.desc'
        const content = sourcesTrusted()
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        write(file, content, this.verbose)

        const scriptSourcesTrusted = require('./scripts/sources-trusted').sourcesTrusted
        const scriptDir = `/usr/sbin/`
        const scriptFile = scriptDir + 'sources-trusted'
        const scriptContent = scriptSourcesTrusted()
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

    async moduleCreateTmp() {
        const createTmp = require('./calamares-modules/create-tmp').createTmp
        const dir = `/usr/lib/calamares/modules/create-tmp/`
        const file = dir + 'module.desc'
        const content = createTmp()
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        write(file, content, this.verbose)
        const scriptcreateTmp = require('./scripts/create-tmp').createTmp
        const scriptDir = `/usr/sbin/`
        const scriptFile = scriptDir + 'create-tmp'
        const scriptContent = scriptcreateTmp()
        write(scriptFile, scriptContent, this.verbose)
        await exec(`chmod +x ${scriptFile}`)
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
        const scriptDir = `/usr/sbin/`
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
    moduleRemoveuser(){
        const removeuser = require('./modules/removeuser').removeuser
        const dir = `/etc/calamares/modules/`
        const file = dir + 'removeuser.conf'
        const content = removeuser()
        write(file, content, this.verbose)
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
    moduleSourcesTrustedUnmount() {
        const sourcesTrustedUnmount = require('./calamares-modules/sources-trusted-unmount').sourcesTrustedUnmount
        const dir = `/usr/lib/calamares/modules/sources-trusted-unmount/`
        const file = dir + 'module.desc'
        const content = sourcesTrustedUnmount()
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        write(file, content, this.verbose)

        if (this.verbose) {
            console.log(`calamares: module source-trusted-unmount use the same script of source-trusted. Nothing to do!`)
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
        const scriptDir = `/usr/sbin/`
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
