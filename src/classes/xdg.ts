/**
 * xdg-utils
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import shx = require('shelljs')
import fs = require('fs')
import os = require('os')
import path = require('path')
import Ovary from './ovary'
import Pacman from './pacman'
import Utils from './utils'
import chalk = require('chalk')

// libraries
const exec = require('../lib/utils').exec

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
  static traduce(xdg_dir = ''): string {
    let retval = ''
    xdg_dirs.forEach(async dir => {
      if (dir === xdg_dir) {
        retval = path.basename(shx.exec(`sudo -u ${Utils.getPrimaryUser()} xdg-user-dir ${dir}`, { silent: true }).stdout.trim())
      }
    })
    return retval
  }

  /**
     * 
     * @param user 
     * @param chroot 
     * @param verbose 
     */
  static async create(user: string, chroot: string, verbose = false) {
    let echo = Utils.setEcho(verbose)

    xdg_dirs.forEach(async dir => {
      await Xdg.mk(chroot, '/home/live/' + this.traduce(dir), verbose)
    })
  }

  /**
     * 
     * @param chroot 
     * @param pathPromise 
     */
  static async mk(chroot: string, path: string, verbose = false) {
    let echo = Utils.setEcho(verbose)

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
    if (Pacman.packageIsInstalled('lightdm')) {
      shx.sed('-i', `autologin-user=${olduser}`, `autologin-user=${newuser}`, `${chroot}/etc/lightdm/lightdm.conf`)
    }
  }

  /**
     * Copia della cofiguirazione in /etc/skel
     * @param user 
     * @param verbose 
     */
  static async skel(user: string, verbose = false) {
    let echo = Utils.setEcho(verbose)

    if (verbose) {
      console.log('preparing /etc/skel\n')
    }

    const ovary = new Ovary
    await ovary.fertilization()

    /**
         * Salva la vecchia skel in skel_data_ora.backup
         */
    await exec(`mv /etc/skel ${ovary.snapshot_dir}skel_${Utils.formatDate(new Date())}.backup`, echo)

    // Crea nuova skel 
    await exec(`mkdir -p /etc/skel`, echo)

    // echo $XDG_CURRENT_DESKTOP
    let files = [
      '.bashrc',
      '.bash_logout',
      '.config', // genera errore nella costruzione delle directory
      '.local',
      '.profile',
    ]

    // Aggiungo la configurazione del DM usato
    if (Pacman.packageIsInstalled('cinnamon-core')) {
      files.push('.cinnamon')
    }
    if (Pacman.packageIsInstalled('lxde-core')) {
      // files.push('.lxde') Non esiste 
    }
    if (Pacman.packageIsInstalled('lxqt-core')) {
      // files.push('.lxqt')
    }
    if (Pacman.packageIsInstalled('kde-plasma-desktop')) {
      files.push('.kde')
    }



    // Copio da user tutti i files
    for (let i in files) {
      if (fs.existsSync(`/home/${user}/${files[i]}`)) {
        await exec(`cp -r /home/${user}/${files[i]} /etc/skel/ `, echo)
      }
    }

    // Eseguo la pulizia dei dati personali in skel

    


    // .config
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/user-dirs.dirs`, verbose)
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/user-dirs.locale`, verbose)
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/gtk-3.0/bookmarks`, verbose)
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/google-chrome`, verbose)           // google-chrome
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.cinnamon/spices.cache`, verbose)          // cinnamon
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/Code`, verbose)                    // code
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/Slack`, verbose)                   // slack
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/Gitter`, verbose)                  // gitter
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/libreoffice`, verbose)             // libreoffice
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/Postman`, verbose)                 // postman
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/balena-etcher-electron`, verbose)  // balena-etcher-electron
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/GIMP`, verbose)                    // gimp
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/obs-studio`, verbose)              // obs-studio
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/obs-studio`, verbose)              // obs-studio
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/transmission`, verbose)            // transmission
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/inkscape`, verbose)                // inkscape
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/filezilla`, verbose)               // filezilla
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.config/KeePass`, verbose)                 // KeePass
    

    // .local
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.local/share/Trash`, verbose)
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.local/share/gvfs-metadata`, verbose)
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.local/gvfs-metadata`, verbose)
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.local/share/keyrings/login.keyring`, verbose)
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.local/share/keyrings/user.keystore`, verbose)
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.local/share/data`, verbose) // Ci scrive Limited/MEGAsync almeno...
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.local/share/shotwell`, verbose) // shotwell
    await this.modFileIfExist(`rm -rf`, `/etc/skel/.local/share/icons`, verbose) // icons 


    // Sistemo i diritti della skel
    await exec(`chmod a+rwx,g-w,o-w /etc/skel/ -R`, echo)

    // Sistemo diriti file eseguibili
    this.modFileIfExist(`chmod a+rwx,g-w-x,o-wx`, `/etc/skel/.bashrc`, verbose)
    this.modFileIfExist(`chmod a+rwx,g-w-x,o-wx`, `/etc/skel/.bash_logout`, verbose)
    this.modFileIfExist(`chmod a+rwx,g-w-x,o-wx`, `/etc/skel/.profile`, verbose)

    await exec(`chown root:root /etc/skel -R`, echo)

    // https://www.thegeekdiary.com/understanding-the-etc-skel-directory-in-linux/
    // cat /etc/defualt/useradd
    // ls -lart /etc/skel
  }

  /**
    * 
    * @param file 
    */
  static async modFileIfExist(cmd: string, file: string, verbose = false) {
    let echo = Utils.setEcho(verbose)

    if (verbose) {
      console.log(`cmd: ${cmd}`)
      console.log(`file: ${file}`)
      }
      
    if (fs.existsSync(file)) { 
      console.log(chalk.bgWhite.red(`${file} to delete`))
      await exec(`${cmd} ${file}`, echo)
    } else {
      console.log(chalk.green(`${file} not found`))
    }
  }



  /**
     * 
     * @param file 
     */
  static async deleteIfExist(file: string, verbose = false) {
    let echo = Utils.setEcho(verbose)

    if (verbose) console.log(`testing: ${file}`)
    if (fs.existsSync(file)) {
      await exec(`rm -rf ${file}`, echo)
    }
  }

  /**
     * 
     * @param cmd 
     * @param verbose 
     */
  static async showAndExec(cmd: string, verbose = false) {
    let echo = Utils.setEcho(verbose)

    if (verbose) console.log(cmd)
    await exec(cmd, echo)
  }
}
