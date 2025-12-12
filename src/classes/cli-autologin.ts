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
   * @param distro 
   * @param version 
   * @param user 
   * @param userPasswd 
   * @param rootPasswd 
   * @param chroot 
   */
  async add(distro: string,
    version: string,
    user: string,
    userPasswd: string,
    rootPasswd: string,
    chroot = '/') {

    if (!user || !userPasswd || !rootPasswd) {
      throw new Error('Missing user credentials for CLI autologin setup.')
    }

    if (Utils.isSystemd()) {
      this.systemdAdd(chroot)
    } else if (Utils.isOpenRc()) {
      this.openrcAdd(chroot, user)
    } else if (Utils.isSysvinit()) {
      this.sysvinitAdd(chroot, user)
    }
    await this.addMotd(distro, version, user, userPasswd, rootPasswd, chroot)
    await this.addIssue(distro, version, user, userPasswd, rootPasswd, chroot)
  }

  /**
  * Rimuove autologin e configura il target finale.
  * Logica semplificata: gestiamo solo il default.target.
  */
  async remove(chroot = '/') {

    if (Utils.isSystemd()) {
      this.systemdRemove(chroot)
    } else if (Utils.isOpenRc()) {
      this.openrcRemove(chroot)
    } else if (Utils.isSysvinit()) {
      this.sysvinitRemove(chroot)
    }
    this.msgRemove(`${chroot}/etc/motd`)
    this.msgRemove(`${chroot}/etc/issue`)
  }

  /**
  * 
  * @param chroot 
  */
  private async systemdAdd(chroot: string) {
    Utils.warning("systemd: enabling CLI autologin on tty1")
    const systemdDir = `${chroot}/etc/systemd/system`

    // Definizioni per TTY1
    const tty1Dir = `${systemdDir}/getty@tty1.service.d`

    // 1. Pulizia Totale
    const oldGlobalDir = `${systemdDir}/getty@.service.d`
    if (fs.existsSync(oldGlobalDir)) {
      shx.rm('-rf', oldGlobalDir)
    }

    // Ricreiamo la directory specifica per TTY1
    if (fs.existsSync(tty1Dir)) {
      shx.rm('-rf', tty1Dir)
    }

    // 3. Imposta default.target -> multi-user.target
    const defaultTarget = `${systemdDir}/default.target`
    if (fs.existsSync(defaultTarget)) shx.rm(defaultTarget)
    shx.exec(`ln -sf ${chroot}/usr/lib/systemd/system/multi-user.target ${defaultTarget}`)
  }


  /**
  * 
  * @param chroot 
  */
  private async systemdRemove(chroot: string) {
    const systemdDir = `${chroot}/etc/systemd/system`

    // 1. Pulizia e Ripristino TTY1 (Login manuale)
    const tty1Dir = `${systemdDir}/getty@tty1.service.d`
    const tty1File = `${tty1Dir}/override.conf`

    if (fs.existsSync(tty1Dir)) shx.rm('-rf', tty1Dir)
    shx.mkdir('-p', tty1Dir)

    // Ripristina agetty standard (chiede user e password)
    let content = '[Service]\nExecStart=\nExecStart=-/sbin/agetty -o \'-p -- \\u\' --noclear %I $TERM\n'
    try {
      fs.writeFileSync(tty1File, content)
    } catch (err) {
      Utils.error(`Failed to write TTY1 override: ${err}`)
    }

    // 2. Pulizia residui globali
    const globalDir = `${systemdDir}/getty@.service.d`
    if (fs.existsSync(globalDir)) shx.rm('-rf', globalDir)

    // 3. Gestione TARGET di Boot (CLI vs GUI)
    const defaultTarget = `${systemdDir}/default.target`
    if (fs.existsSync(defaultTarget)) shx.rm(defaultTarget)
    // Non deve esistere il defaultTarget
    // shx.ln('-sf', '/usr/lib/systemd/system/multi-user.target', defaultTarget)
  }


  /**
   * 
   * @param chroot 
   */
  private async sysvinitAdd(chroot: string, user: string) {

    Utils.warning("sysvinit: creating CLI autologin and disabling GUI")
    const inittab = chroot + '/etc/inittab'

    // 1. Inittab Backup & Mod
    if (fs.existsSync(inittab)) shx.cp(inittab, `${inittab}.bak`)

    let content = fs.readFileSync(inittab, 'utf8')
    const regex = /^([1-6c]+:[0-9]*:respawn:)(.*getty\s+.*tty1.*)$/gm;

    if (regex.test(content)) {
      regex.lastIndex = 0;
      content = content.replace(regex, (match, prefix, oldCmd) => {
        return `# ORIGINAL DISABLED BY EGGS: ${match}\n${prefix}/sbin/agetty --autologin ${user} --noclear 38400 tty1 linux`;
      });
    } else {
      content += `\n# Autologin added by penguins-eggs\n1:2345:respawn:/sbin/agetty --autologin ${user} --noclear 38400 tty1 linux\n`;
    }
    fs.writeFileSync(inittab, content, 'utf-8')

    // 2. FIX DEVUAN: Disabilitare Display Manager per evitare conflitti video
    const displayManagers = ['lightdm', 'sddm', 'gdm3', 'slim', 'lxdm', 'xdm'];
    displayManagers.forEach(dm => {
      const initScript = `${chroot}/etc/init.d/${dm}`;
      if (fs.existsSync(initScript)) {
        // Rimuove i link di avvio dai runlevel (rcX.d)
        const rcDirs = shx.ls('-d', `${chroot}/etc/rc*.d`);
        rcDirs.forEach(rcDir => shx.rm('-f', `${rcDir}/*${dm}`));
      }
    });
  }

  /**
 * 
 * @param chroot 
 */
  private async sysvinitRemove(chroot: string) {

    Utils.warning("sysvinit: restoring manual login")
    const inittab = chroot + '/etc/inittab'

    if (fs.existsSync(`${inittab}.bak`)) {
      shx.cp(`${inittab}.bak`, inittab)
      shx.rm(`${inittab}.bak`)
    } else {
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
  }



  // ######################################################################
  // Funzioni private
  // ######################################################################

  /**
   * msgRemove
   * @param path 
   */
  private async msgRemove(path: string) {
    if (fs.existsSync(path)) {
      if (!fs.lstatSync(path).isSymbolicLink()) {
        let content = fs.readFileSync(path, 'utf8')
        content = content.replace(/eggs-start-message[\s\S]*?eggs-stop-message/g, '')
        fs.writeFileSync(path, content, 'utf-8')
      }
    }
  }


  /**
   * Genera /etc/issue customizzato
   */
  private async addIssue(distro: string, version: string, user: string, userPasswd: string, rootPasswd: string, chroot = '/') {
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

  /**
   * Genera /etc/motd customizzato
   */
  private async addMotd(distro: string, version: string, user: string, userPasswd: string, rootPasswd: string, chroot = '/') {
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
    } catch (err) {
      Utils.error(`Failed to write ${fileMotd}: ${err}`)
    }
  }


  /**
   * 
   * @param chroot 
   */
  private async openrcAdd(chroot: string, user: string) {
    Utils.warning("openrc: creating CLI autologin")
    const inittab = chroot + '/etc/inittab'
    if (fs.existsSync(inittab)) shx.cp(inittab, `${inittab}.bak`)

    let content = ''
    const search = `tty1::respawn:/sbin/getty 38400 tty1`
    const replace = `tty1::respawn:/sbin/getty -L 38400 tty1 -n -l /bin/autologin`
    const lines = fs.readFileSync(inittab, 'utf8').split('\n')

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(search)) lines[i] = replace
      content += lines[i] + '\n'
    }
    fs.writeFileSync(inittab, content, 'utf-8')

    const autologin = chroot + '/bin/autologin'
    content = '#!/bin/sh\n'
    content += `/bin/login -f ${user}\n`
    fs.writeFileSync(autologin, content, 'utf-8')
    shx.chmod('+x', autologin)

    // --- SYSVINIT ADD (DEVUAN FIX) ---
  }

  async openrcRemove(chroot: string) {
    // ... (il codice OpenRC rimane invariato)
    const inittab = chroot + '/etc/inittab'
    if (fs.existsSync(`${inittab}.bak`)) {
      shx.cp(`${inittab}.bak`, inittab)
      shx.rm(`${inittab}.bak`)
    } else {
      // Fallback replace manuale
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

    // Rimuovi script autologin e messaggi
    const autologin = `${chroot}/bin/autologin`
    if (fs.existsSync(autologin)) shx.rm(autologin)
  }


}
