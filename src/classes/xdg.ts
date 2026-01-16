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

import { execSync , shx } from '../lib/utils.js'
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

  /**
   * Forza l'autologin per il nuovo utente (live) su diversi Display Manager
   * @param newuser Nome dell'utente live da loggare automaticamente
   * @param chroot Percorso della root (default '/')
   */
  static async autologin(newuser: string, chroot = '/') {
    if (!Pacman.isInstalledGui()) return;

    /**
     * SLIM & SLIMSKI
     */
    let slimConf = '';
    if (Pacman.packageIsInstalled('slim')) {
      slimConf = fs.existsSync(`${chroot}/etc/slim.local.conf`) ? 'slim.local.conf' : 'slim.conf';
    } else if (Pacman.packageIsInstalled('slimski')) {
      slimConf = fs.existsSync(`${chroot}/etc/slimski.local.conf`) ? 'slimski.local.conf' : 'slimski.conf';
    }

    if (slimConf !== '') {
      let content = fs.readFileSync(`${chroot}/etc/${slimConf}`, 'utf8');
      content = content.replace(/^#?auto_login\s+.*/m, 'auto_login yes');
      content = content.replace(/^#?default_user\s+.*/m, `default_user ${newuser}`);
      fs.writeFileSync(`${chroot}/etc/${slimConf}`, content, 'utf8');
    }

    /**
     * LIGHTDM
     */
    else if (Pacman.packageIsInstalled('lightdm')) {
      const confPath = `${chroot}/etc/lightdm/lightdm.conf`;
      if (fs.existsSync(confPath)) {
        let content = fs.readFileSync(confPath, 'utf8');
        if (!content.includes('[Seat:*]')) {
          content += '\n[Seat:*]\n';
        }

        // Rimuove eventuali righe esistenti e le aggiunge pulite sotto [Seat:*]
        content = content.replaceAll(/^autologin-user=.*/gm, '');
        content = content.replaceAll(/^autologin-user-timeout=.*/gm, '');
        content = content.replace('[Seat:*]', `[Seat:*]\nautologin-user=${newuser}\nautologin-user-timeout=0`);
        fs.writeFileSync(confPath, content.replaceAll(/\n\n+/g, '\n\n'), 'utf8');
      }
    }

    /**
     * LXDM
     */
    else if (Pacman.packageIsInstalled('lxdm')) {
      const lxdmConf = `${chroot}/etc/lxdm/lxdm.conf`;
      if (fs.existsSync(lxdmConf)) {
        let content = fs.readFileSync(lxdmConf, 'utf8');
        content = content.replace(/^#?\s*autologin=.*/m, `autologin=${newuser}`);
        fs.writeFileSync(lxdmConf, content, 'utf8');
      }
    }

    /**
     * SDDM (Modern approach con file dedicato)
     */
    else if (Pacman.packageIsInstalled('sddm')) {
      const confDir = `${chroot}/etc/sddm.conf.d`;
      if (!fs.existsSync(confDir)) {
        fs.mkdirSync(confDir, { recursive: true });
      }

      let session = 'plasma';
      if (Pacman.isInstalledWayland()) {
        session = fs.existsSync(`${chroot}/usr/share/wayland-sessions/cosmic.desktop`) ? 'cosmic' : 'plasma-wayland';
      }

      const content = `[Autologin]\nUser=${newuser}\nSession=${session}\n`;
      fs.writeFileSync(`${confDir}/eggs-autologin.conf`, content, 'utf8');
    }

    /**
     * GDM / GDM3 (Pop!_OS, Ubuntu, Debian)
     */
    else if (Pacman.packageIsInstalled('gdm') || Pacman.packageIsInstalled('gdm3')) {
      let gdmFile = '';
      const possiblePaths = [
        `${chroot}/etc/gdm3/daemon.conf`,
        `${chroot}/etc/gdm3/custom.conf`,
        `${chroot}/etc/gdm/custom.conf`
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) { gdmFile = p; break; }
      }

      if (gdmFile) {
        let content = fs.readFileSync(gdmFile, 'utf8');
        if (!content.includes('[daemon]')) content = "[daemon]\n" + content;

        // Abilitazione chirurgica
        if (/^#?AutomaticLoginEnable=.*/m.test(content)) {
          content = content.replace(/^#?AutomaticLoginEnable=.*/m, 'AutomaticLoginEnable=true');
        } else {
          content = content.replace('[daemon]', '[daemon]\nAutomaticLoginEnable=true');
        }

        if (/^#?AutomaticLogin=.*/m.test(content)) {
          content = content.replace(/^#?AutomaticLogin=.*/m, `AutomaticLogin=${newuser}`);
        } else {
          content = content.replace('AutomaticLoginEnable=true', `AutomaticLoginEnable=true\nAutomaticLogin=${newuser}`);
        }

        fs.writeFileSync(gdmFile, content, 'utf8');
      }

      /**
       * GREETD / COSMIC (Pop!_OS COSMIC)
       */
    } else if (Pacman.packageIsInstalled('greetd')) {
      const greetdPath = `${chroot}/etc/greetd/cosmic-greeter.toml`;

      // Se esiste la configurazione specifica di COSMIC
      if (fs.existsSync(greetdPath)) {
        let content = fs.readFileSync(greetdPath, 'utf8');

        // Se la sezione [initial_session] esiste già, la aggiorniamo, altrimenti la aggiungiamo
        const initialSessionRegex = /\[initial_session\][^\[]*/;
        const newInitialSession = `[initial_session]\ncommand = "start-cosmic"\nuser = "${newuser}"\n\n`;

        if (initialSessionRegex.test(content)) {
          content = content.replace(initialSessionRegex, newInitialSession);
        } else {
          // La aggiungiamo in testa o dopo la sezione general
          content = newInitialSession + content;
        }

        fs.writeFileSync(greetdPath, content, 'utf8');
      }
      // Fallback per greetd standard (config.toml) se non è COSMIC specifico
      else if (fs.existsSync(`${chroot}/etc/greetd/config.toml`)) {
        const configPath = `${chroot}/etc/greetd/config.toml`;
        let content = fs.readFileSync(configPath, 'utf8');

        // Configurazione per il login automatico su greetd generico
        const autologinConfig = `[initial_session]\ncommand = "start-cosmic"\nuser = "${newuser}"\n`;

        if (!content.includes('[initial_session]')) {
          content = autologinConfig + content;
          fs.writeFileSync(configPath, content, 'utf8');
        }
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

