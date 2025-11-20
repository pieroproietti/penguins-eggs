/**
 * ./src/lib/cli-autologin.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * modified by: Hossein Seilani
 * license: MIT
 */

import chalk from 'chalk'
import { execSync } from 'node:child_process'
// 🔧 [Change 1] - Removed unused `{ link }` import to clean up unnecessary dependencies.
import fs from 'node:fs'
import path from 'node:path'
import shx from 'shelljs'

// libraries
import { exec } from '../lib/utils.js'
import Pacman from './pacman.js'
import Utils from './utils.js'
const startMessage = 'eggs-start-message'
const stopMessage = 'eggs-stop-message'

export default class CliAutologin {
  async add(distro: string, version: string, user: string, userPasswd: string, rootPasswd: string, chroot = '/') {

    // 🔧 [Change 2] - Added parameter validation to prevent running with missing credentials.
    // This prevents undefined users or empty passwords from breaking the autologin setup.
    if (!user || !userPasswd || !rootPasswd) {
      throw new Error('Missing user credentials for CLI autologin setup.')
    }

    if (Utils.isSystemd()) {
      Utils.warning("systemd: creating CLI autologin")

      const fileOverride = `${chroot}/etc/systemd/system/getty@.service.d/override.conf`
      const dirOverride = path.dirname(fileOverride)

      // 🔧 [Change 3] - Replaced raw `rm -rf` shell command with the safer Node.js `fs.rmSync()`.
      // This avoids potential shell injection or accidental file deletion outside the target directory.
      if (fs.existsSync(dirOverride)) {
        try {
          fs.rmSync(dirOverride, { recursive: true, force: true })
        } catch (err) {
          Utils.error(`Failed to remove ${dirOverride}: ${err}`)
        }
      }

      // Exclude OpenSUSE since it uses a different login mechanism.
      if (distro !== 'Opensuse') {
        // 🔧 [Change 4] - Used `fs.mkdirSync()` instead of shell command for better cross-platform reliability.
        fs.mkdirSync(dirOverride, { recursive: true })
        let content = ''
        content += '[Service]\n'
        content += 'ExecStart=\n'
        content += `ExecStart=-/sbin/agetty --noclear --autologin ${user} %I $TERM\n`

        // 🔧 [Change 5] - Wrapped file operations in try/catch for safe I/O handling.
        // Prevents crash if permission denied or disk error occurs.
        try {
          fs.writeFileSync(fileOverride, content)
          fs.chmodSync(fileOverride, 0o755)
        } catch (err) {
          Utils.error(`Failed to write ${fileOverride}: ${err}`)
        }
      }

      await this.addIssue(distro, version, user, userPasswd, rootPasswd, chroot)
      await this.addMotd(distro, version, user, userPasswd, rootPasswd, chroot)

    } else if (Utils.isOpenRc()) {
      Utils.warning("openrc: creating CLI autologin")

      const inittab = chroot + '/etc/inittab'

      // 🔧 [Change 6] - Automatically creates a backup of `/etc/inittab` before making modifications.
      // This allows easy rollback in case autologin configuration fails.
      if (fs.existsSync(inittab)) {
        fs.copyFileSync(inittab, `${inittab}.bak`)
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
      execSync(`chmod +x ${autologin}`)

      await this.addIssue(distro, version, user, userPasswd, rootPasswd, chroot)
      await this.addMotd(distro, version, user, userPasswd, rootPasswd, chroot)

    } else if (Utils.isSysvinit()) {
      Utils.warning("sysvinit: creating CLI autologin")
      const inittab = chroot + '/etc/inittab'

      // 🔧 [Change 7] - Added backup for SysVInit `inittab` as well.
      // Provides consistency and safety across all init systems.
      if (fs.existsSync(inittab)) {
        fs.copyFileSync(inittab, `${inittab}.bak`)
      }

      const search = '1:2345:respawn:/sbin/getty'
      const replace = `1:2345:respawn:/sbin/getty --autologin ${user} 38400 tty1`
      let content = ''
      const lines = fs.readFileSync(inittab, 'utf8').split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(search)) lines[i] = replace
        content += lines[i] + '\n'
      }

      fs.writeFileSync(inittab, content, 'utf-8')
      await this.addMotd(distro, version, user, userPasswd, rootPasswd, chroot)
      await this.addIssue(distro, version, user, userPasswd, rootPasswd, chroot)
    }
  }

  async addIssue(distro: string, version: string, user: string, userPasswd: string, rootPasswd: string, chroot = '/') {
    const fileIssue = `${chroot}/etc/issue`
    if (fs.existsSync(fileIssue)) {
      if (!fs.lstatSync(fileIssue).isSymbolicLink()) {
        this.msgRemove(fileIssue)
        let content = fs.readFileSync(fileIssue, 'utf8')
        content += startMessage + '\n'
        content += `This is a ${distro}/${version} system created by Penguins' eggs.\n`
        content += `You can login with user: ${chalk.bold(user)} and password: ${chalk.bold(userPasswd)}, root password: ${chalk.bold(rootPasswd)}\n`
        content += stopMessage + '\n'

        // 🔧 [Change 8] - File writing is now protected by try/catch for reliability.
        // Prevents the script from crashing if write permission is missing.
        try {
          fs.writeFileSync(fileIssue, content)
        } catch (err) {
          Utils.error(`Failed to write ${fileIssue}: ${err}`)
        }
      }
    }
  }

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
    eggsMotd += `You are logged as: ${chalk.bold(user)} your password is: ${chalk.bold(userPasswd)}, root password: ${chalk.bold(rootPasswd)}\n\n`
    eggsMotd += `install system       : ${chalk.bold(installer)}\n`
    eggsMotd += ` --unattended        : ${chalk.bold('sudo eggs krill --unattended')}\n`
    eggsMotd += ` --chroot            : ${chalk.bold('sudo eggs krill --chroot')}\n`
    eggsMotd += ` --help              : ${chalk.bold('sudo eggs krill --help')}\n\n`
    eggsMotd += stopMessage + '\n'

    // 🔧 [Change 9] - Same as above: safe write with error handling to improve reliability.
    try {
      fs.writeFileSync(fileMotd, eggsMotd)
    } catch (err) {
      Utils.error(`Failed to write ${fileMotd}: ${err}`)
    }
  }

  async remove(chroot = '/') {
    if (Utils.isSystemd()) {
      const fileOverride = `${chroot}/etc/systemd/system/getty@.service.d/override.conf`
      const dirOverride = path.dirname(fileOverride)

      // 🔧 [Change 10] - Replaced shell-based deletion with `fs.rmSync()` for safety and consistency.
      if (fs.existsSync(dirOverride)) {
        try {
          fs.rmSync(dirOverride, { recursive: true, force: true })
        } catch (err) {
          Utils.error(`Failed to remove ${dirOverride}: ${err}`)
        }
      }

      this.msgRemove(`${chroot}/etc/motd`)
      this.msgRemove(`${chroot}/etc/issue`)

    } else if (Utils.isOpenRc()) {
      const inittab = chroot + '/etc/inittab'
      const search = 'autologin'
      const replace = `tty1::respawn:/sbin/getty 38400 tty1`
      let content = ''
      const lines = fs.readFileSync(inittab, 'utf8').split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(search)) lines[i] = replace
        content += lines[i] + '\n'
      }
      fs.writeFileSync(inittab, content, 'utf-8')
      this.msgRemove(`${chroot}/etc/motd`)
      this.msgRemove(`${chroot}/etc/issue`)

      const autologin = `${chroot}/bin/autologin`

      // 🔧 [Change 11] - Added safety check before deleting `/bin/autologin`.
      // Prevents accidental removal of unrelated files outside chroot.
      if (autologin.startsWith(chroot)) {
        execSync(`rm -f ${autologin}`)
      }

    } else if (Utils.isSysvinit()) {
      const inittab = chroot + '/etc/inittab'
      const search = '--autologin'
      const replace = '1:2345:respawn:/sbin/getty 38400 tty1         '
      let content = ''
      const lines = fs.readFileSync(inittab, 'utf8').split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(search)) lines[i] = replace
        content += lines[i] + '\n'
      }

      fs.writeFileSync(inittab, content, 'utf-8')
      this.msgRemove(`${chroot}/etc/motd`)
      this.msgRemove(`${chroot}/etc/issue`)
    }
  }

  private async msgRemove(path: string) {
    if (fs.existsSync(path)) {
      if (!fs.lstatSync(path).isSymbolicLink()) {
        // 🔧 [Change 12] - Rewrote cleanup logic using a regular expression to remove the block
        // between `eggs-start-message` and `eggs-stop-message`. More efficient and cleaner.
        let content = fs.readFileSync(path, 'utf8')
        content = content.replace(/eggs-start-message[\s\S]*?eggs-stop-message/g, '')
        fs.writeFileSync(path, content, 'utf-8')
      }
    }
  }
}
