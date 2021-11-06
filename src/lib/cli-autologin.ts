import shx = require('shelljs')
import fs = require('fs')
import path = require('path')
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'
import { serialize } from 'v8'

// Comando per avviare ubiquity: sudo --preserve-env DBUS_SESSION_BUS_ADDRESS, XDG_RUNTIME sh -c 'calamares'

/**
 * 
 * @param chroot 
 */
export async function add(distro: string, version: string, user: string, userPasswd: string, rootPasswd: string, chroot = '/') {
    if (Utils.isSystemd()) {
        /**
         * Systemd
         */
        const fileOverride = `${chroot}/etc/systemd/system/getty@.service.d/override.conf`
        const dirOverride = path.dirname(fileOverride)
        if (fs.existsSync(dirOverride)) {
            shx.exec(`rm ${dirOverride} -rf`)
        }
        shx.exec(`mkdir ${dirOverride}`)
        let content = ''
        content += '[Service]' + '\n'
        content += 'ExecStart=' + '\n'
        content += 'ExecStart=-/sbin/agetty --noclear --autologin ' + user + ' %I $TERM' + '\n'
        fs.writeFileSync(fileOverride, content)
        shx.exec(`chmod +x ${fileOverride}`)
        await motdAdd(distro, version, user, userPasswd, rootPasswd, chroot)
    } else if (Utils.isSysvinit()) {
        /**
         * sysvinit
         * 1:235:respawn:/sbin/getty 38400 tty1
         */
        const inittab = chroot + '/etc/inittab'
        const search = `1:2345:respawn:/sbin/getty`
        const replace = `1:2345:respawn:/sbin/getty --noclear --autologin ${user} 38400 tty1`
        let content = ''
        const lines = fs.readFileSync(inittab, 'utf-8').split('\n')
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(search)) {
                lines[i]= replace
            }
            content += lines[i] + '\n'
        }
        fs.writeFileSync(inittab, content, 'utf-8')
        await motdAdd(distro, version, user, userPasswd, rootPasswd, chroot)
    }
}

/**
 * 
 * @param chroot 
 * @param user 
 */
export async function remove(chroot = '/') {
    if (Utils.isSystemd()) {
        /**
         * Systemd
         */
        const fileOverride = `${chroot}/etc/systemd/system/getty@.service.d/override.conf`
        const dirOverride = path.dirname(fileOverride)
        if (fs.existsSync(dirOverride)) {
            shx.exec(`rm ${dirOverride} -rf`)
        }
        await motdRemove(chroot)
    } else if (Utils.isSysvinit()) {
        /**
        * sysvinit
        */
         const inittab = chroot + '/etc/inittab'
         const search = `1:2345:respawn:/sbin/getty`
         const replace = `1:2345:respawn:/sbin/getty --noclear 38400 tty1         `
         let content = ''
         const lines = fs.readFileSync(inittab, 'utf-8').split('\n')
         for (let i = 0; i < lines.length; i++) {
             if (lines[i].includes(search)) {
                 lines[i]= replace
             }
             content += lines[i] + '\n'
         }
         fs.writeFileSync(inittab, content, 'utf-8')
         await motdRemove()
    }
}

/**
 * 
 * @param chroot 
 */
async function motdAdd(distro: string, version: string, user: string, userPasswd: string, rootPasswd: string, chroot = '/') {
    const fileMotd = `${chroot}/etc/motd`

    let installer = 'sudo eggs install'
    if (Pacman.packageIsInstalled('krill')) {
        installer = 'sudo krill install'
    } else if (Pacman.packageIsInstalled('calamares')) {
        installer = 'calamares'
    }

    motdRemove(chroot)

    let eggsMotd = fs.readFileSync(fileMotd, 'utf-8')
    eggsMotd += '>>> eggs\n'
    eggsMotd += `This is a live ${distro}/${version} system createb by penguin's eggs.\n`
    eggsMotd += `You are logged as ${user}, your password is: ${userPasswd}. root password: ${rootPasswd}\n`
    eggsMotd += `to install the system, type: ${installer}\n`
    eggsMotd += 'eggs <<<\n'
    //eggsMotd.trimEnd() + '\n'
    fs.writeFileSync(fileMotd, eggsMotd)
}

/**
 * 
 * @param chroot 
 */
async function motdRemove(chroot = '/') {
    const fileMotd = `${chroot}/etc/motd`
    let motd = fs.readFileSync(fileMotd, 'utf-8').split('\n')
    let cleanMotd = ''
    let remove = false
    const startRemove = '>>> eggs'
    const stopRemove = 'eggs <<<'
    for (let i = 0; i < motd.length; i++) {
        if (motd[i].includes(startRemove)) {
            remove = true
        }
        if (!remove) {
            if (motd[i] !== '\n') {
                cleanMotd += motd[i] + '\n'
            }
        }
        if (motd[i].includes(stopRemove)) {
            remove = false
        }
    }
    // cleanMotd.trimEnd() + '\n'
    fs.writeFileSync(fileMotd, cleanMotd)
}

