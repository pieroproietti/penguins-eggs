/**
 * ./src/lib/cli-autologin.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * modified by: Hossein Seilani
 * license: MIT
 */

import chalk from 'chalk'
import { execSync } from '../lib/utils.js'
import fs from 'node:fs'
import path from 'node:path'
import { shx } from '../lib/utils.js'

// libraries
import { exec } from '../lib/utils.js'
import Pacman from './pacman.js'
import Utils from './utils.js'

const startMessage = 'eggs-start-message'
const stopMessage = 'eggs-stop-message'

export default class CliAutologin {
  
  async add(distro: string, version: string, user: string, userPasswd: string, rootPasswd: string, chroot = '/') {

    // 🔧 [Change 1] - Added parameter validation to prevent running with missing credentials.
    if (!user || !userPasswd || !rootPasswd) {
      throw new Error('Missing user credentials for CLI autologin setup.')
    }

    // --- SYSTEMD ---
    if (Utils.isSystemd()) {
      Utils.warning("systemd: creating CLI autologin")

      const fileOverride = `${chroot}/etc/systemd/system/getty@.service.d/override.conf`
      const dirOverride = path.dirname(fileOverride)

      // 🔧 [Change 2] - Replaced raw `rm -rf` shell command with `fs.rmSync()`.
      if (fs.existsSync(dirOverride)) {
        try {
          fs.rmSync(dirOverride, { recursive: true, force: true })
        } catch (err) {
          Utils.error(`Failed to remove ${dirOverride}: ${err}`)
        }
      }

      // Exclude OpenSUSE since it uses a different login mechanism.
      if (distro !== 'Opensuse') {
        fs.mkdirSync(dirOverride, { recursive: true })
        let content = ''
        content += '[Service]\n'
        content += 'ExecStart=\n'
        content += `ExecStart=-/sbin/agetty --noclear --autologin ${user} %I $TERM\n`

        try {
          fs.writeFileSync(fileOverride, content)
          fs.chmodSync(fileOverride, 0o755)
        } catch (err) {
          Utils.error(`Failed to write ${fileOverride}: ${err}`)
        }
      }

      await this.addIssue(distro, version, user, userPasswd, rootPasswd, chroot)
      await this.addMotd(distro, version, user, userPasswd, rootPasswd, chroot)

    // --- OPENRC ---
    } else if (Utils.isOpenRc()) {
      Utils.warning("openrc: creating CLI autologin")

      const inittab = chroot + '/etc/inittab'

      // 🔧 [Change 3] - Backup inittab before modification
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

    // --- SYSVINIT ---
    } else if (Utils.isSysvinit()) {
      Utils.warning("sysvinit: creating CLI autologin")
      const inittab = chroot + '/etc/inittab'

      // 🔧 [Change 4] - Backup for SysVInit
      if (fs.existsSync(inittab)) {
        try {
          fs.copyFileSync(inittab, `${inittab}.bak`)
        } catch (e) {
          Utils.warning(`Could not backup inittab: ${e}`)
        }
      }

      let content = fs.readFileSync(inittab, 'utf8')

      // 🔧 [Change 5] - ROBUST REGEX REPLACEMENT
      // Instead of exact string match, we use Regex to find the tty1 line.
      // We force usage of /sbin/agetty (safer than getty) and add --noclear to prevent blinking/loops.
      // ^(1:[0-9]*:respawn:) matches the ID and runlevels
      // (.*getty\s+.*tty1.*)$ matches the command part
      const regex = /^(1:[0-9]*:respawn:)(.*getty\s+.*tty1.*)$/gm;

      if (regex.test(content)) {
        regex.lastIndex = 0; // Reset index
        content = content.replace(regex, (match, prefix, oldCmd) => {
           // We comment out the original line for safety and append the new valid one
           return `# ORIGINAL DISABLED BY EGGS: ${match}\n${prefix}/sbin/agetty --autologin ${user} --noclear 38400 tty1 linux`;
        });
      } else {
        // Fallback if regex fails: append config
        Utils.warning("Standard tty1 line not found in inittab. Appending autologin configuration.");
        content += `\n# Autologin added by penguins-eggs\n1:2345:respawn:/sbin/agetty --autologin ${user} --noclear 38400 tty1 linux\n`;
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

    let installer = 'sudo eggs krill'
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
    eggsMotd += `install system        : ${chalk.bold(installer)}\n`
    eggsMotd += ` --unattended         : ${chalk.bold('sudo eggs krill --unattended')}\n`
    eggsMotd += ` --chroot             : ${chalk.bold('sudo eggs krill --chroot')}\n`
    eggsMotd += ` --help               : ${chalk.bold('sudo eggs krill --help')}\n\n`
    eggsMotd += stopMessage + '\n'

    try {
      fs.writeFileSync(fileMotd, eggsMotd)
    } catch (err) {
      Utils.error(`Failed to write ${fileMotd}: ${err}`)
    }
  }

  async remove(chroot = '/') {
    
    // --- SYSTEMD REMOVE ---
    if (Utils.isSystemd()) {
      const fileOverride = `${chroot}/etc/systemd/system/getty@.service.d/override.conf`
      const dirOverride = path.dirname(fileOverride)

      if (fs.existsSync(dirOverride)) {
        try {
          fs.rmSync(dirOverride, { recursive: true, force: true })
        } catch (err) {
          Utils.error(`Failed to remove ${dirOverride}: ${err}`)
        }
      }

      this.msgRemove(`${chroot}/etc/motd`)
      this.msgRemove(`${chroot}/etc/issue`)

    // --- OPENRC REMOVE ---
    } else if (Utils.isOpenRc()) {
      const inittab = chroot + '/etc/inittab'
      
      // 🔧 [Change 6] - Safe Restore: If backup exists, use it.
      if (fs.existsSync(`${inittab}.bak`)) {
        fs.copyFileSync(`${inittab}.bak`, inittab)
        fs.rmSync(`${inittab}.bak`)
      } else {
        // Fallback to manual string replacement (Legacy)
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

      const autologin = `${chroot}/bin/autologin`
      if (autologin.startsWith(chroot)) {
        execSync(`rm -f ${autologin}`)
      }

    // --- SYSVINIT REMOVE ---
    } else if (Utils.isSysvinit()) {
      const inittab = chroot + '/etc/inittab'

      // 🔧 [Change 7] - Safe Restore for SysVinit
      // Much safer to restore the backup than trying to undo regex replacements manually.
      if (fs.existsSync(`${inittab}.bak`)) {
        console.log(`Restoring ${inittab} from backup...`);
        fs.copyFileSync(`${inittab}.bak`, inittab)
        fs.rmSync(`${inittab}.bak`)
      } else {
        // Fallback: Try to clean up the inserted lines
        const search = '--autologin'
        const replace = '1:2345:respawn:/sbin/getty 38400 tty1'
        let content = ''
        const lines = fs.readFileSync(inittab, 'utf8').split('\n')
        for (let i = 0; i < lines.length; i++) {
          // If we find our modified line, we try to revert to a standard one
          // Note: This is less precise than backup restore, hence why backup is preferred.
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
    if (fs.existsSync(path)) {
      if (!fs.lstatSync(path).isSymbolicLink()) {
        let content = fs.readFileSync(path, 'utf8')
        content = content.replace(/eggs-start-message[\s\S]*?eggs-stop-message/g, '')
        fs.writeFileSync(path, content, 'utf-8')
      }
    }
  }
}