/**
 * ./src/classes/cli-autologin.ts
 * penguins-eggs v.25.12.8 / ecmascript 2020
 * author: Piero Proietti
 * modified by: Hossein Seilani
 * license: MIT
 */

import chalk from 'chalk'
import fs from 'node:fs'
import path from 'node:path'

// libraries
import { execSync, shx } from '../lib/utils.js'
import Pacman from './pacman.js'
import Utils from './utils.js'

const startMessage = 'eggs-start-message'
const stopMessage = 'eggs-stop-message'

export default class CliAutologin {
  /**
   *
   * @param distro
   * @param version
   * @param user
   * @param userPasswd
   * @param rootPasswd
   * @param chroot
   */
  async add(
    distro: string,

    version: string,
    user: string,
    userPasswd: string,
    rootPasswd: string,
    chroot = '/'
  ) {
    if (!user || !userPasswd || !rootPasswd) {
      throw new Error('Missing user credentials for CLI autologin setup.')
    }

    // --- SYSTEMD ---
    if (Utils.isSystemd()) {
      Utils.warning('systemd: creating CLI autologin')

      const fileOverride = `${chroot}/etc/systemd/system/getty@tty1.service.d/override.conf`
      const dirOverride = path.dirname(fileOverride)

      // Clean existing override directory using shx
      if (fs.existsSync(dirOverride)) {
        shx.rm('-rf', dirOverride)
      }

      // Exclude OpenSUSE since it uses a different login mechanism.
      if (distro !== 'Opensuse') {
        shx.mkdir('-r', dirOverride)

        let content = ''
        content += '[Service]\n'
        content += 'ExecStart=\n'
        content += `ExecStart=-/usr/sbin/agetty --noclear --autologin ${user} %I $TERM\n`

        try {
          fs.writeFileSync(fileOverride, content)
          shx.chmod(0o755, fileOverride)
        } catch (error) {
          Utils.error(`Failed to write ${fileOverride}: ${error}`)
        }
      }

      // --- OPENRC ---
    } else if (Utils.isOpenRc()) {
      Utils.warning('openrc: creating CLI autologin')

      const inittab = chroot + '/etc/inittab'

      // Backup inittab
      if (fs.existsSync(inittab)) {
        shx.cp(inittab, `${inittab}.bak`)
      }

      let content = ''
      const search = `tty1::respawn:/sbin/getty 38400 tty1`
      const replace = `tty1::respawn:/sbin/getty -L 38400 tty1 -n -l /bin/autologin`
      const lines = fs.readFileSync(inittab, 'utf8').split('\n')

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(search)) lines[i] = replace
        content += lines[i] + '\n'
      }

      console.log(`Writing ${inittab}`)
      fs.writeFileSync(inittab, content, 'utf-8')

      const autologin = chroot + '/bin/autologin'
      content = '#!/bin/sh\n'
      content += `/bin/login -f ${user}\n`

      fs.writeFileSync(autologin, content, 'utf-8')
      shx.chmod('+x', autologin)

      // --- SYSVINIT ---
    } else if (Utils.isSysvinit()) {
      Utils.warning('sysvinit: creating CLI autologin')
      const inittab = chroot + '/etc/inittab'

      // Backup for SysVInit
      if (fs.existsSync(inittab)) {
        shx.cp(inittab, `${inittab}.bak`)
      }

      let content = fs.readFileSync(inittab, 'utf8')

      // Robust Regex Replacement for tty1 line
      // Forces /sbin/agetty and adds --noclear
      const regex = /^(1:[0-9]*:respawn:)(.*getty\s+.*tty1.*)$/gm

      if (regex.test(content)) {
        regex.lastIndex = 0 // Reset index
        content = content.replace(regex, (match, prefix, oldCmd) => `# ORIGINAL DISABLED BY EGGS: ${match}\n${prefix}/sbin/agetty --autologin ${user} --noclear 38400 tty1 linux`)
      } else {
        // Fallback: append config
        Utils.warning('Standard tty1 line not found in inittab. Appending autologin configuration.')
        content += `\n# Autologin added by penguins-eggs\n1:2345:respawn:/sbin/agetty --autologin ${user} --noclear 38400 tty1 linux\n`
      }

      fs.writeFileSync(inittab, content, 'utf-8')
    }

    await this.addIssue(distro, version, user, userPasswd, rootPasswd, chroot)
    await this.addMotd(distro, version, user, userPasswd, rootPasswd, chroot)
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
  async addIssue(distro: string, version: string, user: string, userPasswd: string, rootPasswd: string, chroot = '/') {
    const fileIssue = `${chroot}/etc/issue`
    if (fs.existsSync(fileIssue) && !fs.lstatSync(fileIssue).isSymbolicLink()) {
      this.msgRemove(fileIssue)
      let content = fs.readFileSync(fileIssue, 'utf8')
      content += startMessage + '\n'
      content += `This is a ${distro}/${version} system created by Penguins' eggs.\n`
      content += `You can login with user: ${chalk.bold(user)} and password: ${chalk.bold(userPasswd)}, root password: ${chalk.bold(rootPasswd)}\n`
      content += stopMessage + '\n'

      try {
        fs.writeFileSync(fileIssue, content)
      } catch (error) {
        Utils.error(`Failed to write ${fileIssue}: ${error}`)
      }
    }
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
  async addMotd(distro: string, version: string, user: string, userPasswd: string, rootPasswd: string, chroot = '/') {
    const fileMotd = `${chroot}/etc/motd`

    let installer = 'sudo eggs krill'
    if (Pacman.calamaresExists()) {
      if (Pacman.packageIsInstalled('plasma-desktop')) {
        installer = 'startplasma-wayland to run GUI and launch calamares'
      } else if (Pacman.packageIsInstalled('xfce4')) {
        installer = 'startxfce4 to run GUI and launch calamares installer'
      }
    }

    if (!fs.existsSync(fileMotd)) {
      shx.touch(fileMotd)
    }

    this.msgRemove(fileMotd)

    let eggsMotd = fs.readFileSync(fileMotd, 'utf8')
    eggsMotd += startMessage + '\n'
    eggsMotd += Utils.flag() + '\n'
    eggsMotd += `You are logged as: ${chalk.bold(user)} your password is: ${chalk.bold(userPasswd)}, root password: ${chalk.bold(rootPasswd)}\n\n`
    eggsMotd += `install system        : ${chalk.bold(installer)}\n`
    eggsMotd += ` --unattended         : ${chalk.bold('sudo eggs krill --unattended')}\n`
    eggsMotd += ` --chroot             : ${chalk.bold('sudo eggs krill --chroot')}\n`
    eggsMotd += ` --help               : ${chalk.bold('sudo eggs krill --help')}\n\n`
    eggsMotd += stopMessage + '\n'

    try {
      fs.writeFileSync(fileMotd, eggsMotd)
    } catch (error) {
      Utils.error(`Failed to write ${fileMotd}: ${error}`)
    }
  }

  /**
   * remove()
   * Rimuove qualsiasi configurazione di autologin (Systemd, OpenRC, SysVinit).
   * Pulisce sia i target specifici (tty1) che quelli globali per evitare conflitti.
   * @param chroot - Il percorso della root del sistema (default: '/')
   */
  async remove(chroot = '/') {
    // --- SYSTEMD REMOVE ---
    if (Utils.isSystemd()) {
      // 1. Rimuove il target specifico TTY1 (quello corretto che usiamo ora)
      const specificDir = `${chroot}/etc/systemd/system/getty@tty1.service.d`
      if (fs.existsSync(specificDir)) {
        shx.rm('-rf', specificDir)
      }

      // 2. Rimuove il target generico (residui vecchi o configurazioni ereditate dall'host)
      // Questo è fondamentale per risolvere il problema del "loop" su tty2/tty3
      const globalDir = `${chroot}/etc/systemd/system/getty@.service.d`
      if (fs.existsSync(globalDir)) {
        shx.rm('-rf', globalDir)
      }

      // Pulizia messaggi di benvenuto
      this.msgRemove(`${chroot}/etc/motd`)
      this.msgRemove(`${chroot}/etc/issue`)

      // --- OPENRC REMOVE ---
    } else if (Utils.isOpenRc()) {
      const inittab = chroot + '/etc/inittab'

      // Safe Restore: Se esiste il backup, usalo.
      if (fs.existsSync(`${inittab}.bak`)) {
        shx.cp(`${inittab}.bak`, inittab)
        shx.rm(`${inittab}.bak`)
      } else {
        // Fallback: ripristino manuale delle stringhe (Legacy)
        const search = 'autologin'
        const replace = `tty1::respawn:/sbin/getty 38400 tty1`
        let content = ''
        const lines = fs.readFileSync(inittab, 'utf8').split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(search)) lines[i] = replace
          content += lines[i] + '\n'
        }

        fs.writeFileSync(inittab, content, 'utf-8')
      }

      this.msgRemove(`${chroot}/etc/motd`)
      this.msgRemove(`${chroot}/etc/issue`)

      // Rimuove lo script binario di supporto per OpenRC
      const autologin = `${chroot}/bin/autologin`
      if (fs.existsSync(autologin)) {
        shx.rm(autologin)
      }

      // --- SYSVINIT REMOVE ---
    } else if (Utils.isSysvinit()) {
      const inittab = chroot + '/etc/inittab'

      // Safe Restore per SysVinit
      if (fs.existsSync(`${inittab}.bak`)) {
        // console.log(`Restoring ${inittab} from backup...`);
        shx.cp(`${inittab}.bak`, inittab)
        shx.rm(`${inittab}.bak`)
      } else {
        // Fallback: Pulisce le righe inserite
        const search = '--autologin'
        const replace = '1:2345:respawn:/sbin/getty 38400 tty1'
        let content = ''
        const lines = fs.readFileSync(inittab, 'utf8').split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(search)) lines[i] = replace
          content += lines[i] + '\n'
        }

        fs.writeFileSync(inittab, content, 'utf-8')
      }

      this.msgRemove(`${chroot}/etc/motd`)
      this.msgRemove(`${chroot}/etc/issue`)
    }
  }

  private async msgRemove(path: string) {
    if (fs.existsSync(path) && !fs.lstatSync(path).isSymbolicLink()) {
      let content = fs.readFileSync(path, 'utf8')
      content = content.replaceAll(/eggs-start-message[\s\S]*?eggs-stop-message/g, '')
      fs.writeFileSync(path, content, 'utf-8')
    }
  }
}
