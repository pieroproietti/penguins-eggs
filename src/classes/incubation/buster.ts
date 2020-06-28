/* penguins-eggs: buster.ts
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
        const content = this.getSettings()
        write(file, content, this.verbose)
    }

    /**
     * 
     */
    getSettings(): string {
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
        if (this.sourcesTrusted) {
            exec.push('sources-trusted')
        }
        exec.push('machineid')
        exec.push('fstab')
        exec.push('locale')
        exec.push('keyboard')
        exec.push('localecfg')
        exec.push('users')
        if (this.displaymanager) {
            exec.push('displaymanager')
        }
        exec.push('networkcfg')
        exec.push('hwclock')
        exec.push('services-systemd')
        exec.push('create-tmp')
        exec.push('bootloader-config')
        exec.push('grubcfg')
        exec.push('bootloader')
        exec.push('luksbootkeyfile')
        exec.push('plymouthcfg')
        exec.push('initramfscfg')
        exec.push('initramfs')
        exec.push('removeuser')
        if (this.sourcesTrusted) {
            exec.push('sources-trusted-unmount')
            exec.push('sources-final')
        }
        exec.push('umount')

        const settings = {
            'modules-search': modulesSearch,
            sequence: [{ show: show }, { exec: exec }, { show: ['finished'] }],
            branding: this.remix.branding,
            'prompt-install': false,
            'dont-chroot': false
        }
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
     * ====================================================================================
     * M O D U L E S
     * ====================================================================================
     */

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
        const mount = yaml.safeDump({
            extraMounts: [{
                device: "proc",
                fs: "proc",
                mountPoint: "/proc"
            }, {
                device: "sys",
                fs: "sysfs",
                mountPoint: "/sys"
            }, {
                device: "/dev",
                mountPoint: "/dev",
                options: "bind"
            }, {
                device: "/dev/pts",
                fs: "devpts",
                mountPoint: "/dev/pts"
            }, {
                device: "tmpfs",
                fs: "tmpfs",
                mountPoint: "/run"
            }, {
                device: "/run/udev",
                mountPoint: "/run/udev",
                options: "bind"
            }],
            extraMountsEfi: [{
                device: "efivarfs",
                fs: "tmpefivarfsfs",
                mountPoint: "/sys/firmware/efi/efivars"
            }]
        })

        this.module('mount', mount)
    }

    /**
     *
     */
    moduleUnpackfs() {
        const unpack = yaml.safeDump({
            unpack: [{
                source: this.distro.mountpointSquashFs,
                sourcefs: "squashfs",
                destination: ""
            }]
        })
        this.module('unpackfs', unpack)
    }

    /**
     *
     */
    moduleMachineid() {
        const machineid = yaml.safeDump({
            systemd: true,
            dbus: true,
            symlink: true
        })
        this.module('machineid', machineid)
    }

    /**
     *
     */
    moduleFstab() {
        const fstab = yaml.safeDump({
            mountOptions: {
                default: "defaults,noatime",
                btrfs: "defaults,noatime,space_cache,autodefrag"
            },
            ssdExtraMountOptions: {
                ext4: "discard",
                jfs: "discard",
                xfs: "discard",
                swap: "discard",
                btrfs: "discard,compress=lzo"
            },
            crypttabOptions: "luks,keyscript=/bin/cat"
        })

        this.module('fstab', fstab)
    }

    moduleLocale() { if (this.verbose) console.log(`calamares: module locale. Nothing to do!`) }

    moduleKeyboard() { if (this.verbose) console.log(`calamares: module keyboard. Nothing to do!`) }

    moduleLocalecfg() { if (this.verbose) console.log(`calamares: module localecfg. Nothing to do!`) }


    /**
     *
     */
    moduleUsers() {
        const users = yaml.safeDump({
            userGroup: "users",
            defaultGroup: [
                "cdrom", "floppy", "sudo", "audio", "dip", "video", "plugdev", "netdev", "lpadmin", "scanner", "bluetooth"
            ],
            autologinGroup: "autologin",
            sudoersGroup: "sudo",
            setRootPassword: false
        })
        this.module('users', users)
    }

    /**
     *
     */
    moduleDisplaymanager() {
        const displaymanager = require('./modules/displaymanager').displaymanager
        this.module('displaymanager', displaymanager())
    }

    moduleNetworkcfg() { if (this.verbose) console.log(`calamares: module networkcfg. Nothing to do!`) }

    moduleHwclock() { if (this.verbose) console.log(`calamares: module hwclock. Nothing to do!`) }

    moduleServicesSystemd() { if (this.verbose) console.log(`calamares: module servives-systemd. Nothing to do!`) }

    moduleGrubcfg() { if (this.verbose) console.log(`calamares: module grubcfg. Nothing to do!`) }

    /**
     * 
     */
    moduleBootloader() {
        const bootloader = yaml.safeDump({
            efiBootLoader: "grub",
            kernel: "/vmlinuz-linux",
            img: "/initramfs-linux.img",
            fallback: "/initramfs-linux-fallback.img",
            timeout: 10,
            grubInstall: "grub-install",
            grubMkconfig: "grub-mkconfig",
            grubCfg: "/boot/grub/grub.cfg",
            grubProbe: "grub-probe",
            efiBootMgr: "efibootmgr",
            installEFIFallback: false
        })
        this.module('bootloader', bootloader)
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
    moduleLuksbootkeyfile() { if (this.verbose) console.log(`calamares: module luksbootkeyfile. Nothing to do!`) }
    /**
     *
     */
    moduleLuksopenswaphookcfg() {
        const lksopenswaphookcfg = yaml.safeDump({
            configFilePath: "/etc/openswap.conf"
        })
        this.module('lksopenswaphookcfg', lksopenswaphookcfg)
    }

    modulePlymouthcfg() { if (this.verbose) console.log(`calamares: module plymouthcfg. Nothing to do!`) }

    moduleInitramfscfg() { if (this.verbose) console.log(`calamares: module initramfscfg. Nothing to do!`) }

    /**
     *
     */
    moduleRemoveuser() {
        const removeuser = yaml.safeDump({ username: "live" })
        this.module('removeuser', removeuser)
    }

    moduleInitramfs() { if (this.verbose) console.log(`calamares: module initramfs. Nothing to do!`) }

    moduleUmount() { if (this.verbose) console.log(`calamares: module unmount. Nothing to do!`) }



    /**
     * ====================================================================================
     * M O D U L E S   C A L A M A R E S
     * ====================================================================================
     */

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

        // desc
        const bootloaderConfig = require('./calamares-modules/desc/bootloader-config')
            .bootloaderConfig
        const file = dir + 'module.desc'
        const content = bootloaderConfig()
        write(file, content, this.verbose)

        // bash
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

        // bash
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