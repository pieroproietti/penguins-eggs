/* penguins-eggs: buster.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

/**
 * penguins-eggs: focal.ts
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
import { machineid } from './modules/machineid'
const exec = require('../../lib/utils').exec

/**
 * 
 */
export class Focal {
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

        // Istanze
        const instances = [
            {
                "id": "before_bootloader_mkdirs",
                "module": "contextualprocess",
                "config": "before_bootloader_mkdirs_context.conf"
            },
            {
                "id": "before_bootloader",
                "module": "contextualprocess",
                "config": "before_bootloader_context.conf"
            },
            {
                "id": "after_bootloader",
                "module": "contextualprocess",
                "config": "after_bootloader_context.conf"
            },
            {
                "id": "after_bootloader",
                "module": "contextualprocess",
                "config": "after_bootloader_context.conf"
            },
            {
                "id": "bug-LP#1829805",
                "module": "shellprocess",
                "config": "shellprocess_bug-LP#1829805.conf"
            },
            {
                "id": "add386arch",
                "module": "shellprocess",
                "config": "shellprocess_add386arch.conf"
            }
        ]

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
        exec.push("machineid")
        exec.push('fstab')
        exec.push('locale')
        exec.push('keyboard')
        exec.push('localecfg')
        exec.push('luksbootkeyfile')
        exec.push('users')
        exec.push('displaymanager')
        exec.push('networkcfg')
        exec.push('hwclock')
        exec.push("contextualprocess@before_bootloader_mkdirs")
        exec.push("shellprocess@bug-LP#1829805")
        exec.push("initramfscfg")
        exec.push("initramfs")
        exec.push("grubcfg")
        exec.push("contextualprocess@before_bootloader")
        exec.push("bootloader")
        exec.push("contextualprocess@after_bootloader")
        exec.push("automirror")
        exec.push("shellprocess@add386arch")
        exec.push("packages")
        exec.push("shellprocess@logs")
        exec.push("umount")

        const settings = {
            'modules-search': modulesSearch,
            sequence: [{ show: show }, { exec: exec }, { show: ['finished'] }],
            branding: remix.branding,
            'prompt-install': false,
            'dont-chroot': false
        }
        return yaml.safeDump(settings)
    }

    /**
     * 
     */
    public modules() {
        this.module_partition()
        this.module_mount()
        this.module_unpackfs()
        this.module_machineid()
        this.module_fstab()
        this.module_locale()
        this.module_keyboard()
        this.module_localecfg()
        this.module_luksbootkeyfile()
        this.module_users()
        this.module_displaymanager()
        this.module_networkcfg()
        this.module_hwclock()
        this.contextualprocess_before_bootloader_mkdirs()
        this.shellprocess('bug-LP#1829805')
        this.module_initramfscfg()
        this.module_initramfs()
        this.module_grubcfg()
        // exec.push("contextualprocess@before_bootloader")
        this.module_bootloader()
        // exec.push("contextualprocess@after_bootloader")
        // exec.push("automirror")
        // exec.push("shellprocess@add386arch")
        // exec.push("packages")
        // exec.push("shellprocess@logs")
        this.module_umount()
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
    shellprocess(name: string, content: string) {
        const dir = `/etc/calamares/modules/`
        let file = dir + 'shellprocess_' + name + '.conf'
        write(file, content, this.verbose)
    }

    /**
     * 
     * @param process 
     */
    contextualprocess(name: string, content: string, verbose = false) {
        const dir = `/etc/calamares/modules/`
        let file = dir + name + '_context' + name + '.conf'
        write(file, content, this.verbose)
    }

    /**
     *
     */
    module_partition() {
        let text = ''
        text += 'efiSystemPartition: "/boot/efi"\n'
        text += 'enableLuksAutomatedPartitioning: true\n'
        text += 'userSwapChoices: none\n'
        text += 'drawNestedPartitions: true\n'
        text += 'defaultFileSystemType: "ext4"\n'
        this.module('partition', text)
    }

    /**
     * 
     */
    contextualprocess_before_bootloader_mkdirs() {
        let text = ''
        text += '---\n'
        text += 'dontChroot: true\n'
        text += 'timeout: 10\n'
        text += 'firmwareType:\n'
        text += '    efi:\n'
        text += '    - -cp /cdrom/casper/vmlinuz @@ROOT@@/boot/vmlinuz-$(uname -r)\n'
        text += '    - -mkdir -pv @@ROOT@@/media/cdrom\n'
        text += '    - -mount --bind /cdrom @@ROOT@@/media/cdrom\n'
        text += '    bios:\n'
        text += '    - -cp /cdrom/casper/vmlinuz @@ROOT@@/boot/vmlinuz-$(uname -r)\n'
        this.contextualprocess('before_bootloader_mkdirs', text)
    }

    /**
     *
     */
    module_mount() {
        const mount = require('./modules/mount').mount
        const content = mount()
        this.module('mount', content)
    }

    /**
     *
     */
    module_unpackfs() {
        const unpackfs = require('./modules/unpackfs').unpackfs
        const content = unpackfs(this.distro.mountpointSquashFs)
        this.module('unpackfs', content)
    }

    /**
     *
     */
    async module_sourcesmedia() {
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
    async module_sourcestrusted() {
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
    module_machineid() {
        const machineid = require('./modules/machineid').machineid
        const content = machineid()
        this.module('machineid', content)
    }

    /**
     *
     */
    module_fstab() {
        const fstab = require('./modules/fstab').fstab
        const content = fstab()
        this.module('fstab', content)
    }

    /**
     *
     */
    module_locale() {
        if (this.verbose) {
            console.log(`calamares: module locale. Nothing to do!`)
        }
    }

    /**
     *
     */
    module_keyboard() {
        if (this.verbose) {
            console.log(`calamares: module keyboard. Nothing to do!`)
        }
    }
    /**
     *
     */
    module_localecfg() {
        if (this.verbose) {
            console.log(`calamares: module localecfg. Nothing to do!`)
        }
    }

    /**
     *
     */
    module_users() {
        const users = require('./modules/users').users
        const content = users()
        this.module('users', content)
    }

    /**
     *
     */
    module_displaymanager() {
        const displaymanager = require('./modules/displaymanager').displaymanager
        const content = displaymanager()
        this.module('displaymanager', content)
    }
    /**
     *
     */
    module_networkcfg() {
        if (this.verbose) {
            console.log(`calamares: module networkcfg. Nothing to do!`)
        }
    }

    /**
     *
     */
    module_hwclock() {
        if (this.verbose) {
            console.log(`calamares: module hwclock. Nothing to do!`)
        }
    }

    /**
     *
     */
    module_servicessystemd() {
        if (this.verbose) {
            console.log(`calamares: module servives-systemd. Nothing to do!`)
        }
    }

    async module_createtmp() {
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
    async module_bootloaderconfig() {
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
    module_grubcfg() {
        if (this.verbose) {
            console.log(`calamares: module grubcfg. Nothing to do!`)
        }
    }

    /**
     *
     */
    module_bootloader() {
        const bootloader = require('./modules/bootloader').bootloader
        const content = bootloader()
        this.module('bootloader', content)
    }

    /**
     * create module packages.conf
     */
    module_packages() {
        const packages = require('./modules/packages').packages
        const content = packages()
        this.module('packages', content, this.verbose)
    }

    /**
     *
     */
    module_luksbootkeyfile() {
        if (this.verbose) {
            console.log(`calamares: module luksbootkeyfile. Nothing to do!`)
        }
    }

    /**
     *
     */
    module_luksopenswaphookcfg() {
        const lksopenswaphookcfg = require('./modules/lksopenswaphookcfg')
            .lksopenswaphookcfg
        const content = lksopenswaphookcfg()
        this.module('lksopenswaphookcfg', content)
    }

    /**
     *
     */
    module_plymouthcfg() {
        if (this.verbose) {
            console.log(`calamares: module plymouthcfg. Nothing to do!`)
        }
    }

    /**
     *
     */
    module_initramfscfg() {
        if (this.verbose) {
            console.log(`calamares: module initramfscfg. Nothing to do!`)
        }
    }

    /**
     *
     */
    module_removeuser() {
        const removeuser = require('./modules/removeuser').removeuser
        const content = removeuser()
        this.module('removeuser', content)
    }

    /**
     *
     */
    module_initramfs() {
        if (this.verbose) {
            console.log(`calamares: module initramfs. Nothing to do!`)
        }
    }

    /**
     *
     */
    module_sourcesmediaunmount() {
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
    module_surcestrustedunmount() {
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
    async module_surcesfinal() {
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
    async module_automirror() {
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
    module_umount() {
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