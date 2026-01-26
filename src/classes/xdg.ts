/**
 * ./src/classes/xdg.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs, { utimesSync } from 'node:fs'
import path from 'node:path'
import os from 'os'

import { execSync, shx } from '../lib/utils.js'
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
   * Forza l'autologin per il nuovo utente (live) su diversi Display Manager
   * @param newuser Nome dell'utente live da loggare automaticamente
   * @param chroot Percorso della root (default '/')
   */
  static async autologin(newuser: string, chroot = '/') {
    if (!Pacman.isInstalledGui()) return

    /**
     * SLIM & SLIMSKI
     */
    let slimConf = ''
    if (Pacman.packageIsInstalled('slim')) {
      slimConf = fs.existsSync(`${chroot}/etc/slim.local.conf`) ? 'slim.local.conf' : 'slim.conf'
    } else if (Pacman.packageIsInstalled('slimski')) {
      slimConf = fs.existsSync(`${chroot}/etc/slimski.local.conf`) ? 'slimski.local.conf' : 'slimski.conf'
    }

    if (slimConf !== '') {
      let content = fs.readFileSync(`${chroot}/etc/${slimConf}`, 'utf8')
      content = content.replace(/^#?auto_login\s+.*/m, 'auto_login yes')
      content = content.replace(/^#?default_user\s+.*/m, `default_user ${newuser}`)
      fs.writeFileSync(`${chroot}/etc/${slimConf}`, content, 'utf8')

    } else if (Pacman.packageIsInstalled('lightdm')) {
      /**
       * LIGHTDM
       */
      const confPath = `${chroot}/etc/lightdm/lightdm.conf`
      if (fs.existsSync(confPath)) {
        let content = fs.readFileSync(confPath, 'utf8')

        // Rimuove eventuali righe esistenti e le aggiunge pulite sotto [Seat:*]
        content = content.replaceAll(/^\s*autologin-user=.*/gm, '')
        content = content.replaceAll(/^\s*autologin-user-timeout=.*/gm, '')

        // Cerca una sezione attiva [Seat:*] (non commentata)
        const seatRegex = /^[ \t]*\[Seat:\*\]/m

        if (seatRegex.test(content)) {
          // Sostituisce la prima occorrenza attiva trovata
          content = content.replace(seatRegex, `[Seat:*]\nautologin-user=${newuser}\nautologin-user-timeout=0`)
        } else {
          // Se non esiste attiva, la aggiunge in fondo
          content += `\n[Seat:*]\nautologin-user=${newuser}\nautologin-user-timeout=0\n`
        }

        fs.writeFileSync(confPath, content.replaceAll(/\n\n+/g, '\n\n'), 'utf8')
      }

    } else if (Pacman.packageIsInstalled('lxdm')) {
      /**
       * LXDM
       */
      const lxdmConf = `${chroot}/etc/lxdm/lxdm.conf`
      if (fs.existsSync(lxdmConf)) {
        let content = fs.readFileSync(lxdmConf, 'utf8')
        content = content.replace(/^#?\s*autologin=.*/m, `autologin=${newuser}`)
        fs.writeFileSync(lxdmConf, content, 'utf8')
      }

    } else if (Pacman.packageIsInstalled('sddm')) {
      /**
       * SDDM (Modern approach con file dedicato)
       */
      const confDir = `${chroot}/etc/sddm.conf.d`
      if (!fs.existsSync(confDir)) {
        fs.mkdirSync(confDir, { recursive: true })
      }

      // --- FIX SESSION DETECTION FOR SDDM ---
      // Invece di defaultare a 'plasma', cerchiamo cosa c'è installato
      let session = ''

      // Helper per cercare la sessione
      const findSession = (dir: string): string => {
        if (!fs.existsSync(dir)) return ''
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.desktop'))
        if (files.length === 0) return ''

        // Priority check
        if (files.includes('lxqt.desktop')) return 'lxqt'
        if (files.includes('xfce.desktop')) return 'xfce'
        if (files.includes('plasma.desktop')) return 'plasma'
        if (files.includes('mate.desktop')) return 'mate'
        if (files.includes('cinnamon.desktop')) return 'cinnamon'
        if (files.includes('i3.desktop')) return 'i3'

        // Fallback al primo trovato rimuovendo .desktop
        return files[0].replace('.desktop', '')
      }

      // 1. Check Wayland se supportato
      if (Pacman.isInstalledWayland()) {
        session = findSession(`${chroot}/usr/share/wayland-sessions`)
      }

      // 2. Se non trovato (o non wayland), check X11
      if (!session) {
        session = findSession(`${chroot}/usr/share/xsessions`)
      }

      // 3. Last resort fallback
      if (!session) session = 'plasma'

      const content = `[Autologin]\nUser=${newuser}\nSession=${session}\nRelogin=false\n`
      fs.writeFileSync(`${confDir}/eggs-autologin.conf`, content, 'utf8')

      // Assicuriamoci che i permessi siano corretti
      // fs.chmodSync(`${confDir}/eggs-autologin.conf`, 0o644)

    } else if (Pacman.packageIsInstalled('gdm') || Pacman.packageIsInstalled('gdm3')) {
      /**
       * GDM / GDM3
       */
      let gdmFile = ''
      const possiblePaths = [`${chroot}/etc/gdm3/daemon.conf`, `${chroot}/etc/gdm3/custom.conf`, `${chroot}/etc/gdm/custom.conf`]

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          gdmFile = p
          break
        }
      }

      if (gdmFile) {
        let content = fs.readFileSync(gdmFile, 'utf8')
        if (!content.includes('[daemon]')) content = '[daemon]\n' + content

        if (/^#?AutomaticLoginEnable=.*/m.test(content)) {
          content = content.replace(/^#?AutomaticLoginEnable=.*/m, 'AutomaticLoginEnable=true')
        } else {
          content = content.replace('[daemon]', '[daemon]\nAutomaticLoginEnable=true')
        }

        if (/^#?AutomaticLogin=.*/m.test(content)) {
          content = content.replace(/^#?AutomaticLogin=.*/m, `AutomaticLogin=${newuser}`)
        } else {
          content = content.replace('AutomaticLoginEnable=true', `AutomaticLoginEnable=true\nAutomaticLogin=${newuser}`)
        }

        fs.writeFileSync(gdmFile, content, 'utf8')
      }

    } else if (Pacman.packageIsInstalled('greetd')) {
      /**
       * GREETD / COSMIC
       */
      const greetdPath = `${chroot}/etc/greetd/cosmic-greeter.toml`

      if (fs.existsSync(greetdPath)) {
        let content = fs.readFileSync(greetdPath, 'utf8')
        const initialSessionRegex = /\[initial_session\][^\[]*/
        const newInitialSession = `[initial_session]\ncommand = "start-cosmic"\nuser = "${newuser}"\n\n`

        if (initialSessionRegex.test(content)) {
          content = content.replace(initialSessionRegex, newInitialSession)
        } else {
          content = newInitialSession + content
        }
        fs.writeFileSync(greetdPath, content, 'utf8')
      }
      else if (fs.existsSync(`${chroot}/etc/greetd/config.toml`)) {
        const configPath = `${chroot}/etc/greetd/config.toml`
        let content = fs.readFileSync(configPath, 'utf8')
        const autologinConfig = `[initial_session]\ncommand = "start-cosmic"\nuser = "${newuser}"\n`

        if (!content.includes('[initial_session]')) {
          content = autologinConfig + content
          fs.writeFileSync(configPath, content, 'utf8')
        }
      }
    }
  }

  /**
   * Create user dirs
   */
  static async create(user: string, chroot: string, traduce = true, verbose = false) {
    xdg_dirs.forEach(async (dir) => {
      if (dir === 'DESKTOP') {
        await Xdg.mk(chroot, `/home/${user}/` + this.traduce(dir, traduce), verbose)
      }
    })
  }

  static async mk(chroot: string, path: string, verbose = false) {
    const echo = Utils.setEcho(verbose)
    if (!fs.existsSync(chroot + path)) {
      await exec(`mkdir ${chroot}${path}`, echo)
    }
  }

  /**
   * Copia della configurazione in /etc/skel
   */
  static async skel(user: string, verbose = false) {
    const echo = Utils.setEcho(verbose)

    await exec('rm /etc/skel -rf', echo)
    await exec('mkdir -p /etc/skel', echo)

    await exec(`cp /home/${user}/.bash_logout /etc/skel`, echo)
    await exec(`cp /home/${user}/.bashrc /etc/skel`, echo)
    await exec(`cp /home/${user}/.profile /etc/skel`, echo)

    /**
     * copy desktop configuration
     */
    if (Pacman.packageIsInstalled('gnome-session')) {
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.gtkrc-2.0`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('cinnamon-common')) {
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('plasma-desktop')) {
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.kde`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('lxde-core')) {
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.gtkrc-2.0`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('lxqt-session')) {
      await rsyncIfExist(`/home/${user}/.config/lxqt`, '/etc/skel/.config', verbose)
      await rsyncIfExist(`/home/${user}/.gtkrc-2.0`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('mate-session-manager')) {
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.gtkrc-2.0`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('xfce4-session')) {
      await rsyncIfExist(`/home/${user}/.config/xfce4`, '/etc/skel/.config', verbose)
      await exec('mkdir /etc/skel/.local/share -p', echo)
      await rsyncIfExist(`/home/${user}/.local/share/recently-used.xbel`, '/etc/skel/.local/share', verbose)
    }

    /**
     * special cases
     */
    await rsyncIfExist(`/home/${user}/.mozilla`, '/etc/skel', verbose)
    await rsyncIfExist(`/home/${user}/.kodi`, '/etc/skel', verbose)

    // waydroid
    if (fs.existsSync(`/home/${user}/waydroid-package-manager`)) {
      await rsyncIfExist(`/home/${user}/waydroid-package-manager`, '/etc/skel', verbose)
    }

    // LinuxFX
    if (fs.existsSync(`/home/${user}/.linuxfx`)) {
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
      await exec('chmod -R 777 /etc/xdg/autostart')
      await exec('chmod -R 777 /home/*/.config')
      await exec('chmod -R 777 /opt/estilos-general/.config')
      await exec('chmod -R 777 /opt/estilos/.config')
      await exec('chmod -R 777 /usr/bin/iniciar-asistente')

      await exec('mkdir /etc/skel/.config/xfce4-theme-switcher -p', echo)
      await rsyncIfExist(`/home/${user}/.config/xfce4-theme-switcher`, '/etc/skel/.config/xfce4-theme-switcher', verbose)
    }

    /**
     * ALL Desktops cleanups
     */
    await rmIfExist('/etc/skel/.config/user-dirs.dirs')
    await rmIfExist('/etc/skel/.config/user-dirs.locale')
    await rmIfExist('/etc/skel/.config/gtk-3.0/bookmarks/', 'r')
    await rmIfExist('/etc/skel/.local/share/recently-used.xbel')
    await rmIfExist('/etc/skel/.config/xfce4/desktop/', 'r')
  }

  static traduce(xdg_dir = '', traduce = true): string {
    let retval = ''
    if (traduce === false) {
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

async function execIfExist(cmd: string, file: string, verbose = false) {
  const echo = Utils.setEcho(verbose)
  if (fs.existsSync(file)) {
    await exec(`${cmd} ${file}`, echo)
  }
}

async function rsyncIfExist(source: string, dest = '/etc/skel/', verbose = false) {
  const echo = Utils.setEcho(verbose)
  if (fs.existsSync(source)) {
    await exec(`rsync -avx ${source} ${dest}`, echo)
  }
}

async function rmIfExist(file2Remove: string, recursive = '') {
  if (fs.existsSync(file2Remove)) {
    await exec(`rm -f${recursive} ${file2Remove}`)
  }
}
