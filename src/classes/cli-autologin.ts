/**
 * ./src/lib/cli-autologin.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import chalk from 'chalk'
import { execSync } from 'node:child_process'
import fs, { link } from 'node:fs'
import path from 'node:path'
import shx from 'shelljs'

// libraries
import { exec } from '../lib/utils.js'
import Pacman from './pacman.js'
import Utils from './utils.js'
const startMessage = 'eggs-start-message'
const stopMessage = 'eggs-stop-message'

/*
 * Comando per avviare ubiquity:
 * sudo --preserve-env DBUS_SESSION_BUS_ADDRESS, XDG_RUNTIME sh -c 'calamares'
 */

/**
 * CliAutologin
 */
export default class CliAutologin {
  /**
   * add
   * @param distro
   * @param version
   * @param user
   * @param userPasswd
   * @param rootPasswd
   * @param chroot
   */
  async add(distro: string, version: string, user: string, userPasswd: string, rootPasswd: string, chroot = '/') {
    if (Utils.isSystemd()) {

      /**
       * systemd
       */
      Utils.warning("systemd: creating CLI autologin")
      const fileOverride = `${chroot}/etc/systemd/system/getty@.service.d/override.conf`
      const dirOverride = path.dirname(fileOverride)
      if (fs.existsSync(dirOverride)) {
        shx.exec(`rm ${dirOverride} -rf`)
      }

      // ecludo Opensuse ha un'altro sistema
      if (distro !== 'Opensuse') {
        shx.exec(`mkdir ${dirOverride}`)
        let content = ''
        content += '[Service]' + '\n'
        content += 'ExecStart=' + '\n'
        content += 'ExecStart=-/sbin/agetty --noclear --autologin ' + user + ' %I $TERM' + '\n'
        fs.writeFileSync(fileOverride, content)
      }
      
      shx.exec(`chmod +x ${fileOverride}`)
      await this.addIssue(distro, version, user, userPasswd, rootPasswd, chroot)
      await this.addMotd(distro, version, user, userPasswd, rootPasswd, chroot)

    } else if (Utils.isOpenRc()) {
      /**
       * openrc 
       */
      Utils.warning("openrc: creating CLI autologin")
      const inittab = chroot + '/etc/inittab'
      let content = ''
      const search = `tty1::respawn:/sbin/getty 38400 tty1`
      const replace = `tty1::respawn:/sbin/getty -L 38400 tty1 -n -l /bin/autologin`
      const lines = fs.readFileSync(inittab, 'utf8').split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(search)) {
          lines[i] = replace
        }
        content += lines[i] + '\n'
      }
      console.log(`Writing ${inittab}`)
      fs.writeFileSync(inittab, content, 'utf-8')
      const autologin = chroot + '/bin/autologin'
      content = '#!/bin/sh' + '\n'
      content += `/bin/login -f ${user}` + '\n'
      fs.writeFileSync(autologin, content, 'utf-8')
      execSync(`chmod +x ${autologin}`)
      await this.addIssue(distro, version, user, userPasswd, rootPasswd, chroot)
      await this.addMotd(distro, version, user, userPasswd, rootPasswd, chroot)

    } else if (Utils.isSysvinit()) {
      /**
       * sysvinit
       */
      Utils.warning("sysvinit: creating CLI autologin")
      const inittab = chroot + '/etc/inittab'
      const search = '1:2345:respawn:/sbin/getty'
      const replace = `1:2345:respawn:/sbin/getty --autologin ${user} 38400 tty1`
      let content = ''
      const lines = fs.readFileSync(inittab, 'utf8').split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(search)) {
          lines[i] = replace
        }

        content += lines[i] + '\n'
      }
      console.log(`Writing ${inittab}`)
      fs.writeFileSync(inittab, content, 'utf-8')
      await this.addMotd(distro, version, user, userPasswd, rootPasswd, chroot)
      await this.addIssue(distro, version, user, userPasswd, rootPasswd, chroot)
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
  async addIssue(distro: string, version: string, user: string, userPasswd: string, rootPasswd: string, chroot = '/') {
    const fileIssue = `${chroot}/etc/issue`
    if (fs.existsSync(fileIssue)) {
      if (!fs.lstatSync(fileIssue).isSymbolicLink()) {
        this.msgRemove(fileIssue)
        let content = fs.readFileSync(fileIssue, 'utf8')
        content += startMessage + '\n'
        content += `This is a ${distro}/${version} system created by Penguins' eggs.\n`
        content += 'You can login with user: ' + chalk.bold(user) + ' and password: ' + chalk.bold(userPasswd) + ', root password: ' + chalk.bold(rootPasswd) + '\n'
        content += stopMessage + '\n'
        fs.writeFileSync(fileIssue, content)
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

    let installer = 'sudo eggs install'
    if (Pacman.calamaresExists()) {
      if (Pacman.packageIsInstalled('plasma-desktop')) {
        installer = 'startplasma-wayland to run GUI and launch calamares'
      } else if (Pacman.packageIsInstalled('xfce4')) {
        installer = 'startxfce4 to run GUI and launch calamares installer'
      }
    }

    if (!fs.existsSync(fileMotd)) {
      await exec(`touch ${fileMotd}`)
    }
    this.msgRemove(fileMotd)

    let eggsMotd = fs.readFileSync(fileMotd, 'utf8')
    eggsMotd += startMessage + '\n'
    eggsMotd += Utils.flag() + '\n'
    eggsMotd += 'You are logged as: ' + chalk.bold(user) + ' your password is: ' + chalk.bold(userPasswd) + ', root password: ' + chalk.bold(rootPasswd) + '\n\n'
    eggsMotd += 'install              : ' + chalk.bold(installer) + '\n'
    eggsMotd += ' --unattended        : ' + chalk.bold('sudo eggs install --unattended') + '\n'
    eggsMotd += ' --chroot            : ' + chalk.bold('sudo eggs install --chroot') + '\n'
    eggsMotd += ' --help              : ' + chalk.bold('sudo eggs install --help') + '\n'
    eggsMotd += '\n'
    eggsMotd += stopMessage + '\n'
    fs.writeFileSync(fileMotd, eggsMotd)
  }

  /**
   * remove
   * @param chroot
   */
  async remove(chroot = '/') {
    if (Utils.isSystemd()) {
      /**
       * Systemd
       */
      const fileOverride = `${chroot}/etc/systemd/system/getty@.service.d/override.conf`
      const dirOverride = path.dirname(fileOverride)
      if (fs.existsSync(dirOverride)) {
        shx.exec(`rm ${dirOverride} -rf`)
      }

      this.msgRemove(`${chroot}/etc/motd`)
      this.msgRemove(`${chroot}/etc/issue`)
    } else if (Utils.isOpenRc()) {
      /**
       * openrc
       */
      const inittab = chroot + '/etc/inittab'
      const search = 'autologin'
      const replace = `tty1::respawn:/sbin/getty 38400 tty1`
      let content = ''
      const lines = fs.readFileSync(inittab, 'utf8').split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(search)) {
          lines[i] = replace
        }

        content += lines[i] + '\n'
      }

      fs.writeFileSync(inittab, content, 'utf-8')
      this.msgRemove(`${chroot}/etc/motd`)
      this.msgRemove(`${chroot}/etc/issue`)
      const autologin = `${chroot}/bin/autologin`
      execSync(`rm -f ${autologin}`)
    } else if (Utils.isSysvinit()) {
      /**
       * sysvinit
       */
      const inittab = chroot + '/etc/inittab'
      const search = '--autologin'
      const replace = '1:2345:respawn:/sbin/getty 38400 tty1         '
      let content = ''
      const lines = fs.readFileSync(inittab, 'utf8').split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(search)) {
          lines[i] = replace
        }

        content += lines[i] + '\n'
      }
      // motd
      fs.writeFileSync(inittab, content, 'utf-8')
      this.msgRemove(`${chroot}/etc/motd`)

      // issue
      this.msgRemove(`${chroot}/etc/issue`)
    } // to add: openrc and runit for Devuan
  }

  /**
   *
   * @param path
   */
  private async msgRemove(path: string) {
    if (fs.existsSync(path)) {
      if (!fs.lstatSync(path).isSymbolicLink()) {
        const rows = fs.readFileSync(path, 'utf8').split('\n')
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
  }
}
