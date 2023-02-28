import shx from 'shelljs'
import fs from 'fs'
import path from 'path'
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'
import chalk from 'chalk'
const pjson = require('../../package.json')

// libraries
import {exec} from '../lib/utils'

// Comando per avviare ubiquity: sudo --preserve-env DBUS_SESSION_BUS_ADDRESS, XDG_RUNTIME sh -c 'calamares'

/**
 *
 * @param distro
 * @param version
 * @param user
 * @param userPasswd
 * @param rootPasswd
 * @param chroot
 */

const startMessage = 'eggs-start-message'
const stopMessage = 'eggs-stop-message'

export async function addAutologin(distro: string, version: string, user: string, userPasswd: string, rootPasswd: string, chroot = '/') {
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
    await addIssue(distro, version, user, userPasswd, rootPasswd, chroot)
    await addMotd(distro, version, user, userPasswd, rootPasswd, chroot)
  } else if (Utils.isSysvinit()) {
    /**
     * sysvinit
     */
    const inittab = chroot + '/etc/inittab'
    const search = '1:2345:respawn:/sbin/getty'
    // const replace = `1:2345:respawn:/sbin/getty --noclear --autologin ${user} 38400 tty1`
    const replace = `1:2345:respawn:/sbin/getty --autologin ${user} 38400 tty1`
    let content = ''
    const lines = fs.readFileSync(inittab, 'utf-8').split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(search)) {
        lines[i] = replace
      }

      content += lines[i] + '\n'
    }

    fs.writeFileSync(inittab, content, 'utf-8')
    await addIssue(distro, version, user, userPasswd, rootPasswd, chroot)
    await addMotd(distro, version, user, userPasswd, rootPasswd, chroot)
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

    msgRemove(`${chroot}/etc/motd`)
    msgRemove(`${chroot}/etc/issue`)
  } else if (Utils.isSysvinit()) {
    /**
     * sysvinit
     */
    const inittab = chroot + '/etc/inittab'
    const search = '1:2345:respawn:/sbin/getty'
    // const replace = `1:2345:respawn:/sbin/getty --noclear 38400 tty1         `
    const replace = '1:2345:respawn:/sbin/getty 38400 tty1         '
    let content = ''
    const lines = fs.readFileSync(inittab, 'utf-8').split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(search)) {
        lines[i] = replace
      }

      content += lines[i] + '\n'
    }

    fs.writeFileSync(inittab, content, 'utf-8')
    msgRemove(`${chroot}/etc/motd`)
    msgRemove(`${chroot}/etc/issue`)
  } // to add: openrc and runit for Devuan
}

/**
 *
 * @param chroot
 */
export async function addMotd(distro: string, version: string, user: string, userPasswd: string, rootPasswd: string, chroot = '/') {
  const fileMotd = `${chroot}/etc/motd`

  let installer = 'sudo eggs install'
  if (Pacman.packageIsInstalled('calamares')) {
    if (Pacman.packageIsInstalled('plasma-desktop')) {
      installer = 'startplasma-wayland to run GUI and launch calamares'
    } else if (Pacman.packageIsInstalled('xfce4')) {
      installer = 'startxfce4 to run GUI and launch calamares installer'
    }
  }

  if (!fs.existsSync(fileMotd)) {
    await exec(`touch ${fileMotd}`)
  }

  msgRemove(fileMotd)

  let eggsMotd = fs.readFileSync(fileMotd, 'utf-8')
  eggsMotd += startMessage + '\n'
  eggsMotd += Utils.flag() + '\n'
  eggsMotd += 'You are logged as: ' + chalk.bold(user) + ' your password is: ' + chalk.bold(userPasswd) + ', root password: ' + chalk.bold(rootPasswd) + '\n\n'
  eggsMotd += 'install              : ' + chalk.bold(installer) + '\n'
  eggsMotd += '  unattended         : ' + chalk.bold('sudo eggs install --unattended  # us configuration') + '\n'
  eggsMotd += '  unattended custom  : ' + chalk.bold('sudo eggs install --custom [ br | it | yours ]') + '\n'
  eggsMotd += 'PXE server           : ' + chalk.bold('sudo eggs cuckoo') + '\n'
  eggsMotd += '(*) to get your custom unattended configuration: fork https://github.com/pieroproietti/penguins-wardrobe' + '\n'
  eggsMotd += '    create your configuration in /config and ask for a Pull Request' + '\n'
  eggsMotd += stopMessage + '\n'
  fs.writeFileSync(fileMotd, eggsMotd)
}

/**
 *
 * @param distro
 * @param version
 * @param user
 * @param userPasswd
 * @param rootPasswd
 * @param chroot
 */
export async function addIssue(distro: string, version: string, user: string, userPasswd: string, rootPasswd: string, chroot = '/') {
  const fileIssue = `${chroot}/etc/issue`
  msgRemove(fileIssue)

  const eggsIssue = fs.readFileSync(fileIssue, 'utf-8')
  // eggsIssue += startMessage + '\n'
  // eggsIssue += `This is a ${distro}/${version} system created by penguin's eggs.\n`
  // eggsIssue += 'You can login with user: ' + chalk.bold(user) + ' and password: ' + chalk.bold(userPasswd) + ', root password: ' + chalk.bold(rootPasswd) + '\n'
  // eggsIssue += stopMessage + '\n'
  fs.writeFileSync(fileIssue, eggsIssue)
}

/**
 *
 * @param path
 */
export async function msgRemove(path: string) {
  if (fs.existsSync(path)) {
    const rows = fs.readFileSync(path, 'utf-8').split('\n')
    let cleaned = ''

    let remove = false
    for (const row of rows) {
      if (row.includes(startMessage)) {
        remove = true
      }

      if (!remove && row !== '') {
        cleaned += row + '\n'
      }

      if (row.includes(stopMessage)) {
        remove = false
      }
    }

    fs.writeFileSync(path, cleaned, 'utf-8')
  }
}
