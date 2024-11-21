/**
 * ./src/classes/xdg.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import os from 'os'
import fs, { utimesSync } from 'node:fs'
import path from 'node:path'
import shx from 'shelljs'

// libraries
import { exec } from '../lib/utils.js'
import Distro from './distro.js'
import Pacman from './pacman.js'
import Utils from './utils.js'

const xdg_dirs = ['DESKTOP', 'DOWNLOAD', 'TEMPLATES', 'PUBLICSHARE', 'DOCUMENTS', 'MUSIC', 'PICTURES', 'VIDEOS']

/**
 * Xdg: xdg-user-dirs, etc
 * @remarks all the utilities
 */
export default class Xdg {

  /**
   *
   * @param olduser
   * @param newuser
   * @param chroot
   */
  static async autologin(olduser: string, newuser: string, chroot = '/') {

    // console.log("old: " + olduser, "new: "  + newuser, "chroot: " + chroot)
    if (Pacman.isInstalledGui()) {
      /**
       * SLIM & SLIMSKI
       */
      let slimConf = ''
      if (Pacman.packageIsInstalled('slim')) {
        slimConf = 'slim.conf'
        if (fs.existsSync('/etc/slim.local.conf')) {
          slimConf = 'slim.local.conf'
        }
      }

      if (Pacman.packageIsInstalled('slimski')) {
        slimConf = 'slimski.conf'
        if (fs.existsSync('/etc/slimski.local.conf')) {
          slimConf = 'slimski.local.conf'
        }
      }

      if (slimConf !== '') {
        let content = fs.readFileSync(`${chroot}/etc/${slimConf}`, 'utf8')

        const regexAutoLogin = new RegExp(`auto_login\\s*no`, 'g')
        content = content.replaceAll(regexAutoLogin, 'auto_login yes')

        const regexDefaultUser = new RegExp(`default_user\\s*${olduser}`, 'g')
        content = content.replace(regexDefaultUser, `default_user ${newuser}`)
        fs.writeFileSync(`${chroot}/etc/${slimConf}`, content, 'utf8')

        /**
         * LIGHTDM
         */
      } else if (Pacman.packageIsInstalled('lightdm')) {
        const dc = `${chroot}/etc/lightdm/`
        const files = fs.readdirSync(dc)
        for (const elem of files) {
          const curFile = dc + elem
          if (!fs.statSync(`/${curFile}`).isDirectory()) {
            let content = fs.readFileSync(curFile, 'utf8')
            const find = '[Seat:*]'
            if (content.includes(find)) {
              const regex = new RegExp(`autologin-user\\s*=\\s*${olduser}`, 'g') // remove spaces
              content = content.replace(regex, `autologin-user=${newuser}`)
              fs.writeFileSync(curFile, content, 'utf8')
            }
          }
        }
      } else if (Pacman.packageIsInstalled('lxdm')) {
        let lxdmConf = '/etc/lxdm/lxdm.conf'
        if (fs.existsSync(lxdmConf)) {
          let content = fs.readFileSync(lxdmConf, 'utf8')
          const regex = new RegExp(`autologin\\s*=\\s*${olduser}`, 'g') // remove spaces            
          content = content.replace(regex, `autologin=${newuser}`)
          fs.writeFileSync(lxdmConf, content, 'utf8')
          console.log(content)
        }
      } else if (Pacman.packageIsInstalled('sddm')) {
        /**
         * SDDM
         */
        let sddmChanged = false
        const curFile = `${chroot}/etc/sddm.conf`
        if (fs.existsSync(curFile)) {
          let content = fs.readFileSync(curFile, 'utf8')
          const find = '[Autologin]'
          if (content.includes(find)) {
            const regex = new RegExp(`User\\s*=\\s*${olduser}`, 'g') // replace space
            content = content.replace(regex, `User=${newuser}`)
            fs.writeFileSync(curFile, content, 'utf8')
            sddmChanged = true
          }
        }

        if (!sddmChanged) {
          const dc = `${chroot}/etc/sddm.conf.d/`
          if (fs.existsSync(dc)) {
            const files = fs.readdirSync(dc)
            for (const elem of files) {
              const curFile = dc + elem
              let content = fs.readFileSync(curFile, 'utf8')
              const find = '[Autologin]'
              if (content.includes(find)) {
                const regex = new RegExp(`User\\s*=\\s*${olduser}`, 'g') // replace space
                content = content.replace(regex, `User=${newuser}`)
                fs.writeFileSync(curFile, content, 'utf8')
                sddmChanged = true
              }
            }
          }
        }

        // sddm.conf don't exists, generate it
        if (!sddmChanged) {
          let session = 'plasma'
          if (Pacman.isInstalledWayland()) {
            session = 'plasma-wayland'
          }

          const content = `[Autologin]\nUser=${newuser}\nSession=${session}\n`
          const curFile = `${chroot}/etc/sddm.conf`
          fs.writeFileSync(curFile, content, 'utf8')
        }
      } else if (Pacman.packageIsInstalled('gdm') || Pacman.packageIsInstalled('gdm3')) {
        /**
         * GDM/GDM3
         * in manjaro è /etc/gdm/custom.conf
         */
        let gdmConf = `${chroot}/etc/gdm3`
        if (Pacman.packageIsInstalled('gdm3')) {
          gdmConf = `${chroot}/etc/gdm3`
        } else if (Pacman.packageIsInstalled('gdm')) {
          gdmConf = `${chroot}/etc/gdm`
        }

        if (fs.existsSync(`${gdmConf}/custom.conf`)) {
          gdmConf += '/custom.conf'
        } else if (fs.existsSync(`${gdmConf}/daemon.conf`)) {
          gdmConf += '/daemon.conf'
        } else {
          gdmConf = `}/etc/${gdmConf}/custom.conf`
        }

        const content = `[daemon]\nAutomaticLoginEnable=true\nAutomaticLogin=${newuser}\n`
        Utils.write(gdmConf, content)
      }
    }
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
   * @param path
   * @param verbose
   */
  static async mk(chroot: string, path: string, verbose = false) {
    const echo = Utils.setEcho(verbose)

    if (!fs.existsSync(chroot + path)) {
      await exec(`mkdir ${chroot}${path}`, echo)
    }
  }

  /**
   * Copia della configurazione in /etc/skel
   * @param user
   * @param verbose
   */
  static async skel(user: string, verbose = false) {
    const echo = Utils.setEcho(verbose)

    // Remove and create /etc/skel
    await exec('rm /etc/skel -rf', echo)
    await exec('mkdir -p /etc/skel', echo)

    // copy .bash_logout, .bashrc and .profile to /etc/skel
    await exec(`cp /home/${user}/.bash_logout /etc/skel`, echo)
    await exec(`cp /home/${user}/.bashrc /etc/skel`, echo)
    await exec(`cp /home/${user}/.profile /etc/skel`, echo)

    /**
     * copy desktop configuration
     */
    if (Pacman.packageIsInstalled('gnome-session')) {
      // we need a more clean solution
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.gtkrc-2.0`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('cinnamon-common')) {
      // before the check was against cinnamon-core
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
      // use .cinnamon NOT cinnamon/
      // removed because it's not necessary
      // await rsyncIfExist(`/home/${user}/.cinnamon`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('plasma-desktop')) {
      // use .kde NOT .kde/
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.kde`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('lxde-core')) {
      // we need a more clean solution
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.gtkrc-2.0`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('lxqt-session')) {
      // we need a more clean solution
      await rsyncIfExist(`/home/${user}/.config/lxqt`, '/etc/skel/.config', verbose)
      await rsyncIfExist(`/home/${user}/.gtkrc-2.0`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('mate-session-manager')) {
      // we need a more clean solution
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.gtkrc-2.0`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('xfce4-session')) {
      // use .config/xfce4 NOT .config/xfce4/
      await rsyncIfExist(`/home/${user}/.config/xfce4`, '/etc/skel/.config', verbose)
      await exec('mkdir /etc/skel/.local/share -p', echo)
      await rsyncIfExist(`/home/${user}/.local/share/recently-used.xbel`, '/etc/skel/.local/share', verbose)
    }

    /**
     * special cases
     */

    // Riccardo suggestion
    await rsyncIfExist(`/home/${user}/.mozilla`, '/etc/skel', verbose)
    await rsyncIfExist(`/home/${user}/.kodi`, '/etc/skel', verbose)

    // waydroid
    if (fs.existsSync(`/home/${user}/waydroid-package-manager`)) {
      await rsyncIfExist(`/home/${user}/waydroid-package-manager`, '/etc/skel', verbose)
    }

    // LinuxFX
    if (fs.existsSync(`/home/${user}/.linuxfx`)) {
      // we need to copy: .linuxfx ,kde and ,cinnamon
      await rsyncIfExist(`/home/${user}/.cinnamon`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.kde`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.linuxfx`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.local`, '/etc/skel', verbose)
    }

    await exec('chown root:root /etc/skel -R', echo)
    await exec('chmod a+rwx,g-w,o-w /etc/skel/ -R', echo)
    await execIfExist('chmod a+rwx,g-w-x,o-wx', '/etc/skel/.bashrc', verbose)
    await execIfExist('chmod a+rwx,g-w-x,o-wx', '/etc/skel/.bash_logout', verbose)
    await execIfExist('chmod a+rwx,g-w-x,o-wx', '/etc/skel/.profile', verbose)

    // quirinux
    const distro = new Distro()
    if (distro.distroId === 'Quirinux') {
      await exec('chmod -R 777 /etc/skel/.config')
      await exec('chmod -R 777 /etc/xdg/autostart') // here we must change ***
      await exec('chmod -R 777 /home/*/.config')
      await exec('chmod -R 777 /opt/estilos-general/.config')
      await exec('chmod -R 777 /opt/estilos/.config')
      await exec('chmod -R 777 /usr/bin/iniciar-asistente')

      // Copy xfce4-theme-switcher
      await exec('mkdir /etc/skel/.config/xfce4-theme-switcher -p', echo)
      await rsyncIfExist(`/home/${user}/.config/xfce4-theme-switcher`, '/etc/skel/.config/xfce4-theme-switcher', verbose)
    }

    /**
     * ALL Desktops:
     */
    // Emer Chen suggestion
    await rmIfExist('/etc/skel/.config/user-dirs.dirs')
    await rmIfExist('/etc/skel/.config/user-dirs.locale')
    await rmIfExist('/etc/skel/.config/gtk-3.0/bookmarks/', 'r')

    // Manuel Senpai suggestion
    // await exec(`grep -IE -r /etc/skel -e ${user}`)
    await rmIfExist('/etc/skel/.local/share/recently-used.xbel')
    await rmIfExist('/etc/skel/.config/xfce4/desktop/', 'r')
  }

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
          retval = path.basename(shx.exec(`sudo -u ${await Utils.getPrimaryUser()} xdg-user-dir ${dir}`, { silent: true }).stdout.trim())
        }
      })
    }

    return retval
  }
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

/**
 *
 */
async function rsyncIfExist(source: string, dest = '/etc/skel/', verbose = false) {
  const echo = Utils.setEcho(verbose)
  if (fs.existsSync(source)) {
    await exec(`rsync -avx ${source} ${dest}`, echo)
  }
}

/**
 *
 * @param file2Remove
 * @param recursive
 */
async function rmIfExist(file2Remove: string, recursive = '') {
  if (fs.existsSync(file2Remove)) {
    await exec(`rm -f${recursive} ${file2Remove}`)
  }
}

