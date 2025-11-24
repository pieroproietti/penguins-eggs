/**
 * ./src/classes/ovary.d/edit-live-fs.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'
import os from 'os'
import path from 'node:path'
import shx from 'shelljs'

// classes
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import Pacman from '../pacman.js'
import Systemctl from '../systemctl.js'

import { exec } from '../../lib/utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * editLiveFs
 * - Mark if is_clone or is_clone_crypted
 * - Truncate logs, remove archived log
 * - Allow all fixed drives to be mounted with pmount
 * - Enable or disable password login trhough ssh for users (not root)
 * - Create an empty /etc/fstab
 * - Blanck /etc/machine-id
 * - Add some basic files to /dev
 * - Clear configs from /etc/network/interfaces, wicd and NetworkManager and netman
 */
export async function editLiveFs(this: Ovary, clone = false) {
    if (this.verbose) {
        console.log('Ovary: editLiveFs')
    }

    const workDir = this.settings.work_dir.merged

    /**
     * /etc/penguins-eggs.d/is_clone file created on live
     */
    if (clone) {
        await exec(`touch ${workDir}/etc/penguins-eggs.d/is_clone`, this.echo)
    }

    /**
     * /etc/default/epoptes-client created on live
     */
    if (Pacman.packageIsInstalled('epoptes')) {
        const file = `${workDir}/etc/default/epoptes-client`
        const text = `SERVER=${os.hostname}.local\n`
        fs.writeFileSync(file, text)
    }

    if (this.familyId === 'debian') {
        // Aggiungo UMASK=0077 in /etc/initramfs-tools/conf.d/calamares-safe-initramfs.conf
        const text = 'UMASK=0077\n'
        const file = '/etc/initramfs-tools/conf.d/eggs-safe-initramfs.conf'
        Utils.write(file, text)
    }

    // Truncate logs, remove archived logs.
    let cmd = `find ${workDir}/var/log -name "*gz" -print0 | xargs -0r rm -f`
    await exec(cmd, this.echo)
    cmd = `find ${workDir}/var/log/ -type f -exec truncate -s 0 {} \\;`
    await exec(cmd, this.echo)

    // =========================================================================
    // FIX STRUTTURALE PER DEVUAN/DEBIAN (/var folders)
    // =========================================================================
    // Ricrea le directory essenziali che potrebbero essere state rimosse
    // o che devono esistere vuote per il corretto avvio dei servizi.
    const dirsToCreate = [
        `${workDir}/var/lib/dbus`,           // Fondamentale per dbus
        `${workDir}/var/spool/rsyslog`,      // Fondamentale per rsyslog
        `${workDir}/var/spool/cron/crontabs` // Fondamentale per cron
    ]

    for (const dir of dirsToCreate) {
        if (!fs.existsSync(dir)) {
            await exec(`mkdir -p ${dir}`, this.echo)
            // Assicuriamo permessi corretti (dbus vuole 755 root:root di base)
            await exec(`chmod 755 ${dir}`, this.echo)
        }
    }

    // =========================================================================
    // FIX CRITICO PER /var/run e /var/lock
    // =========================================================================
    // Su Debian/Devuan moderni, /var/run DEVE essere un symlink a /run.
    // Se rsync lo ha copiato come directory, D-Bus e altri servizi falliscono.
    const varRun = `${workDir}/var/run`
    if (fs.existsSync(varRun) && !fs.lstatSync(varRun).isSymbolicLink()) {
         if (this.verbose) console.log('Fixing /var/run symlink...');
         await exec(`rm -rf ${varRun}`, this.echo)
         await exec(`ln -s /run ${varRun}`, this.echo)
    }

    const varLock = `${workDir}/var/lock`
    if (fs.existsSync(varLock) && !fs.lstatSync(varLock).isSymbolicLink()) {
         if (this.verbose) console.log('Fixing /var/lock symlink...');
         await exec(`rm -rf ${varLock}`, this.echo)
         await exec(`ln -s /run/lock ${varLock}`, this.echo)
    }
    // =========================================================================


    // Allow all fixed drives to be mounted with pmount
    if (this.settings.config.pmount_fixed && fs.existsSync(`${workDir}/etc/pmount.allow`)) {
        // MX aggiunto /etc
        await exec(`sed -i 's:#/dev/sd\[a-z\]:/dev/sd\[a-z\]:' ${workDir}/etc/pmount.allow`, this.echo)
    }

    // Remove obsolete live-config file
    if (fs.existsSync(`${workDir}lib/live/config/1161-openssh-server`)) {
        await exec(`rm -f ${workDir}/lib/live/config/1161-openssh-server`, this.echo)
    }

    if (fs.existsSync(`${workDir}/etc/ssh/sshd_config`)) {
        /**
         * enable/disable SSH root/users password login
         */
        await exec(`sed -i '/PermitRootLogin/d' ${workDir}/etc/ssh/sshd_config`)
        await exec(`sed -i '/PasswordAuthentication/d' ${workDir}/etc/ssh/sshd_config`)
        if (this.settings.config.ssh_pass) {
            await exec(`echo 'PasswordAuthentication yes' | tee -a ${workDir}/etc/ssh/sshd_config`, this.echo)
        } else {
            await exec(`echo 'PermitRootLogin prohibit-password' | tee -a ${workDir}/etc/ssh/sshd_config`, this.echo)
            await exec(`echo 'PasswordAuthentication no' | tee -a ${workDir}/etc/ssh/sshd_config`, this.echo)
        }
    }

    /**
     * /etc/fstab should exist, even if it's empty,
     * to prevent error messages at boot
     */
    await exec(`rm ${workDir}/etc/fstab`, this.echo)
    await exec(`touch ${workDir}/etc/fstab`, this.echo)

    /**
     * Remove crypttab if exists
     * this is crucial for tpm systems.
     */
    if (fs.existsSync(`${workDir}/etc/crypttab`)) {
        await exec(`rm ${workDir}/etc/crypttab`, this.echo)
    }

    // =========================================================================
    // FIX MACHINE-ID (Il colpevole del blocco SysVinit)
    // =========================================================================
    /**
     * Blank out systemd machine id.
     * SU SYSTEMD: File vuoto = rigenerazione.
     * SU SYSVINIT (Devuan): File NON deve esistere o deve essere 0 bytes.
     * MAI scrivere ':' o altri caratteri dentro.
     */
    
    // 1. Pulisci /etc/machine-id
    if (fs.existsSync(`${workDir}/etc/machine-id`)) {
        await exec(`rm ${workDir}/etc/machine-id`, this.echo)
        // Per Systemd serve il file vuoto per fare il bind mount
        // Per Devuan va bene vuoto (lo riempie dbus-uuidgen)
        await exec(`touch ${workDir}/etc/machine-id`, this.echo)
    }

    // 2. Rimuovi /var/lib/dbus/machine-id
    // Questo è il file "vero" per dbus su sistemi non-systemd.
    // Deve sparire per essere rigenerato al boot.
    if (fs.existsSync(`${workDir}/var/lib/dbus/machine-id`)) {
        await exec(`rm ${workDir}/var/lib/dbus/machine-id`, this.echo)
    }
    // =========================================================================

    /**
     * LMDE4: utilizza UbuntuMono16.pf2
     * aggiungo un link a /boot/grub/fonts/UbuntuMono16.pf2
     */
    if (fs.existsSync(`${workDir}/boot/grub/fonts/unicode.pf2`)) {
        shx.cp(`${workDir}/boot/grub/fonts/unicode.pf2`, `${workDir}/boot/grub/fonts/UbuntuMono16.pf2`)
    }

    /**
     * cleaning /etc/resolv.conf
     */
    const resolvFile = `${workDir}/etc/resolv.conf`
    shx.rm(resolvFile)

    /**
     * Per tutte le distro systemd
     */
    if (Utils.isSystemd()) {
        const systemdctl = new Systemctl(this.verbose)

        /*
        * Arch: /ci/minimal/arch-minimal.sh:
        * systemctl set-default multi-user.target
        * systemctl enable getty@tty1.service
        * systemctl enable systemd-networkd.service
        * systemctl enable 'systemd-resolved.service        
        */

        if (await systemdctl.isEnabled('remote-cryptsetup.target')) {
            await systemdctl.disable('remote-cryptsetup.target', workDir, true)
        }

        if (await systemdctl.isEnabled('speech-dispatcherd.service')) {
            await systemdctl.disable('speech-dispatcherd.service', workDir, true)
        }

        if (await systemdctl.isEnabled('wpa_supplicant-nl80211@.service')) {
            await systemdctl.disable('wpa_supplicant-nl80211@.service', workDir, true)
        }

        if (await systemdctl.isEnabled('wpa_supplicant@.service')) {
            await systemdctl.disable('wpa_supplicant@.service', workDir, true)
        }

        if (await systemdctl.isEnabled('wpa_supplicant-wired@.service')) {
            await systemdctl.disable('wpa_supplicant-wired@.service', workDir, true)
        }

        /**
         * All systemd distros
         */
        await exec(`rm -f ${workDir}/var/lib/wicd/configurations/*`, this.echo)
        await exec(`rm -f ${workDir}/etc/wicd/wireless-settings.conf`, this.echo)
        await exec(`rm -f ${workDir}/etc/NetworkManager/system-connections/*`, this.echo)
        await exec(`rm -f ${workDir}/etc/network/wifi/*`, this.echo)
        /**
         * removing from /etc/network/:
         * if-down.d if-post-down.d if-pre-up.d if-up.d interfaces interfaces.d
         */
        const cleanDirs = ['if-down.d', 'if-post-down.d', 'if-pre-up.d', 'if-up.d', 'interfaces.d']
        let cleanDir = ''
        for (cleanDir of cleanDirs) {
            await exec(`rm -f ${workDir}/etc/network/${cleanDir}/wpasupplicant`, this.echo)
        }
    }

    /**
     * Clear configs from /etc/network/interfaces, wicd and NetworkManager
     * and netman, so they aren't stealthily included in the snapshot.
     */
    if (this.familyId === 'debian') {
        if (fs.existsSync(`${workDir}/etc/network/interfaces`)) {
            await exec(`rm -f ${workDir}/etc/network/interfaces`, this.echo)
            Utils.write(`${workDir}/etc/network/interfaces`, 'auto lo\niface lo inet loopback')
        }

        /**
         * add some basic files to /dev
         */
        // Ho condensato i controlli ripetitivi su mknod per leggibilità
        // Nota: Questo è safe da eseguire, anche se devtmpfs solitamente gestisce tutto.
        
        const devNodes = [
            { path: 'console', m: '622', type: 'c', major: 5, minor: 1 },
            { path: 'null',    m: '666', type: 'c', major: 1, minor: 3 },
            { path: 'zero',    m: '666', type: 'c', major: 1, minor: 5 },
            { path: 'ptmx',    m: '666', type: 'c', major: 5, minor: 2 },
            { path: 'tty',     m: '666', type: 'c', major: 5, minor: 0 },
            { path: 'random',  m: '444', type: 'c', major: 1, minor: 8 },
            { path: 'urandom', m: '444', type: 'c', major: 1, minor: 9 },
        ]

        for (const node of devNodes) {
            if (!fs.existsSync(`${workDir}/dev/${node.path}`)) {
                await exec(`mknod -m ${node.m} ${workDir}/dev/${node.path} ${node.type} ${node.major} ${node.minor}`, this.echo)
            }
        }

        if (!fs.existsSync(`${workDir}/dev/{console,ptmx,tty}`)) {
            await exec(`chown -v root:tty ${workDir}/dev/{console,ptmx,tty}`, this.echo)
        }

        // Link simbolici standard
        const links = [
             { src: '/proc/self/fd', dest: 'fd' },
             { src: '/proc/self/fd/0', dest: 'stdin' },
             { src: '/proc/self/fd/1', dest: 'stdout' },
             { src: '/proc/self/fd/2', dest: 'stderr' },
             { src: '/proc/kcore', dest: 'core' }
        ];

        for (const link of links) {
            if (!fs.existsSync(`${workDir}/dev/${link.dest}`)) {
                await exec(`ln -sv ${link.src} ${workDir}/dev/${link.dest}`, this.echo)
            }
        }

        if (!fs.existsSync(`${workDir}/dev/shm`)) {
            await exec(`mkdir -v ${workDir}/dev/shm`, this.echo)
        }

        if (!fs.existsSync(`${workDir}/dev/pts`)) {
            await exec(`mkdir -v ${workDir}/dev/pts`, this.echo)
        }

        if (!fs.existsSync(`${workDir}/dev/shm`)) {
            await exec(`chmod 1777 ${workDir}/dev/shm`, this.echo)
        }

        /**
         * creo /tmp
         */
        if (!fs.existsSync(`${workDir}/tmp`)) {
            await exec(`mkdir ${workDir}/tmp`, this.echo)
        }

        /**
         * Assegno 1777 a /tmp creava problemi con MXLINUX
         */
        await exec(`chmod 1777 ${workDir}/tmp`, this.echo)
    }
}