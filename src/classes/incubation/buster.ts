/* penguins-eggs: buster.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

/**
 * penguins-eggs: buster/calamares-config.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import fs = require('fs')
import path = require('path')
import shx = require('shelljs')
import Utils from '../utils'
import Pacman from '../pacman'
import yaml = require('js-yaml')
import { IRemix, IDistro } from '../../interfaces'
const exec = require('../../lib/utils').exec

/**
 * 
 */
export class Buster {
    verbose = false

    remix: IRemix

    distro: IDistro

    displaymanager = false

    sourcesMedia = false

    sourcesTrusted = true

    constructor(remix: IRemix, distro: IDistro, displaymanager: boolean, verbose = false) {
        this.remix = remix
        this.distro = distro
        this.verbose = verbose
        this.displaymanager =displaymanager
    }
  

    /**
     * 
     * @param displaymanager 
     * @param sourcesMedia 
     * @param sourcesTrusted 
     * @param remix 
     */
    public settings(
        displaymanager = false,
        sourcesMedia = false,
        sourcesTrusted = true,
        remix: IRemix
    ): string {
        // path di ricerca dei moduli
        const modulesSearch: string[] = []
        modulesSearch.push('local')
        modulesSearch.push('/usr/lib/calamares/modules')

        // moduli da mostrare a video
        const show: string[] = []
        show.push('welcome')
        show.push('locale')
        show.push('keyboard')
        show.push('partition')
        show.push('users')
        show.push('summary')

        // moduli da eseguire
        const exec: string[] = []
        exec.push('partition')
        exec.push('mount')
        exec.push('unpackfs')
        if (sourcesMedia) {
            exec.push('sources-media')
        }
        if (sourcesTrusted) {
            exec.push('sources-trusted')
        }
        exec.push('machineid')
        exec.push('fstab')
        exec.push('locale')
        exec.push('keyboard')
        exec.push('localecfg')
        exec.push('users')
        if (displaymanager) {
            exec.push('displaymanager')
        }
        exec.push('networkcfg')
        exec.push('hwclock')
        exec.push('services-systemd')
        exec.push('create-tmp')
        exec.push('bootloader-config')
        exec.push('grubcfg')
        exec.push('bootloader')
        /**
         * tolta la rimozione dei pacchetti da sistemare
         */
        //exec.push('packages')
        exec.push('luksbootkeyfile')
        exec.push('plymouthcfg')
        exec.push('initramfscfg')
        exec.push('initramfs')
        exec.push('removeuser')
        if (sourcesMedia) {
            exec.push('sources-media-unmount')
            exec.push('sources-final')
        }
        if (sourcesTrusted) {
            exec.push('sources-trusted-unmount')
            exec.push('sources-final')
        }
        exec.push('umount')

        const settings = {
            'modules-search': modulesSearch,
            sequence: [{ show: show }, { exec: exec }, { show: ['finished'] }],
            branding: remix.branding,
            'prompt-install': false,
            'dont-chroot': false
        }
        // console.log(settings)
        return yaml.safeDump(settings)
    }

    public modules() {
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
        if (this.displaymanager) {
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
    createSettings() {
        const settings = require('./debian/settings').settings
        const dir = '/etc/calamares/'
        const file = dir + 'settings.conf'
        const content = settings(
            this.displaymanager,
            this.sourcesMedia,
            this.sourcesTrusted,
            this.remix
        )
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
        const content = unpackfs(this.distro.mountpointSquashFs)
        write(file, content, this.verbose)
    }

    /**
     *
     */
    async moduleSourcesMedia() {
        const sourcesMedia = require('./calamares-modules/sources-media')
            .sourcesMedia
        const dir = `/usr/lib/calamares/modules/sources-media/`
        const file = dir + 'module.desc'
        const content = sourcesMedia()
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        write(file, content, this.verbose)

        const scriptSourcesMedia = require('./calamares-modules/scripts/sources-media').sourcesMedia
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
        const sourcesTrusted = require('./calamares-modules/desc/sources-trusted')
            .sourcesTrusted
        const dir = `/usr/lib/calamares/modules/sources-trusted/`
        const file = dir + 'module.desc'
        const content = sourcesTrusted()
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        write(file, content, this.verbose)

        const scriptSourcesTrusted = require('./calamares-modules/scripts/sources-trusted')
            .sourcesTrusted
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
    moduleDisplaymanager() {
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
        const createTmp = require('./calamares-modules/desc/create-tmp').createTmp
        const dir = `/usr/lib/calamares/modules/create-tmp/`
        const file = dir + 'module.desc'
        const content = createTmp()
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        write(file, content, this.verbose)
        const scriptcreateTmp = require('./calamares-modules/scripts/create-tmp').createTmp
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
        const bootloaderConfig = require('./calamares-modules/desc/bootloader-config')
            .bootloaderConfig
        const dir = `/usr/lib/calamares/modules/bootloader-config/`
        const file = dir + 'module.desc'
        const content = bootloaderConfig()
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        write(file, content, this.verbose)

        const scriptBootloaderConfig = require('./calamares-modules/scripts/bootloader-config')
            .bootloaderConfig
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
        const lksopenswaphookcfg = require('./modules/lksopenswaphookcfg')
            .lksopenswaphookcfg
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
    moduleRemoveuser() {
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
        const sourcesMediaUnmount = require('./calamares-modules/sources-media-unmount')
            .sourcesMediaUnmount
        const dir = `/usr/lib/calamares/modules/sources-media-unmount/`
        const file = dir + 'module.desc'
        const content = sourcesMediaUnmount()
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        write(file, content, this.verbose)

        if (this.verbose) {
            console.log(
                `calamares: module source-media-unmount use the same script of source-media. Nothing to do!`
            )
        }
    }

    /**
     *
     */
    moduleSourcesTrustedUnmount() {
        const sourcesTrustedUnmount = require('./calamares-modules/desc/sources-trusted-unmount')
            .sourcesTrustedUnmount
        const dir = `/usr/lib/calamares/modules/sources-trusted-unmount/`
        const file = dir + 'module.desc'
        const content = sourcesTrustedUnmount()
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        write(file, content, this.verbose)

        if (this.verbose) {
            console.log(
                `calamares: module source-trusted-unmount use the same script of source-trusted. Nothing to do!`
            )
        }
    }

    /**
     *
     */
    async moduleSourcesFinal() {
        const sourcesFinal = require('./calamares-modules/desc/sources-final')
            .sourcesFinal
        const dir = `/usr/lib/calamares/modules/sources-final/`
        const file = dir + 'module.desc'
        const content = sourcesFinal()
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        write(file, content, this.verbose)

        const scriptSourcesFinal = require('./calamares-modules/scripts/sources-final').sourcesFinal
        const scriptDir = `/usr/sbin/`
        const scriptFile = scriptDir + 'sources-final'
        const scriptContent = scriptSourcesFinal()
        write(scriptFile, scriptContent, this.verbose)
        await exec(`chmod +x ${scriptFile}`)
    }

    /**
     * Automirrot
     */
    async moduleAutomirror() {
        const automirrorConfig = require('./calamares-modules/automirror')
            .automirrorConfig
        const dir = `/usr/lib/calamares/modules/automirror-config/`
        const file = dir + 'module.desc'
        const content = automirrorConfig()
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        write(file, content, this.verbose)

        const scriptAutomirrorConfig = require('./calamares-modules/scripts/automirror-config')
            .automirrorConfig
        const scriptDir = `/usr/lib/calamares/modules/automirror-config/`
        const scriptFile = scriptDir + 'main.py'
        const scriptContent = scriptAutomirrorConfig()
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