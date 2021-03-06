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
      if (Pacman.isGui()) {
         if (Pacman.packageIsInstalled('lightdm')) {
            // Lightdm
            shx.sed('-i', `autologin-user=${olduser}`, `autologin-user=${newuser}`, `${chroot}/etc/lightdm/lightdm.conf`)
         }

         // sddm
         if (Pacman.packageIsInstalled('sddm')) {
            let fileConf = `${chroot}/etc/sddm.conf`
            if (fs.existsSync(fileConf)) {
               shx.sed('-i', `User=${olduser}`, `User=${newuser}`, fileConf)
            } else {
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

         // slim
         if (Pacman.packageIsInstalled('slim')) {
            shx.sed('-i', `autologin no`, `autologin yes`, `${chroot}/etc/slim.conf`)
            shx.sed('-i', `default_user ${olduser}`, `default_user ${newuser}`, `${chroot}/etc/slim.conf`)
         }

         // gdm3
         if (Pacman.packageIsInstalled('gdm3')) {
            // [daemon]
            // AutomaticLoginEnable=True
            // AutomaticLogin=live
            shx.sed('-i', `AutomaticLoginEnable=False`, `AutomaticLoginEnable=True`, `${chroot}/etc/gdm3/custom.conf`)
            shx.sed('-i', `AutomaticLogin=${olduser}`, `AutomaticLogin=artisan=${newuser}`, `${chroot}/etc/gdm3/custom.conf`)
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
         console.log('preparing /etc/skel\n')
      }


      /**
       * Salva la vecchia skel in skel_data_ora.backup
       * 
       * used just during debug
       */
      // const ovary = new Ovary()
      // await ovary.fertilization()
      // await exec(`mv /etc/skel ${ovary.settings.config.snapshot_dir}skel_${Utils.formatDate(new Date())}.backup`, echo)

      // Crea nuova skel
      await exec(`mkdir -p /etc/skel`, echo)

      // echo $XDG_CURRENT_DESKTOP
      const files = ['.bashrc', '.bash_logout', '.config', '.local', '.profile']

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
      for (const i in files) {
         if (fs.existsSync(`/home/${user}/${files[i]}`)) {
            await exec(`cp -r /home/${user}/${files[i]} /etc/skel/ `, echo)
         }
      }

      // Copio autocomplete per eggs
      // await exec(`mkdir /etc/skel/.cache/penguins-eggs -p`)
      // await exec(`cp -r /home/${user}/.cache/penguins-eggs/*  /etc/skel/.cache/penguins-eggs`)

      // Eseguo la pulizia dei dati personali in skel

      // .config
      // await execIfExist(`rm -rf`, `/etc/skel/.config/autostart`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/balena-etcher-electron`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/bleachbit`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/cinnamon-session`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/Code`, verbose)
      // await execIfExist(`rm -rf`, `/etc/skel/.config/configstore`, verbose)
      // await execIfExist(`rm -rf`, `/etc/skel/.config/dconf`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/dleyna-server-service.conf`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/enchant`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/eog`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/filezilla`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/gedit`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/GIMP`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/Gitter`, verbose)
      // await execIfExist(`rm -rf`, `/etc/skel/.config/gnote`, verbose)
      // await execIfExist(`rm -rf`, `/etc/skel/.config/goa-1.0`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/google-chrome`, verbose)
      // await execIfExist(`rm -rf`, `/etc/skel/.config/gtk-2.0`, verbose)
      // await execIfExist(`rm -rf`, `/etc/skel/.config/gtk-3.0`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/ibus`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/inkscape`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/kazam`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/KeePass`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/libreoffice`, verbose)
      // await execIfExist(`rm -rf`, `/etc/skel/.config/menus`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/mimeapps.list`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/mpv`, verbose)
      // await execIfExist(`rm -rf`, `/etc/skel/.config/nemo`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/obs-studio`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/plank`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/Postman`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/procps`, verbose)
      // await execIfExist(`rm -rf`, `/etc/skel/.config/pulse`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/QtProject.conf`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/Slack`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/totem`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/transmission`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/Unknown Organization`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/user-dirs.dirs`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/user-dirs.locale`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/virt-viewer`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/yelp`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.config/zoomus.conf`, verbose)

      // .local
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/applications`, verbose)
      // await execIfExist(`rm -rf`, `/etc/skel/.local/share/cinnamon`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/data`, verbose) // MEGAlink
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/desktop-directories`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/gegl-0.4`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/gnote`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/grilo-plugins`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/gsettings-data-convert`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/gstreamer-1.0`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/gvfs-metadata`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/icc`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/icons`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/keyrings`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/nemo`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/plank`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/recently-used.xbel`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/shotwell`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/totem`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/Trash`, verbose)
      await execIfExist(`rm -rf`, `/etc/skel/.local/share/webkitgtk`, verbose)

      // Sistemo i diritti della skel
      await exec(`chmod a+rwx,g-w,o-w /etc/skel/ -R`, echo)

      // Sistemo diriti file eseguibili
      execIfExist(`chmod a+rwx,g-w-x,o-wx`, `/etc/skel/.bashrc`, verbose)
      execIfExist(`chmod a+rwx,g-w-x,o-wx`, `/etc/skel/.bash_logout`, verbose)
      execIfExist(`chmod a+rwx,g-w-x,o-wx`, `/etc/skel/.profile`, verbose)

      await exec(`chown root:root /etc/skel -R`, echo)

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
      if (verbose) {
         console.log(chalk.cyan(`${cmd} ${file}`))
      }
      await exec(`${cmd} ${file}`, echo)
   }
}
