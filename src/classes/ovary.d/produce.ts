/**
 * ./src/classes/ovary.d/produce.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import chalk from 'chalk'
import mustache from 'mustache'

// packages
import fs, { Dirent } from 'node:fs'
import { shx } from '../../lib/utils.js'
import path from 'path'

// interfaces
import { IAddons, IExcludes } from '../../interfaces/index.js'

// libraries
import { exec } from '../../lib/utils.js'
import Bleach from './../bleach.js'
import Incubator from './../incubation/incubator.js'
import Pacman from './../pacman.js'
import Diversions from './../diversions.js'

// classes
import Utils from './../utils.js'
import Repo from './../yolk.js'
import Ovary from './../ovary.js'

import { CryptoConfig } from './luks-interactive-crypto-config.js'
import e from 'express'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * produce
 * @param clone
 * @param homecrypt
 * @param scriptOnly
 * @param yolkRenew
 * @param release
 * @param myAddons
 * @param nointeractive
 * @param noicons
 * @param includeRootHome
 * @param verbose
 */
export async function produce(
    this: Ovary,
    kernel = '',
    clone = false,
    homecrypt = false,
    fullcrypt = false,
    hidden = false,
    scriptOnly = false,
    yolkRenew = false,
    release = false,
    myAddons: IAddons,
    myLinks: string[],
    excludes: IExcludes,
    nointeractive = false,
    noicons = false,
    includeRootHome = false,
    verbose = false) {

    this.verbose = verbose
    this.echo = Utils.setEcho(verbose)
    if (this.verbose) {
        this.toNull = ' > /dev/null 2>&1'
    }

    this.kernel = kernel
    this.nest = this.settings.config.snapshot_dir
    this.dotMnt = `${this.nest}.mnt`
    this.dotOverlay = this.settings.work_dir
    this.dotLivefs = this.settings.work_dir.merged

    this.clone = clone
    this.homecrypt = homecrypt
    this.fullcrypt = fullcrypt
    this.hidden = hidden

    // Crittografia
    if (this.homecrypt || this.fullcrypt) {
        if (this.homecrypt) {
            this.luksMappedName = 'home.img'
        } else if (this.fullcrypt) {
            this.luksMappedName = 'root.img'
        }

        this.luksFile = `/tmp/${this.luksMappedName}`
        this.luksMappedName = this.luksMappedName
        this.luksMountpoint = `/tmp/mnt/${this.luksMappedName}`
        this.luksDevice = `/dev/mapper/${this.luksMappedName}`
        this.luksPassword = '0' // USARE UNA PASSWORD SICURA IN PRODUZIONE!


        this.luksConfig = await this.interactiveCryptoConfig()

        Utils.warning("You choose an encrypted eggs")
        await this.luksGetPassword()
    }

    /**
     * define kernel
     */
    if (this.kernel === '') {
        if (this.familyId === 'alpine') {
            const moduleDirs = fs.readdirSync('/lib/modules')
            this.kernel = moduleDirs[0]

        } else if (this.familyId === 'archlinux') { // arch, manjaro
            const moduleDirs = fs.readdirSync('/usr/lib/modules')
            this.kernel = moduleDirs[0]

        } else { // debian, fedora, openmamba, opensuse, voidlinux
            let vmlinuz = path.basename(Utils.vmlinuz())
            this.kernel = vmlinuz.substring(vmlinuz.indexOf('-') + 1)
        }
    }

    /**
     * define vmlinuz and initrd fullpath
     */
    this.vmlinuz = Utils.vmlinuz()
    this.initrd = Utils.initrdImg(this.kernel)


    /**
     * yolk
     */
    if (this.familyId === 'debian' && Utils.uefiArch() === 'amd64') {
        const yolk = new Repo()
        if (!yolk.exists()) {
            Utils.warning('creating yolk')
            await yolk.create(verbose)
        } else if (yolkRenew) {
            Utils.warning('refreshing yolk')
            await yolk.erase()
            await yolk.create(verbose)
        } else {
            Utils.warning('using preesixent yolk')
        }
    }

    if (!fs.existsSync(this.settings.config.snapshot_dir)) {
        shx.mkdir('-p', this.settings.config.snapshot_dir)
    }

    if (Utils.isLive()) {
        console.log(chalk.red('>>> eggs: This is a live system! An egg cannot be produced from an egg!'))
    } else {

        await this.liveCreateStructure()

        // Carica calamares solo se le icone sono accettate
        if (
            !noicons && // se VOGLIO le icone
            !nointeractive &&
            this.settings.distro.isCalamaresAvailable &&
            Pacman.isInstalledGui() &&
            this.settings.config.force_installer &&
            !Pacman.calamaresExists()
        ) {
            console.log('Installing ' + chalk.bgGray('calamares') + ' due force_installer=yes.')
            await Pacman.calamaresInstall(verbose)
            const bleach = new Bleach()
            await bleach.clean(verbose)
        }

        /**
         * homecrypt/fullcrypt/clone/standard
         */
        if (this.homecrypt) {
            Utils.warning("eggs will SAVE users and users' data ENCRYPTED on the live (ISO)/live/home.img")

        } else if (this.fullcrypt) {
            Utils.warning("eggs will SAVE full system ENCRYPTED on the live (ISO)/live/root.img")

        } else if (this.clone) {
            this.settings.config.user_opt = 'live' // patch for humans
            this.settings.config.user_opt_passwd = 'evolution'
            this.settings.config.root_passwd = 'evolution'
            Utils.warning("eggs will SAVE users and users' data on CLEAR on the live (ISO)/live/filesystem.squashfs")

        } else {
            Utils.warning("eggs will REMOVE users and users' data from live")
        }

        /**
         * exclude.list
         */
        if (!excludes.static && !fs.existsSync('/etc/penguins-eggs/exclude.list')) {
            const excludeListTemplateDir = '/etc/penguins-eggs.d/exclude.list.d/'
            const excludeListTemplate = excludeListTemplateDir + 'master.list'
            if (!fs.existsSync(excludeListTemplate)) {
                Utils.warning('Cannot find: ' + excludeListTemplate)
                process.exit(1)
            }

            let excludeUsr = ''
            let excludeVar = ''
            let excludeHomes = ''
            let excludeHome = ''

            if (excludes.usr) {
                excludeUsr = fs.readFileSync(`${excludeListTemplateDir}usr.list`, 'utf8')
            }

            if (excludes.var) {
                excludeVar = fs.readFileSync(`${excludeListTemplateDir}var.list`, 'utf8')
            }

            if (excludes.homes) {
                excludeHomes = fs.readFileSync(`${excludeListTemplateDir}homes.list`, 'utf8')
            }

            if (excludes.home) {
                excludeHome = `home/${await Utils.getPrimaryUser()}/*`
            }

            const view = {
                home_list: excludeHome,
                homes_list: excludeHomes,
                usr_list: excludeUsr,
                var_list: excludeVar
            }
            const template = fs.readFileSync(excludeListTemplate, 'utf8')
            fs.writeFileSync(this.settings.config.snapshot_excludes, mustache.render(template, view))
        }

        /**
         * NOTE: reCreate = false
         *
         * reCreate = false is just for develop
         * put reCreate = true in release
         */
        const reCreate = true
        let mksquashfsCmd = ''
        if (reCreate) {
            // start pre-clone

            /**
             * installer
             */
            this.incubator = new Incubator(
                this.settings.remix,
                this.settings.distro,
                this.settings.config.user_opt,
                this.theme,
                this.clone || this.fullcrypt || this.homecrypt,
                verbose)

            await this.incubator.config(release)

            // 5 secondi di sleep
            await Utils.sleep(5000)

            await this.bindLiveFs()
            await this.bindVfs()

            /**
             * kernelCopy
             */
            await this.kernelCopy()

            /**
             * initrd creation
             */
            if (fullcrypt) {
                await this.luksRootInitrd()
            } else {
                if (this.familyId === 'alpine') {
                    await this.initrdAlpine()
                } else if (this.familyId === 'archlinux') {
                    await this.initrdArch()
                } else if (this.familyId === 'debian') {
                    await this.initrdDebian()
                } else if (this.familyId === 'fedora' ||
                    this.familyId === 'openmamba' ||
                    this.familyId === 'opensuse' ||
                    this.familyId === 'voidlinux') {
                    await this.initrdDracut()
                }
            }

            // We don't need more
            await this.ubindVfs()

            // mistero della Fede
            await this.editLiveFs()

            /**
             * Autologin solse per non clone
             */
            if (!(this.clone || this.homecrypt || this.fullcrypt)) {
                await this.usersRemove()
                await this.userCreateLive()
                if (Pacman.isInstalledGui()) {
                    // add GUI autologin
                    await this.createXdgAutostart(
                        this.settings.config.theme,
                        myAddons,
                        myLinks,
                        noicons
                    )
                } else {
                    // add cli-autologin
                    this.cliAutologin.add(
                        this.settings.distro.distroId,
                        this.settings.distro.codenameId,
                        this.settings.config.user_opt,
                        this.settings.config.user_opt_passwd,
                        this.settings.config.root_passwd,
                        this.settings.work_dir.merged)
                }
            }

            if (this.homecrypt) {
                // Occorre forzare il login CLI
                if (Utils.isSystemd()) {
                    const systemdDir = `${this.settings.work_dir.merged}/etc/systemd/system`

                    // remove eventuali autologin
                    if (fs.existsSync(`${systemdDir}/getty@tty1.service.d`)) {
                        await exec(`rm -rf ${systemdDir}/getty@tty1.service.d/*`)
                    } else {
                        await exec(`mkdir -p ${systemdDir}/getty@tty1.service.d`)
                    }

                    let content = ``
                    content += `[Service]\n`
                    content += `ExecStart=\n`
                    content += `ExecStart=-/sbin/agetty -o '-p -- \\u' --noclear %I \$TERM\n`
                    fs.writeFileSync(`${systemdDir}/getty@tty1.service.d/no-autologin.conf`, content)

                } else if (Utils.isSysvinit()) {
                    const inittabPath = `${this.settings.work_dir.merged}/etc/inittab`

                    // Verifica se inittab esiste (dovrebbe sempre esserci in sysvinit)
                    if (fs.existsSync(inittabPath)) {
                        let content = fs.readFileSync(inittabPath, 'utf-8')

                        // REGEX: Cerca una riga che inizia con "1:" (l'ID per tty1), 
                        // seguita da qualsiasi cosa fino alla fine della riga.
                        // Il flag 'm' (multiline) è fondamentale.
                        const tty1Regex = /^1:.*$/m

                        // REPLACEMENT: La configurazione standard di Debian/SysVinit.
                        // 1       = ID
                        // 2345    = Runlevels
                        // respawn = Riavvia il processo se muore
                        // /sbin/getty 38400 tty1 = Il comando standard che chiede il login
                        const standardGetty = '1:2345:respawn:/sbin/getty 38400 tty1'

                        if (tty1Regex.test(content)) {
                            // Sostituisce la riga (che potrebbe avere l'autologin) con quella standard
                            content = content.replace(tty1Regex, standardGetty)
                        } else {
                            // Caso raro: se non c'è la riga per tty1, la aggiungiamo in fondo
                            content += `\n${standardGetty}\n`
                        }

                        fs.writeFileSync(inittabPath, content)
                    }
                }
                /**
                 * homecrypt: installa il supporto 
                 */
                const squashfsRoot = this.settings.work_dir.merged
                const homeImgPath = this.distroLiveMediumPath + 'live/home.img'
                this.installHomecryptSupport(squashfsRoot, homeImgPath)

            }


            mksquashfsCmd = await this.makeSquashfs(scriptOnly, includeRootHome)
            await this.uBindLiveFs() // we don't need more
        }


        /**
         * we now work just on ISO and filesystem.squashfs
         */
        if (homecrypt) {
            await this.luksHome()
        } else if (fullcrypt) {
            await this.luksRoot()
        }

        /** 
         * makeEfi and syslinux was moved
         * after luksRoot 
         * to get luks.uuid
         */
        if (this.settings.config.make_efi) {
            await this.makeEfi(this.theme)
        }


        // need syslinux?
        const arch = process.arch
        if (arch === 'ia32' || arch === 'x64') {
            await this.syslinux(this.theme)
        }


        const mkIsofsCmd = (await this.xorrisoCommand(clone, homecrypt, fullcrypt)).replaceAll(/\s\s+/g, ' ')
        this.makeDotDisk(this.volid, mksquashfsCmd, mkIsofsCmd)

        /**
         * AntiX/MX LINUX
         */
        if (fs.existsSync('/etc/antix-version')) {
            let uname = (await exec('uname -r', { capture: true })).data
            uname = uname.replaceAll('\n', '')

            let content = ''
            content = '#!/usr/bin/env bash'
            content += 'mkdir /live/bin -p\n'
            content += '## \n'
            content += '# cp /usr/lib/penguins-eggs/scripts/non-live-cmdline /live/bin -p\n'
            content += '# chmod +x /live/bin/non-live-cmdline\n'
            content += '## \n'
            content += 'mkdir /live/boot-dev/antiX -p\n'
            content += 'ln -s /run/live/medium/live/filesystem.squashfs /live/boot-dev/antiX/linuxfs\n'
            content += `ln -s /run/live/medium/live/initrd.img-${uname} /live/boot-dev/antiX/initrd.gz\n`
            content += `ln -s /run/live/medium/live/vmlinuz-${uname} /live/boot-dev/antiX/vmlinuz\n`
            content += `# md5sum /live/boot-dev/antiX/linuxfs > /live/boot-dev/antiX/linuxfs.md5\n`
            content += `# md5sum /live/boot-dev/antiX/initrd.gz > /live/boot-dev/antiX/initrd.gz.md5\n`
            content += `# md5sum /live/boot-dev/antiX/vmlinuz > /live/boot-dev/antiX/vmlinuz.md5\n`
            content += `# /live/aufs -> /run/live/rootfs/filesystem.squashfs\n`
            content += 'ln -s /run/live/rootfs/filesystem.squashfs /live/aufs\n'
            content += `# use: minstall -no-media-check\n`
            content += 'minstall --no-media-check\n'
            const file = `${this.settings.iso_work}antix-mx-installer`
            fs.writeFileSync(file, content)
            await exec(`chmod +x ${file}`)
        }

        /**
         * patch to emulate miso/archiso on archilinux family
         */
        if (this.familyId === 'archlinux') {
            let filesystemName = `arch/x86_64/airootfs.sfs`
            let hashCmd = 'sha512sum'
            let hashExt = '.sha512'
            if (Diversions.isManjaroBased(this.settings.distro.distroId)) {
                filesystemName = `manjaro/x86_64/livefs.sfs`
                hashCmd = `md5sum`
                hashExt = '.md5'
            }
            await exec(`mkdir ${this.settings.iso_work}${path.dirname(filesystemName)} -p`, this.echo)
            await exec(`ln ${this.settings.iso_work}live/filesystem.squashfs ${this.settings.iso_work}${filesystemName}`, this.echo)

            /**
             * patch 4 mksquashfs
             */
            let fname = `${this.settings.work_dir.ovarium}mksquashfs`
            let content = fs.readFileSync(fname, 'utf8')
            const patched = '# Arch and Manjaro based distro need this link'
            // not need check, is always clean here... but OK
            if (!content.includes(patched)) {
                content += patched + '\n'
                content += `if [ ! -e "${filesystemName}" ]; then\n`
                content += `   ln ${this.settings.iso_work}live/filesystem.squashfs ${this.settings.iso_work}${filesystemName}\n`
                content += `fi\n`
                fs.writeFileSync(fname, content, 'utf8')
            }
        }

        await this.makeIso(mkIsofsCmd, scriptOnly)
    }
}
