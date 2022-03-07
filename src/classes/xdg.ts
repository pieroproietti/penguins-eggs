/**
 * xdg-utils
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import shx from 'shelljs'
import fs from 'node:fs'
import path from 'node:path'
import Pacman from './pacman'
import Utils from './utils'

// libraries
import { exec } from '../lib/utils'

const xdg_dirs = ['DESKTOP', 'DOWNLOAD', 'TEMPLATES', 'PUBLICSHARE', 'DOCUMENTS', 'MUSIC', 'PICTURES', 'VIDEOS']

/**
 * Xdg: xdg-user-dirs, etc
 * @remarks all the utilities
 */
export default class Xdg {
  /**
   *
   * @param xdg_dir
   */
  static traduce(xdg_dir = '', traduce = true): string {
    let retval = ''
    if (traduce === false) {
      // Capitalize
      retval = xdg_dir.charAt(0).toUpperCase() + xdg_dir.slice(1).toLowerCase()
      console.log(retval)
    } else {
      xdg_dirs.forEach(async (dir) => {
        if (dir === xdg_dir) {
          retval = path.basename(shx.exec(`sudo -u ${Utils.getPrimaryUser()} xdg-user-dir ${dir}`, { silent: true }).stdout.trim())
        }
      })
    }

    return retval
  }

  /**
   *
   * @param user
   * @param chroot
   * @param verbose
   */
  static async create(user: string, chroot: string, traduce = true, verbose = false) {
    const echo = Utils.setEcho(verbose)

    /**
     * Creo solo la cartella DESKTOP perchè serve per i link, eventualmente posso creare le altre
     * ma c'è il problema di traduce/non traduce
     */
    xdg_dirs.forEach(async (dir) => {
      if (dir === 'DESKTOP') {
        await Xdg.mk(chroot, `/home/${user}/` + this.traduce(dir, traduce), verbose)
      }
    })
  }

  /**
   *
   * @param chroot
   * @param pathPromise
   */
  static async mk(chroot: string, path: string, verbose = false) {
    const echo = Utils.setEcho(verbose)

    if (!fs.existsSync(chroot + path)) {
      await exec(`mkdir ${chroot}${path}`, echo)
    }
  }

  /**
   *
   * @param olduser
   * @param newuser
   * @param chroot
   */
  static async autologin(olduser: string, newuser: string, chroot = '/') {
    if (await Pacman.isInstalledGui()) {
      // slim
      if (Pacman.packageIsInstalled('slim')) {
        shx.sed('-i', 'auto_login no', 'auto_login yes', `${chroot}/etc/slim.conf`)
        shx.sed('-i', `default_user ${olduser}`, `default_user ${newuser}`, `${chroot}/etc/slim.conf`)
      }

      // lightdm
      if (Pacman.packageIsInstalled('lightdm')) {
        if (fs.existsSync(`${chroot}/etc/lightdm/lightdm.conf`)) {
          shx.sed('-i', `autologin-user=${olduser}`, `autologin-user=${newuser}`, `${chroot}/etc/lightdm/lightdm.conf`)
        } else {
          const autologin = `${chroot}/etc/lightdm/lightdm.conf`
          const content = `[Seat:*]\nautologin-user=${newuser}`
          fs.writeFileSync(autologin, content, 'utf-8')
        }

      }

      // sddm
      if (Pacman.packageIsInstalled('sddm')) {
        let sddmChanged = false
        // Cerco configurazione nel file sddm.conf
        const fileConf = `${chroot}/etc/sddm.conf`
        if (fs.existsSync(fileConf)) {
          const content = fs.readFileSync(fileConf)
          if (content.includes('[Autologin]')) {
            shx.sed('-i', `User=${olduser}`, `User=${newuser}`, fileConf)
            sddmChanged = true
          }
        }

        // Se non l'ho trovato, modifico /etc/sddm.conf.d/autologin.conf
        if (!sddmChanged) {
          const dirConf = `${chroot}/etc/sddm.conf.d`
          const autologin = `${dirConf}/autologin.conf`
          if (fs.existsSync(autologin)) {
            shx.sed('-i', `User=${olduser}`, `User=${newuser}`, autologin)
          } else {
            const content = `[Autologin]\nUser=${newuser}\n`
            fs.writeFileSync(autologin, content, 'utf-8')
          }
        }
      }

      // gdm3 in ubuntu, gdm in manjaro
      if (Pacman.packageIsInstalled('gdm3')) {
        const gdm3Custom = `${chroot}/etc/gdm3/custom.conf`
        if (fs.existsSync(gdm3Custom)) {
          shx.sed('-i', 'AutomaticLoginEnable=False', 'AutomaticLoginEnable=True', gdm3Custom)
          shx.sed('-i', `AutomaticLogin=${olduser}`, `AutomaticLogin=${newuser}`, gdm3Custom)
        }
      } else if (Pacman.packageIsInstalled('gdm')) {
        const gdmCustom = `${chroot}/etc/gdm/custom.conf`
        if (fs.existsSync(gdmCustom)) {
          shx.sed('-i', 'AutomaticLoginEnable=False', 'AutomaticLoginEnable=True', gdmCustom)
          shx.sed('-i', `AutomaticLogin=${olduser}`, `AutomaticLogin=${newuser}`, gdmCustom)
        }
      }

    }
  }

  /**
   * Copia della configuirazione in /etc/skel
   * @param user
   * @param verbose
   */
  static async skel(user: string, verbose = false) {
    const echo = Utils.setEcho(verbose)

    if (verbose) {
      Utils.warning('removing /etc/skel')
    }
    await exec('rm /etc/skel -rf', echo)

    if (verbose) {
      Utils.warning('create an empty /etc/skel')
    }
    await exec('mkdir -p /etc/skel', echo)

    /**
     * Tha we need: the only necessary directory seem to be .config
     */
    const files = [`.bash_logout`, `.bashrc`, `.config/`, `.gtkrc-2.0`, `.gtkrc-xfce`, `.profile`]
    let desktop = ''
    if (Pacman.packageIsInstalled('cinnamon-core')) {
      desktop = 'cinnamon'
    } else if (Pacman.packageIsInstalled('plasma-desktop')) {
      desktop = 'kde'
    } else if (Pacman.packageIsInstalled('lxde-core')) {
      desktop = 'lxde'
    } else if (Pacman.packageIsInstalled('lxqt-core')) {
      desktop = 'lxqt'
    } else if (Pacman.packageIsInstalled('mate-session-manager')) {
      desktop = 'mate'
    } else if (Pacman.packageIsInstalled('xfce4-session')) {
      desktop = 'xfce4'
    }

    Utils.warning(`desktop: ${desktop}`)

    // Add Desktop Management configuration dir: cinnamon
    if (desktop === 'cinnamon') {
      files.push('.cinnamon')
    }

    // Add Desktop Management configuration: KDE
    if (desktop === 'kde') {
      files.push('.kde')
    }

    // Add node version manager
    files.push('.nvm')

    /**
     * GNOME, LXDE, LXQT, MATE and XFCE4 seem to NO ADD more .dofiles
     */

    Utils.warning('copying hidden files and dirs')
    for (const i in files) {
      if (fs.existsSync(`/home/${user}/${files[i]}`)) {
        await exec(`cp -r /home/${user}/${files[i]} /etc/skel/ `, echo)
      }
    }

    if (verbose) {
      Utils.warning('Cleaning /etc/skel/config...')
    }
    await execIfExist('rm -rf', '/etc/skel/.config/balena-etcher-electron', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/bleachbit', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/cinnamon-session', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/Code', verbose)
    // await execIfExist(`rm -rf`, `/etc/skel/.config/configstore`, verbose)
    // await execIfExist(`rm -rf`, `/etc/skel/.config/dconf`, verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/dleyna-server-service.conf', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/enchant', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/eog', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/filezilla', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/gedit', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/GIMP', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/Gitter', verbose)
    // await execIfExist(`rm -rf`, `/etc/skel/.config/gnote`, verbose)
    // await execIfExist(`rm -rf`, `/etc/skel/.config/goa-1.0`, verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/google-chrome', verbose)
    // await execIfExist(`rm -rf`, `/etc/skel/.config/gtk-2.0`, verbose)
    // await execIfExist(`rm -rf`, `/etc/skel/.config/gtk-3.0`, verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/ibus', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/inkscape', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/kazam', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/KeePass', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/libreoffice', verbose)
    // await execIfExist(`rm -rf`, `/etc/skel/.config/menus`, verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/mimeapps.list', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/mpv', verbose)
    // await execIfExist(`rm -rf`, `/etc/skel/.config/nemo`, verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/obs-studio', verbose)
    if (!Pacman.packageIsInstalled('plank')) {
      await execIfExist('rm -rf', '/etc/skel/.config/plank', verbose)
    }
    await execIfExist('rm -rf', '/etc/skel/.config/Postman', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/procps', verbose)
    // await execIfExist(`rm -rf`, `/etc/skel/.config/pulse`, verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/QtProject.conf', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/Slack', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/totem', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/transmission', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/Unknown Organization', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/user-dirs.dirs', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/user-dirs.locale', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/virt-viewer', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/yelp', verbose)
    await execIfExist('rm -rf', '/etc/skel/.config/zoomus.conf', verbose)

    /**
     * .local NON VIENE PIU copiata
     * 
    if (verbose) {
      Utils.warning('Try to clean personal datas in /etc/skel/.local')
    }
    await execIfExist('rm -rf', '/etc/skel/.local/share/applications', verbose)
    // await execIfExist(`rm -rf`, `/etc/skel/.local/share/cinnamon`, verbose)
    await execIfExist('rm -rf', '/etc/skel/.local/share/data', verbose) // MEGAlink
    await execIfExist('rm -rf', '/etc/skel/.local/share/desktop-directories', verbose)
    await execIfExist('rm -rf', '/etc/skel/.local/share/gegl-0.4', verbose)
    await execIfExist('rm -rf', '/etc/skel/.local/share/gnote', verbose)
    await execIfExist('rm -rf', '/etc/skel/.local/share/grilo-plugins', verbose)
    await execIfExist('rm -rf', '/etc/skel/.local/share/gsettings-data-convert', verbose)
    await execIfExist('rm -rf', '/etc/skel/.local/share/gstreamer-1.0', verbose)
    await execIfExist('rm -rf', '/etc/skel/.local/share/gvfs-metadata', verbose)
    await execIfExist('rm -rf', '/etc/skel/.local/share/icc', verbose)
    await execIfExist('rm -rf', '/etc/skel/.local/share/icons', verbose)
    await execIfExist('rm -rf', '/etc/skel/.local/share/keyrings', verbose)
    await execIfExist('rm -rf', '/etc/skel/.local/share/nemo', verbose)
    if (!Pacman.packageIsInstalled('plank')) {
      await execIfExist('rm -rf', '/etc/skel/.local/share/plank', verbose)
    }
    await execIfExist('rm -rf', '/etc/skel/.local/share/recently-used.xbel', verbose)
    await execIfExist('rm -rf', '/etc/skel/.local/share/shotwell', verbose)
    await execIfExist('rm -rf', '/etc/skel/.local/share/totem', verbose)
    await execIfExist('rm -rf', '/etc/skel/.local/share/Trash', verbose)
    await execIfExist('rm -rf', '/etc/skel/.local/share/webkitgtk', verbose)
     * 
    */

    if (verbose) {
      Utils.warning('change righs on /etc/skel')
    }

    await exec('chmod a+rwx,g-w,o-w /etc/skel/ -R', echo)
    execIfExist('chmod a+rwx,g-w-x,o-wx', '/etc/skel/.bashrc', verbose)
    execIfExist('chmod a+rwx,g-w-x,o-wx', '/etc/skel/.bash_logout', verbose)
    execIfExist('chmod a+rwx,g-w-x,o-wx', '/etc/skel/.profile', verbose)

    if (verbose) {
      Utils.warning('Change ower to root:root /etc/skel')
    }
    await exec('chown root:root /etc/skel -R', echo)

    // https://www.thegeekdiary.com/understanding-the-etc-skel-directory-in-linux/
    // cat /etc/defualt/useradd
    // ls -lart /etc/skel
  }
}

/**
 * showAndExec
 * @param cmd
 * @param verbose
 */
async function showAndExec(cmd: string, verbose = false) {
  const echo = Utils.setEcho(verbose)

  if (verbose) console.log(cmd)
  await exec(cmd, echo)
}

/**
 * execIfExist
 * @param cmd
 * @param file
 * @param verbose
 */
async function execIfExist(cmd: string, file: string, verbose = false) {
  const echo = Utils.setEcho(verbose)

  if (fs.existsSync(file)) {
    await exec(`${cmd} ${file}`, echo)
  }
}
