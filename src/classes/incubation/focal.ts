/**
 * penguins-eggs: focal.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import fs = require('fs')
import yaml = require('js-yaml')
import { IRemix, IDistro } from '../../interfaces'
const exec = require('../../lib/utils').exec

/**
 * 
 */
export class Focal {
    verbose = false

    remix: IRemix

    distro: IDistro

    displaymanager = false

    sourcesTrusted = true

    dir = '/etc/calamares/'

    dirLocalModules = '/etc/calamares/modules/'
    
    dirGlobalModules = '/usr/lib/x86_64-linux-gnu/calamares/modules/'

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
        const file = this.dir + 'settings.conf'
        const content = this.getSettings()
        write(file, content, this.verbose)
    }

    /**
     * 
     */
    getSettings(): string {

        // path di ricerca dei moduli
        const modulesSearch: string[] = ['local']
        // ,'/usr/lib/x86_64-linux-gnu/calamares/modules/'

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
                "id": "logs",
                "module": "shellprocess",
                "config": "shellprocess_logs.conf"
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
        const show: string[] = ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary']

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
        if (this.displaymanager){
            exec.push('displaymanager')
        }
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
        // exec.push("shellprocess@logs")
        exec.push("umount")

        const settings = {
            'modules-search': modulesSearch,
            'instances': instances,
            'sequence': [{ show: show }, { exec: exec }, { show: ['finished'] }],
            'branding': this.remix.branding,
            'prompt-install': true,
            'dont-chroot': false,
            'oem-setup': false,
            'disable-cancel': false,
            'disable-cancel-during-exec': false
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
        this.moduleMachineid()
        this.moduleFstab()
        this.moduleLocale()
        this.moduleKeyboard()
        this.moduleLocalecfg()
        this.moduleLuksbootkeyfile()
        this.moduleUsers()
        this.moduleDisplaymanager()
        this.moduleNetworkcfg()
        this.moduleHwclock()
        this.contextualprocess('before_bootloader_mkdirs')
        this.shellprocess('bug-LP#1829805')
        this.moduleInitramfscfg()
        this.moduleInitramfs()
        this.moduleGrubcfg()
        this.contextualprocess('before_bootloader')
        this.moduleBootloader()
        this.contextualprocess('after_bootloader')
        this.moduleAutomirror()
        this.shellprocess("add386arch")
        this.modulePackages()
        //this.shellprocess("logs")
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
        const file = this.dirLocalModules + name + '.conf'
        write(file, content, this.verbose)
    }

    /**
     * 
     * @param process 
     */
    shellprocess(name: string) {
        let text = ''
        if (name === 'bug-LP#1829805') {
            text += '---\n'
            text += 'dontChroot: false\n'
            text += 'timeout: 30\n'
            text += 'script:\n'
            text += '- "touch @@ROOT@@/boot/initrd.img-$(uname -r)"\n'
        } else if (name === 'add386arch') {
            text += '---\n'
            text += 'dontChroot: false\n'
            text += 'timeout: 30\n'
            text += 'script:\n'
            text += '- command: "/usr/bin/dpkg --add-architecture i386"\n'
        } else if (name === 'logs') {
            text += '---\n'
            text += 'dontChroot: true\n'
            text += 'timeout: 30\n'
            text += 'script:\n'
            text += '    - calamares-logs-helper @@ROOT@@\n'
        }
        let file = this.dirLocalModules + 'shellprocess_' + name + '.conf'
        let content = text
        write(file, content, this.verbose)
    }

    /**
     * 
     * @param process 
     */
    contextualprocess(name: string) {
        let text = ''
        if (name === 'before_bootloader_mkdirs') {
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
        } else if (name === 'before_bootloader') {
            text += '# Make sure the correct bootloader package is installed for EFI.\n'
            text += '# Also pull in shim so secureboot has a chance at working.\n'
            text += '# Because of edge cases, we ignore BIOS, and do the same\n'
            text += '# procedure for all EFI types.\n'
            text += '---\n'
            text += 'firmwareType:\n'
            text += '    bios:    "-/bin/true"\n'
            text += '    "*":\n'
            text += '        -    command: apt-cdrom add -m -d=/media/cdrom/\n'
            text += '             timeout: 10\n'
            text += '        -    command: sed -i \' / deb http / d\' /etc/apt/sources.list\n'
            text += '             timeout: 10\n'
            text += '        -    command: apt-get update\n'
            text += '             timeout: 120\n'
            text += '        -    command: apt install -y --no-upgrade -o Acquire::gpgv::Options::=--ignore-time-conflict grub-efi-$(if grep -q 64 /sys/firmware/efi/fw_platform_size; then echo amd64-signed; else echo ia32; fi)\n'
            text += '             timeout: 300\n'
            text += '        -    command: apt install -y --no-upgrade -o Acquire::gpgv::Options::=--ignore-time-conflict shim-signed\n'
            text += '             timeout: 300\n'
        } else if (name === 'after_bootloader') {
            text += '# Workaround from ubiquity. Ubuntu\'s grub will want to look in EFI / ubuntu, so\n'
            text += '# let\'s make sure it can find something there.\n'
            text += '# This only copies the cfg and doesn\'t overwrite, this is specifically so\n'
            text += '# this doesn\'t interfere with an Ubuntu installed on the system already.\n'
            text += '---\n'
            text += 'dontChroot: false\n'
            text += 'timeout: 120\n'
            text += 'firmwareType:\n'
            text += '"*": "-for i in `ls @@ROOT@@/home/`; do rm @@ROOT@@/home/$i/Desktop/lubuntu-calamares.desktop || exit 0; done"\n'
        }
        let content = text
        let file = this.dirLocalModules + name + '_context' + '.conf'
        write(file, content, this.verbose)
    }

    /**
     *
     */
    modulePartition() {
        const partition = yaml.safeDump({
            efiSystemPartition: "/boot/efi",
            enableLuksAutomatedPartitioning: true,
            userSwapChoices: "none",
            drawNestedPartitions: true,
            defaultFileSystemType: "ext4"
        })
        this.module('partition', partition)
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
            'systemd': true,
            'dbus': true,
            'dbus-symlink': true
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
        const displaymanager_not_used =  yaml.safeDump({
            displaymanager: "lightdm",
            basicSetup: false,
            sysconfigSetup: false
        })

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

    moduleLuksbootkeyfile() { if (this.verbose) console.log(`calamares: module luksbootkeyfile. Nothing to do!`) }

    /**
     *
     */
    module_luksopenswaphookcfg() {
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
     * Automirror
     * Pythonm
     */
    async moduleAutomirror() {
        const name = 'automirror'
        const dirModule = this.dirGlobalModules + name + '/'
        if (!fs.existsSync(dirModule)) {
            fs.mkdirSync(dirModule)
        }

        const automirror = yaml.safeDump({
            baseUrl: "archive.ubuntu.com",
            distribution: "Ubuntu",
            geoip: {
                style: "json",
                url: "http  s://ipapi.co/json",
            }
        })
        write(dirModule + 'automirror.conf', automirror, this.verbose)

        // Creo anche un config in local con la distro particolare, esempio: lubuntu, ulyana
        const automirrorModules = yaml.safeDump({
            baseUrl: "archive.ubuntu.com",
            distribution: "Lubuntu",
            geoip: {
                style: "json",
                url: "https://ipapi.co/json",
            }
        })
        write('/etc/calamares/modules/' + 'automirror.conf', automirrorModules)

        // desc
        const desc =  yaml.safeDump({
            type: "job",
            name: "automirror",
            interface: "python",
            script: "main.py"
        })
        write(dirModule + 'module.desc', desc, this.verbose)


        // py
        const scriptAutomirror = require('./calamares-modules/scripts/automirror').automirror
        const scriptFile = dirModule + 'main.py'
        write(scriptFile, scriptAutomirror(this.distro.versionId), this.verbose)
        await exec(`chmod +x ${scriptFile}`)
    }


    async moduleCreatetmp() {
        const name = 'create-tmp'
        const dirModule = this.dirGlobalModules + name+ '/'
        if (!fs.existsSync(dirModule)) {
            fs.mkdirSync(dirModule)
        }

        const createTmp = require('./calamares-modules/desc/create-tmp').createTmp
        write(dirModule + 'module.desc', createTmp(), this.verbose)

        const scriptcreateTmp = require('./calamares-modules/scripts/create-tmp').createTmp
        const scriptFile = `/usr/sbin/${name}`
        write(scriptFile, scriptcreateTmp(), this.verbose)
        await exec(`chmod +x ${scriptFile}`)
    }

    /**
 *
 */
    async moduleBootloaderconfig() {
        const name = 'bootloader-config'
        const dirModule = this.dirGlobalModules + name
        if (!fs.existsSync(dirModule)) {
            fs.mkdirSync(dirModule)
        }

        const bootloaderConfig = require('./calamares-modules/desc/bootloader-config').bootloaderConfig
        write(dirModule + 'module.desc', bootloaderConfig(), this.verbose)

        const scriptBootloaderConfig = require('./calamares-modules/scripts/bootloader-config').bootloaderConfig
        const scriptFile = `/usr/sbin/` + 'bootloader-config'
        write(scriptFile, scriptBootloaderConfig(), this.verbose)
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
    // console.log(content)
    fs.writeFileSync(file, content, 'utf8')
}