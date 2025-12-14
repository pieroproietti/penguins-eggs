/**
 * ./src/classes/ovary.d/edit-live-fs.ts
 * penguins-eggs v.25.12.5 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'node:path'
import {shx} from '../../lib/utils.js'

// classes
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import Pacman from '../pacman.js'
import Systemctl from '../systemctl.js'

import { exec } from '../../lib/utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

export async function editLiveFs(this: Ovary) {
    if (this.verbose) console.log('Ovary: editLiveFs')

    const workDir = this.settings.work_dir.merged

    if (this.clone || this.homecrypt || this.fullcrypt) {
        await exec(`touch ${workDir}/etc/penguins-eggs.d/is_clone`, this.echo)
    }

    if (Pacman.packageIsInstalled('epoptes')) {
        const file = `${workDir}/etc/default/epoptes-client`
        const text = `SERVER=${os.hostname}.local\n`
        fs.writeFileSync(file, text)
    }

    if (this.familyId === 'debian') {
        const text = 'UMASK=0077\n'
        const file = '/etc/initramfs-tools/conf.d/eggs-safe-initramfs.conf'
        Utils.write(file, text)
    }

    // Truncate logs
    let cmd = `find ${workDir}/var/log -name "*gz" -print0 | xargs -0r rm -f`
    await exec(cmd, this.echo)
    cmd = `find ${workDir}/var/log/ -type f -exec truncate -s 0 {} \\;`
    await exec(cmd, this.echo)

    // Fix Symlinks /var/run e /var/lock
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

    // Altri fix standard
    if (this.settings.config.pmount_fixed && fs.existsSync(`${workDir}/etc/pmount.allow`)) {
        await exec(`sed -i 's:#/dev/sd\[a-z\]:/dev/sd\[a-z\]:' ${workDir}/etc/pmount.allow`, this.echo)
    }

    if (fs.existsSync(`${workDir}lib/live/config/1161-openssh-server`)) {
        await exec(`rm -f ${workDir}/lib/live/config/1161-openssh-server`, this.echo)
    }

    if (fs.existsSync(`${workDir}/etc/ssh/sshd_config`)) {
        await exec(`sed -i '/PermitRootLogin/d' ${workDir}/etc/ssh/sshd_config`)
        await exec(`sed -i '/PasswordAuthentication/d' ${workDir}/etc/ssh/sshd_config`)
        if (this.settings.config.ssh_pass) {
            await exec(`echo 'PasswordAuthentication yes' | tee -a ${workDir}/etc/ssh/sshd_config`, this.echo)
        } else {
            await exec(`echo 'PermitRootLogin prohibit-password' | tee -a ${workDir}/etc/ssh/sshd_config`, this.echo)
            await exec(`echo 'PasswordAuthentication no' | tee -a ${workDir}/etc/ssh/sshd_config`, this.echo)
        }
    }

    await exec(`rm ${workDir}/etc/fstab`, this.echo)
    await exec(`touch ${workDir}/etc/fstab`, this.echo)

    if (fs.existsSync(`${workDir}/etc/crypttab`)) {
        await exec(`rm ${workDir}/etc/crypttab`, this.echo)
    }

    /**
     * machine-id
     */
    await exec(`rm -f ${workDir}/etc/machine-id`)
    await exec(`rm -f ${workDir}/var/lib/dbus/machine-id`)
    if (Utils.isSysvinit()) {
        const machineId = crypto.randomBytes(16).toString('hex')
        fs.writeFileSync(`${workDir}/etc/machine-id`, machineId + '\n')
        fs.writeFileSync(`${workDir}/var/lib/dbus/machine-id`, machineId + '\n')
    } else if (Utils.isSystemd()) {
        await exec(`touch ${workDir}/etc/machine-id`)
    }


    if (fs.existsSync(`${workDir}/boot/grub/fonts/unicode.pf2`)) {
        shx.cp(`${workDir}/boot/grub/fonts/unicode.pf2`, `${workDir}/boot/grub/fonts/UbuntuMono16.pf2`)
    }

    shx.rm(`${workDir}/etc/resolv.conf`)

    // Systemd cleanup
    if (Utils.isSystemd()) {
        const systemdctl = new Systemctl(this.verbose)
        if (await systemdctl.isEnabled('remote-cryptsetup.target')) await systemdctl.disable('remote-cryptsetup.target', workDir, true)
        if (await systemdctl.isEnabled('speech-dispatcherd.service')) await systemdctl.disable('speech-dispatcherd.service', workDir, true)
        if (await systemdctl.isEnabled('wpa_supplicant-nl80211@.service')) await systemdctl.disable('wpa_supplicant-nl80211@.service', workDir, true)
        if (await systemdctl.isEnabled('wpa_supplicant@.service')) await systemdctl.disable('wpa_supplicant@.service', workDir, true)
        if (await systemdctl.isEnabled('wpa_supplicant-wired@.service')) await systemdctl.disable('wpa_supplicant-wired@.service', workDir, true)

        await exec(`rm -f ${workDir}/var/lib/wicd/configurations/*`, this.echo)
        await exec(`rm -f ${workDir}/etc/wicd/wireless-settings.conf`, this.echo)
        await exec(`rm -f ${workDir}/etc/NetworkManager/system-connections/*`, this.echo)
        await exec(`rm -f ${workDir}/etc/network/wifi/*`, this.echo)
        
        const cleanDirs = ['if-down.d', 'if-post-down.d', 'if-pre-up.d', 'if-up.d', 'interfaces.d']
        for (const cleanDir of cleanDirs) {
            await exec(`rm -f ${workDir}/etc/network/${cleanDir}/wpasupplicant`, this.echo)
        }
    }

    if (this.familyId === 'debian') {
        if (fs.existsSync(`${workDir}/etc/network/interfaces`)) {
            await exec(`rm -f ${workDir}/etc/network/interfaces`, this.echo)
            Utils.write(`${workDir}/etc/network/interfaces`, 'auto lo\niface lo inet loopback')
        }

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

        if (!fs.existsSync(`${workDir}/dev/console`)) {
             await exec(`chown -v root:tty ${workDir}/dev/{console,ptmx,tty}`, this.echo)
        }

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

        if (!fs.existsSync(`${workDir}/dev/shm`)) await exec(`mkdir -v ${workDir}/dev/shm`, this.echo)
        if (!fs.existsSync(`${workDir}/dev/pts`)) await exec(`mkdir -v ${workDir}/dev/pts`, this.echo)
        await exec(`chmod 1777 ${workDir}/dev/shm`, this.echo)

        if (!fs.existsSync(`${workDir}/tmp`)) await exec(`mkdir ${workDir}/tmp`, this.echo)
        await exec(`chmod 1777 ${workDir}/tmp`, this.echo)
    }
}
