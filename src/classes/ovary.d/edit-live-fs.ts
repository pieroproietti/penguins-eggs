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
export async function editLiveFs(this: Ovary, clone = false, cryptedhome = false) {
    if (this.verbose) {
        console.log('Ovary: editLiveFs')
    }

    /**
     * /etc/penguins-eggs.d/is_clone file created on live
     */
    if (clone) {
        await exec(`touch ${this.settings.work_dir.merged}/etc/penguins-eggs.d/is_clone`, this.echo)
    }

    /**
     * /etc/penguins-eggs.d/is_crypted_clone file created on live
     */
    if (cryptedhome) {
        await exec(`touch ${this.settings.work_dir.merged}/etc/penguins-eggs.d/is_crypted_clone`, this.echo)
    }

    /**
     * /etc/default/epoptes-client created on live
     */
    if (Pacman.packageIsInstalled('epoptes')) {
        const file = `${this.settings.work_dir.merged}/etc/default/epoptes-client`
        const text = `SERVER=${os.hostname}.local\n`
        fs.writeFileSync(file, text)
    }

    if (this.familyId === 'debian') {
        // Aggiungo UMASK=0077 in /etc/initramfs-tools/conf.d/calamares-safe-initramfs.conf
        const text = 'UMASK=0077\n'
        const file = '/etc/initramfs-tools/conf.d/eggs-safe-initramfs.conf'
        Utils.write(file, text)
    }
cryptedhome
    // Truncate logs, remove archived logs.
    let cmd = `find ${this.settings.work_dir.merged}/var/log -name "*gz" -print0 | xargs -0r rm -f`
    await exec(cmd, this.echo)
    cmd = `find ${this.settings.work_dir.merged}/var/log/ -type f -exec truncate -s 0 {} \\;`
    await exec(cmd, this.echo)

    // Allow all fixed drives to be mounted with pmount
    if (this.settings.config.pmount_fixed && fs.existsSync(`${this.settings.work_dir.merged}/etc/pmount.allow`)) {
        // MX aggiunto /etc
        await exec(`sed -i 's:#/dev/sd\[a-z\]:/dev/sd\[a-z\]:' ${this.settings.work_dir.merged}/etc/pmount.allow`, this.echo)
    }

    // Remove obsolete live-config file
    if (fs.existsSync(`${this.settings.work_dir.merged}lib/live/config/1161-openssh-server`)) {
        await exec(`rm -f ${this.settings.work_dir.merged}/lib/live/config/1161-openssh-server`, this.echo)
    }

    if (fs.existsSync(`${this.settings.work_dir.merged}/etc/ssh/sshd_config`)) {
        /**
         * enable/disable SSH root/users password login
         */
        await exec(`sed -i '/PermitRootLogin/d' ${this.settings.work_dir.merged}/etc/ssh/sshd_config`)
        await exec(`sed -i '/PasswordAuthentication/d' ${this.settings.work_dir.merged}/etc/ssh/sshd_config`)
        if (this.settings.config.ssh_pass) {
            await exec(`echo 'PasswordAuthentication yes' | tee -a ${this.settings.work_dir.merged}/etc/ssh/sshd_config`, this.echo)
        } else {
            await exec(`echo 'PermitRootLogin prohibit-password' | tee -a ${this.settings.work_dir.merged}/etc/ssh/sshd_config`, this.echo)
            await exec(`echo 'PasswordAuthentication no' | tee -a ${this.settings.work_dir.merged}/etc/ssh/sshd_config`, this.echo)
        }
    }

    /**
     * ufw --force reset
     */
    // if (Pacman.packageIsInstalled('ufw')) {
    //    await exec('ufw --force reset')
    // }

    /**
     * /etc/fstab should exist, even if it's empty,
     * to prevent error messages at boot
     */
    await exec(`rm ${this.settings.work_dir.merged}/etc/fstab`, this.echo)
    await exec(`touch ${this.settings.work_dir.merged}/etc/fstab`, this.echo)

    /**
     * Remove crypttab if exists
     * this is crucial for tpm systems.
     */
    if (fs.existsSync(`${this.settings.work_dir.merged}/etc/crypttab`)) {
        await exec(`rm ${this.settings.work_dir.merged}/etc/crypttab`, this.echo)
    }

    /**
     * Blank out systemd machine id.
     * If it does not exist, systemd-journald will fail,
     * but if it exists and is empty, systemd will automatically
     * set up a new unique ID.
     */
    if (fs.existsSync(`${this.settings.work_dir.merged}/etc/machine-id`)) {
        await exec(`rm ${this.settings.work_dir.merged}/etc/machine-id`, this.echo)
        await exec(`touch ${this.settings.work_dir.merged}/etc/machine-id`, this.echo)
        Utils.write(`${this.settings.work_dir.merged}/etc/machine-id`, ':')
    }

    /**
     * LMDE4: utilizza UbuntuMono16.pf2
     * aggiungo un link a /boot/grub/fonts/UbuntuMono16.pf2
     */
    if (fs.existsSync(`${this.settings.work_dir.merged}/boot/grub/fonts/unicode.pf2`)) {
        shx.cp(`${this.settings.work_dir.merged}/boot/grub/fonts/unicode.pf2`, `${this.settings.work_dir.merged}/boot/grub/fonts/UbuntuMono16.pf2`)
    }

    /**
     * cleaning /etc/resolv.conf
     */
    const resolvFile = `${this.settings.work_dir.merged}/etc/resolv.conf`
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
            await systemdctl.disable('remote-cryptsetup.target', this.settings.work_dir.merged, true)
        }

        if (await systemdctl.isEnabled('speech-dispatcherd.service')) {
            await systemdctl.disable('speech-dispatcherd.service', this.settings.work_dir.merged, true)
        }

        if (await systemdctl.isEnabled('wpa_supplicant-nl80211@.service')) {
            await systemdctl.disable('wpa_supplicant-nl80211@.service', this.settings.work_dir.merged, true)
        }

        if (await systemdctl.isEnabled('wpa_supplicant@.service')) {
            await systemdctl.disable('wpa_supplicant@.service', this.settings.work_dir.merged, true)
        }

        if (await systemdctl.isEnabled('wpa_supplicant-wired@.service')) {
            await systemdctl.disable('wpa_supplicant-wired@.service', this.settings.work_dir.merged, true)
        }

        /**
         * All systemd distros
         */
        await exec(`rm -f ${this.settings.work_dir.merged}/var/lib/wicd/configurations/*`, this.echo)
        await exec(`rm -f ${this.settings.work_dir.merged}/etc/wicd/wireless-settings.conf`, this.echo)
        await exec(`rm -f ${this.settings.work_dir.merged}/etc/NetworkManager/system-connections/*`, this.echo)
        await exec(`rm -f ${this.settings.work_dir.merged}/etc/network/wifi/*`, this.echo)
        /**
         * removing from /etc/network/:
         * if-down.d if-post-down.d if-pre-up.d if-up.d interfaces interfaces.d
         */
        const cleanDirs = ['if-down.d', 'if-post-down.d', 'if-pre-up.d', 'if-up.d', 'interfaces.d']
        let cleanDir = ''
        for (cleanDir of cleanDirs) {
            await exec(`rm -f ${this.settings.work_dir.merged}/etc/network/${cleanDir}/wpasupplicant`, this.echo)
        }
    }

    /**
     * Clear configs from /etc/network/interfaces, wicd and NetworkManager
     * and netman, so they aren't stealthily included in the snapshot.
     */
    if (this.familyId === 'debian') {
        if (fs.existsSync(`${this.settings.work_dir.merged}/etc/network/interfaces`)) {
            await exec(`rm -f ${this.settings.work_dir.merged}/etc/network/interfaces`, this.echo)
            Utils.write(`${this.settings.work_dir.merged}/etc/network/interfaces`, 'auto lo\niface lo inet loopback')
        }

        /**
         * add some basic files to /dev
         */
        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/console`)) {
            await exec(`mknod -m 622 ${this.settings.work_dir.merged}/dev/console c 5 1`, this.echo)
        }

        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/null`)) {
            await exec(`mknod -m 666 ${this.settings.work_dir.merged}/dev/null c 1 3`, this.echo)
        }

        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/zero`)) {
            await exec(`mknod -m 666 ${this.settings.work_dir.merged}/dev/zero c 1 5`, this.echo)
        }

        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/ptmx`)) {
            await exec(`mknod -m 666 ${this.settings.work_dir.merged}/dev/ptmx c 5 2`, this.echo)
        }

        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/tty`)) {
            await exec(`mknod -m 666 ${this.settings.work_dir.merged}/dev/tty c 5 0`, this.echo)
        }

        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/random`)) {
            await exec(`mknod -m 444 ${this.settings.work_dir.merged}/dev/random c 1 8`, this.echo)
        }

        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/urandom`)) {
            await exec(`mknod -m 444 ${this.settings.work_dir.merged}/dev/urandom c 1 9`, this.echo)
        }

        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/{console,ptmx,tty}`)) {
            await exec(`chown -v root:tty ${this.settings.work_dir.merged}/dev/{console,ptmx,tty}`, this.echo)
        }

        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/fd`)) {
            await exec(`ln -sv /proc/self/fd ${this.settings.work_dir.merged}/dev/fd`, this.echo)
        }

        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/stdin`)) {
            await exec(`ln -sv /proc/self/fd/0 ${this.settings.work_dir.merged}/dev/stdin`, this.echo)
        }

        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/stdout`)) {
            await exec(`ln -sv /proc/self/fd/1 ${this.settings.work_dir.merged}/dev/stdout`, this.echo)
        }

        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/stderr`)) {
            await exec(`ln -sv /proc/self/fd/2 ${this.settings.work_dir.merged}/dev/stderr`, this.echo)
        }

        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/core`)) {
            await exec(`ln -sv /proc/kcore ${this.settings.work_dir.merged}/dev/core`, this.echo)
        }

        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/shm`)) {
            await exec(`mkdir -v ${this.settings.work_dir.merged}/dev/shm`, this.echo)
        }

        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/pts`)) {
            await exec(`mkdir -v ${this.settings.work_dir.merged}/dev/pts`, this.echo)
        }

        if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/shm`)) {
            await exec(`chmod 1777 ${this.settings.work_dir.merged}/dev/shm`, this.echo)
        }

        /**
         * creo /tmp
         */
        if (!fs.existsSync(`${this.settings.work_dir.merged}/tmp`)) {
            await exec(`mkdir ${this.settings.work_dir.merged}/tmp`, this.echo)
        }

        /**
         * Assegno 1777 a /tmp creava problemi con MXLINUX
         */
        await exec(`chmod 1777 ${this.settings.work_dir.merged}/tmp`, this.echo)
    }
}
