/* penguins-eggs: buster.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

/**
 * penguins-eggs: buster.ts
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
        this.displaymanager = displaymanager
    }

    /**
     *
     */
    public settings() {
        const dir = '/etc/calamares/'
        const file = dir + 'settings.conf'
        const content = this.getSettings(
            this.displaymanager,
            this.sourcesMedia,
            this.sourcesTrusted,
            this.remix
        )
        write(file, content, this.verbose)
    }

    /**
     * 
     * @param displaymanager 
     * @param sourcesMedia 
     * @param sourcesTrusted 
     * @param remix 
     */
    getSettings(
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

    /**
     * module = name + '.conf0
     * shellprocess = 'shellprocess_' + name + '.conf'
     * contextualprocess = name + '_context.conf'
     * 
     * module_calamares
     *                      dir = '/usr/lib/calamares/modules/' + name
     *                      name = module.desc
     *                      script = 
     * @param name
     */
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
     * module = name + '.conf0
     * shellprocess = 'shellprocess_' + name + '.conf'
     * contextualprocess = name + '_context.conf'
     * 
     * module_calamares
     *                      dir = '/usr/lib/calamares/modules/' + name
     *                      name = module.desc
     *                      script = 
     * @param name
     */
    module(name: string, content: string) {
        const dir = `/etc/calamares/modules/`
        const file = dir + name + '.conf'
        write(file, content, this.verbose)
    }

    /**
     * 
     * @param process 
     */
    shellprocess(name: string) {
        let content = ''
        const dir = `/etc/calamares/modules/`
        let file = dir + 'shellprocess_' + name + '.conf'
        write(file, content, this.verbose)
    }

    /**
     * 
     * @param process 
     */
    contextualprocess(name: string) {
        let content = ''
        const dir = `/etc/calamares/modules/`
        let file = dir + name + '_context' + '.conf'
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
        this.module('mount', mount()()
    }

    /**
     *
     */
    moduleUnpackfs() {
        const unpackfs = require('./modules/unpackfs').unpackfs
        this.module('unpackfs', unpackfs(this.distro.mountpointSquashFs))
    }

    /**
     *
     */
    async moduleSourcesMedia() {
        const dir = `/usr/lib/calamares/modules/sources-media/`
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }

        // desc
        const sourcesMedia = require('./calamares-modules/sources-media').sourcesMedia
        const file = dir + 'module.desc'
        const content = sourcesMedia()
        write(file, content, this.verbose)

        // bash
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
        const dir = `/usr/lib/calamares/modules/sources-trusted/`
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        // desc
        const sourcesTrusted = require('./calamares-modules/desc/sources-trusted').sourcesTrusted
        const file = dir + 'module.desc'
        const content = sourcesTrusted()
        write(file, content, this.verbose)

        const scriptSourcesTrusted = require('./calamares-modules/scripts/sources-trusted').sourcesTrusted
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
        this.module('machineid', machineid())
    }

    /**
     *
     */
    moduleFstab() {
        const fstab = require('./modules/fstab').fstab
        this.module('fstab', fstab())
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
        this.module('users', users())
    }

    /**
     *
     */
    moduleDisplaymanager() {
        const displaymanager = require('./modules/displaymanager').displaymanager
        this.module('displaymanager', displaymanager()
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
        const dir = `/usr/lib/calamares/modules/create-tmp/`
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }

        // desc
        const createTmp = require('./calamares-modules/desc/create-tmp').createTmp
        const file = dir + 'module.desc'
        const content = createTmp()
        write(file, content, this.verbose)

        // bash
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
        const dir = `/usr/lib/calamares/modules/bootloader-config/`
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }

        const bootloaderConfig = require('./calamares-modules/desc/bootloader-config')
            .bootloaderConfig
        const file = dir + 'module.desc'
        const content = bootloaderConfig()
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
        this.module('bootloader', bootloader())
    }

    /**
     * create module packages.conf
     */
    modulePackages() {
        const packages = require('./modules/packages').packages
        this.module('packages', packages())
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
        this.module('lksopenswaphookcfg', lksopenswaphookcfg())
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
        this.module('removeuser', removeuser())
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
        const dir = `/usr/lib/calamares/modules/sources-media-unmount/`
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }

        // desc
        const sourcesMediaUnmount = require('./calamares-modules/sources-media-unmount')
            .sourcesMediaUnmount
        const file = dir + 'module.desc'
        const content = sourcesMediaUnmount()
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
        const dir = `/usr/lib/calamares/modules/sources-trusted-unmount/`
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }

        const sourcesTrustedUnmount = require('./calamares-modules/desc/sources-trusted-unmount')
            .sourcesTrustedUnmount
        const file = dir + 'module.desc'
        const content = sourcesTrustedUnmount()
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
        const dir = `/usr/lib/calamares/modules/sources-final/`
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }

        // desc
        const sourcesFinal = require('./calamares-modules/desc/sources-final')
            .sourcesFinal
        const file = dir + 'module.desc'
        const content = sourcesFinal()
        write(file, content, this.verbose)

        // bash
        const scriptSourcesFinal = require('./calamares-modules/scripts/sources-final').sourcesFinal
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