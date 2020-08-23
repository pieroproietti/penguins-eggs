/**
 * penguins-eggs: devuan.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 * al momento escludo solo machineid
 */

import fs = require('fs')
import yaml = require('js-yaml')
import { IRemix, IDistro } from '../../interfaces'
const exec = require('../../lib/utils').exec

/**
 * 
 */
export class Devuan {
    verbose = false

    remix: IRemix

    distro: IDistro

    displaymanager = false

    user_opt: string

    dirGlobalModules = '/usr/lib/x86_64-linux-gnu/calamares/modules/'


    /**
     * @param remix 
     * @param distro 
     * @param displaymanager 
     * @param verbose 
     */
    constructor(remix: IRemix, distro: IDistro, displaymanager: boolean, user_opt: string, verbose = false) {
        this.remix = remix
        this.distro = distro
        this.user_opt = user_opt
        this.verbose = verbose
        this.displaymanager = displaymanager
        if (process.arch === 'ia32') {
            this.dirGlobalModules = '/usr/lib/calamares/modules/'
        }

    }

    /**
     * write setting
     */
    public settings() {
        const dir = '/etc/calamares/'
        const file = dir + 'settings.conf'
        write(file, this.getSettings(), this.verbose)
    }

    /**
    * 
    */
    getSettings(): string {
        // path di ricerca dei moduli
        const modulesSearch = ['local', '/usr/lib/calamares/modules']

        // moduli da mostrare a video
        const show = ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary']

        // moduli da eseguire
        let exec: string[] = []
        exec.push('partition')
        exec.push('mount')
        exec.push('unpackfs')
        exec.push('sources-trusted')
        //exec.push('machineid')
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
        exec.push('sources-trusted-unmount')
        exec.push('sources-final')
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
    * 
    */
    public modules() {
        this.modulePartition()
        this.moduleMount()
        this.moduleUnpackfs()
        this.moduleSourcesTrusted()
        //this.moduleMachineid()
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
        this.moduleSourcesTrustedUnmount()
        this.moduleSourcesFinal()
        this.moduleUmount()
    }


    /**
     * ========================================================================
     * module = name + '.conf0
     * shellprocess = 'shellprocess_' + name + '.conf'
     * contextualprocess = name + '_context.conf'
     * 
     * module_calamares
     *                      dir = '/usr/lib/calamares/modules/' + name
     *                      name = module.desc
     *                      script = 
     * ========================================================================
     */

    /**
     * write module
     * @param name 
     * @param content 
     */
    module(name: string, content: string) {
        const dir = `/etc/calamares/modules/`
        const file = dir + name + '.conf'
        write(file, content, this.verbose)
    }

    /**
     * write shellprocess
     * @param name 
     */
    shellprocess(name: string) {
        let content = ''
        const dir = `/etc/calamares/modules/`
        let file = dir + 'shellprocess_' + name + '.conf'
        write(file, content, this.verbose)
    }

    /**
     * write contextualprocess
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
            defaultGroups: [
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
        const removeuser = yaml.safeDump({ username: this.user_opt })
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
        const name = 'sources-trusted'
        const dir = this.dirGlobalModules + name + `/`
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }

        const descSourcesTrusted = require(`./calamares-modules/desc/${name}`).sourcesTrusted
        write(dir + 'module.desc', descSourcesTrusted(), this.verbose)

        const bashSourcesTrusted = require(`./calamares-modules/scripts/${name}`).sourcesTrusted
        const bashFile = `/usr/sbin/${name}`
        write(bashFile, bashSourcesTrusted(), this.verbose)
        await exec(`chmod +x ${bashFile}`)
    }

    /**
     * 
     */
    async moduleCreateTmp() {
        const name = 'create-tmp'
        const dir = this.dirGlobalModules + name + `/`
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }

        const descCreateTmp = require(`./calamares-modules/desc/${name}`).createTmp
        write(dir + 'module.desc', descCreateTmp(), this.verbose)

        const bashCreateTmp = require(`./calamares-modules/scripts/${name}`).createTmp
        const scriptFile = `/usr/sbin/${name}`
        write(scriptFile, bashCreateTmp(), this.verbose)
        await exec(`chmod +x ${scriptFile}`)
    }

    /**
     *
     */
    async moduleBootloaderConfig() {
        const name = 'bootloader-config'
        const dir = this.dirGlobalModules + name + `/`
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }

        const descBootloaderConfig = require('./calamares-modules/desc/bootloader-config').bootloaderConfig
        write(dir + 'module.desc', descBootloaderConfig(), this.verbose)

        const bashBootloaderConfig = require(`./calamares-modules/scripts/${name}`).bootloaderConfig
        const scriptFile = `/usr/sbin/${name}`
        write(scriptFile, bashBootloaderConfig(), this.verbose)
        await exec(`chmod +x ${scriptFile}`)
    }

    /**
     *
     */
    moduleSourcesTrustedUnmount() {
        const name = 'sources-trusted-unmount'
        const dir = this.dirGlobalModules + name + `/`
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }

        const descSourcesTrustedUnmount = require(`./calamares-modules/desc/${name}`).sourcesTrustedUnmount
        write(dir + 'module.desc', descSourcesTrustedUnmount(), this.verbose)

        if (this.verbose) { console.log(`calamares: module ${name} use the same script of source-trusted`) }
    }

    /**
     *
     */
    async moduleSourcesFinal() {
        const name = 'sources-final'
        const dir = this.dirGlobalModules + name + `/`
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }

        const descSourcesFinal = require(`./calamares-modules/desc/${name}`).sourcesFinal
        write(dir + 'module.desc', descSourcesFinal(), this.verbose)

        const bashSourcesFinal = require(`./calamares-modules/scripts/${name}`).sourcesFinal
        const bashFile = `/usr/sbin/${name}`
        write(bashFile, bashSourcesFinal(), this.verbose)
        await exec(`chmod +x ${bashFile}`)
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
