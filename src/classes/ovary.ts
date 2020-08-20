/* eslint-disable valid-jsdoc */
/* eslint-disable no-console */

/**
 * penguins-eggs: ovary.ts VERSIONE DEBIAN-LIVE
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */

// packages
import fs = require('fs')
import path = require('path')
import os = require('os')
import ini = require('ini')
import shx = require('shelljs')
import pjson = require('pjson')
import chalk = require('chalk')

// interfaces
import { IRemix, IDistro, IPackage, IWorkDir, IMyAddons } from '../interfaces'


// libraries
const exec = require('../lib/utils').exec

// classes
import Utils from './utils'
import N8 from './n8'
import Incubator from './incubation/calamares-config'
import Distro from './distro'
import Xdg from './xdg'
import Pacman from './pacman'
import Prerequisites from '../commands/prerequisites'
import Choice = require('inquirer/lib/objects/choice')

/**
 * Ovary:
 */
export default class Ovary {
   app = {} as IPackage

   remix = {} as IRemix

   work_dir = {} as IWorkDir

   distro = {} as IDistro

   incubator = {} as Incubator

   prerequisites = {} as Prerequisites

   i686 = false

   live = false

   force_installer = false

   snapshot_dir = ''

   efi_work = ''

   config_file = '/etc/penguins-eggs.conf' as string

   gui_editor = '/usr/bin/nano' as string

   snapshot_excludes = '/usr/local/share/excludes/penguins-eggs-exclude.list' as string

   edit_boot_menu = false

   kernel_image = '' as string

   user_opt = '' as string // user_live

   user_opt_passwd = '' as string // passwd_live

   root_passwd = '' as string // passwd_root

   pmount_fixed = false

   ssh_pass = false

   netconfig_opt = ''

   ifnames_opt = ''

   timezone_opt = ''

   initrd_image = '' as string

   make_efi = false

   make_isohybrid = false

   make_md5sum = false

   compression = '' as string

   session_excludes = '' as string

   snapshot_basename = '' as string

   eggName = '' // resulting name of the iso

   version = '' as string

   /**
    * Egg
    * @param compression
    */
   constructor(compression = '') {
      this.compression = compression

      this.app.author = 'Piero Proietti'
      this.app.homepage = 'https://github.com/pieroproietti/penguins-eggs'
      this.app.mail = 'piero.proietti@gmail.com'
      this.app.name = pjson.name as string
      this.app.version = pjson.version

      this.live = Utils.isLive()
      this.i686 = Utils.isi686()
      // this.debian_version = Utils.getDebianVersion()
      this.distro = new Distro(this.remix)
   }

   /**
    * inizializzazioni che non possono essere messe nel constructor
    * a causa delle chiamate async.
    * @returns {boolean} success
    */
   async fertilization(): Promise<boolean> {
      if (this.loadSettings()) {
         if (this.listFreeSpace()) {
            if (await Utils.customConfirm('Select yes to continue...'))
               return true
         }
      }
      return false
   }

   /**
    * Load configuration from /etc/penguins-eggs.conf
    * @returns {boolean} Success
    */
   public async loadSettings(verbose = false): Promise<boolean> {
      let foundSettings: boolean

      if (!fs.existsSync(this.config_file)) {
         return false
      }
      const settings = ini.parse(fs.readFileSync(this.config_file, 'utf-8'))

      if (settings.General.snapshot_dir === '') {
         foundSettings = false
      } else {
         foundSettings = true
      }
      this.session_excludes = ''
      this.snapshot_dir = settings.General.snapshot_dir.trim()
      if (!this.snapshot_dir.endsWith('/')) {
         this.snapshot_dir += '/'
      }
      this.work_dir.path = this.snapshot_dir + 'ovarium/'
      this.work_dir.lowerdir = this.work_dir.path + '.overlay/lowerdir'
      this.work_dir.upperdir = this.work_dir.path + '.overlay/upperdir'
      this.work_dir.workdir = this.work_dir.path + '.overlay/workdir'
      this.work_dir.merged = this.work_dir.path + 'filesystem.squashfs'

      this.efi_work = this.work_dir.path + 'efi/'
      this.work_dir.pathIso = this.work_dir.path + 'iso'

      this.snapshot_excludes = settings.General.snapshot_excludes
      this.snapshot_basename = settings.General.snapshot_basename
      if (this.snapshot_basename === 'hostname') {
         this.snapshot_basename = os.hostname()
      }
      this.make_efi = settings.General.make_efi === 'yes'
      if (this.make_efi) {
         if (
            !Pacman.packageIsInstalled('grub-efi-amd64') &&
            !Pacman.packageIsInstalled('grub-efi-ia32')
         ) {
            Utils.error(
               'You choose to create an UEFI image, but miss to install grub-efi-amd64 package.'
            )
            Utils.error('Please install it before to create an UEFI image:')
            Utils.warning('sudo apt install grub-efi-amd64')
            Utils.error('or')
            Utils.warning('sudo apt install grub-efi-ia32')
            Utils.error(
               'or edit /etc/penguins-eggs.conf and set the valuer of make_efi=no'
            )
            this.make_efi = false
         }
      }

      this.make_isohybrid = settings.General.make_isohybrid === 'yes'
      this.make_md5sum = settings.General.make_md5sum === 'yes'
      if (this.compression === '') {
         this.compression = settings.General.compression
      }
      // this.mksq_opt = settings.General.mksq_opt
      this.edit_boot_menu = settings.General.edit_boot_menu === 'yes'
      this.gui_editor = settings.General.gui_editor
      this.force_installer = settings.General.force_installer === 'yes'
      this.kernel_image = settings.General.kernel_image
      this.initrd_image = settings.General.initrd_image
      this.netconfig_opt = settings.General.netconfig_opt
      if (this.netconfig_opt === undefined) {
         this.netconfig_opt = ''
      }
      this.ifnames_opt = settings.General.ifnames_opt
      if (this.ifnames_opt === undefined) {
         this.ifnames_opt = ''
      }
      this.pmount_fixed = settings.General.pmount_fixed === 'yes'
      this.ssh_pass = settings.General.ssh_pass === 'yes'

      /**
       * Use the login name set in the config file. If not set, use the primary
       * user's name. If the name is not "user" then add boot option. ALso use
       * the same username for cleaning geany history.
       */
      this.user_opt = settings.General.user_opt

      if (this.user_opt === undefined || this.user_opt === '') {
         this.user_opt = shx
            .exec('awk -F":" \'/1000:1000/ { print $1 }\' /etc/passwd', {
               silent: true
            })
            .stdout.trim()
         if (this.user_opt === '') {
            this.user_opt = 'live'
         }
      }
      this.user_opt_passwd = settings.General.user_opt_passwd
      if (this.user_opt_passwd === '') {
         this.user_opt_passwd = 'evolution'
      }

      this.root_passwd = settings.General.root_passwd
      if (this.root_passwd === '') {
         this.root_passwd = 'evolution'
      }

      const timezone = shx
         .exec('cat /etc/timezone', { silent: true })
         .stdout.trim()
      this.timezone_opt = `timezone=${timezone}`
      return foundSettings
   }

   /**
    * showSettings
    */
   public async showSettings() {
      console.log(`application_nane:  ${this.app.name} ${this.app.version}`)
      console.log(`config_file:       ${this.config_file}`)
      console.log(`snapshot_dir:      ${this.snapshot_dir}`)
      console.log(`snapshot_basename: ${this.snapshot_basename}`)
      console.log(`snapshot_exclude:  ${this.snapshot_excludes}`)
      console.log(`kernel_image:      ${this.kernel_image}`)
      console.log(`initrd_image:      ${this.initrd_image}`)
      console.log(`work_dir:          ${this.work_dir.path}`)
      console.log(`efi_work:          ${this.efi_work}`)
      console.log(`make_efi:          ${this.make_efi}`)
      console.log(`make_md5sum:       ${this.make_md5sum}`)
      console.log(`make_isohybrid:    ${this.make_isohybrid}`)
      console.log(`compression:       ${this.compression}`)
      console.log(`edit_boot_menu:    ${this.edit_boot_menu}`)
      console.log(`gui_editor:        ${this.gui_editor}`)
      console.log(`force_installer:   ${this.force_installer}`)
      console.log(`user_opt:          ${this.user_opt}`)
      console.log(`netconfig_opt:     ${this.netconfig_opt}`)
      console.log(`ifnames_opt:       ${this.ifnames_opt}`)
      console.log(`pmount_fixed:      ${this.pmount_fixed}`)
      console.log(`ssh_pass:          ${this.ssh_pass}`)
      if (this.make_efi) {
         if (!Pacman.packageIsInstalled('grub-efi-amd64')) {
            Utils.error(
               'You choose to create an UEFI image, but miss to install grub-efi-amd64 package.'
            )
            Utils.error('Please install it before to create an UEFI image:')
            Utils.warning('sudo apt install grub-efi-amd64')
            this.make_efi = false
         }
         if (!Pacman.packageIsInstalled('dosfstools')) {
            Utils.error(
               'You choose to create an UEFI image, but miss to install dosfstools package.'
            )
            Utils.error('Please install it before to create an UEFI image:')
            Utils.warning('sudo apt install dosfstools')
            this.make_efi = false
         }
      }
   }

   /**
    * Calculate and show free space on the disk
    * @returns {void}
    */
   async listFreeSpace(): Promise<void> {
      const path: string = this.snapshot_dir // convert to absolute path
      if (!fs.existsSync(this.snapshot_dir)) {
         fs.mkdirSync(this.snapshot_dir)
      }
      /** Lo spazio usato da SquashFS non è stimabile da live
       * errore buffer troppo piccolo
       */
      const gb = 1048576
      let spaceUsed = 0
      let spaceAvailable = 0
      if (!Utils.isLive()) {
         spaceUsed = Number(
            shx.exec("df /home | /usr/bin/awk 'NR==2 {print $3}'", {
               silent: true
            }).stdout
         )
         console.log(
            `Disk used space: ${
            Math.round((Utils.getUsedSpace() / gb) * 10) / 10
            } GB`
         )
      }

      spaceAvailable = Number(
         shx
            .exec(`df "${path}" | /usr/bin/awk 'NR==2 {print $4}'`, {
               silent: true
            })
            .stdout.trim()
      )
      console.log(
         `Space available: ${Math.round((spaceAvailable / gb) * 10) / 10} GB`
      )
      console.log(
         `There are ${Utils.getSnapshotCount(
            this.snapshot_dir
         )} snapshots taking ${
         Math.round((Utils.getSnapshotSize() / gb) * 10) / 10
         } GB of disk space.`
      )
      console.log()

      if (spaceAvailable > gb * 3) {
         console.log(
            chalk.cyanBright('The free space should  be sufficient to hold the')
         )
         console.log(chalk.cyanBright('compressed data from the system'))
      } else {
         console.log(
            chalk.redBright('The free space should be insufficient') + '.'
         )
         console.log()
         console.log('If necessary, you can create more available space')
         console.log('by removing previous  snapshots and saved copies:')
      }
   }

   /**
    * 
    * @param basename 
    * @param theme
    */
   public async loadRemix(basename = '', theme = '') {
      this.remix.versionNumber = Utils.getPackageVersion()
      this.remix.kernel = Utils.kernerlVersion()

      if (theme === '') {
         this.remix.branding = 'eggs'
      } else {
         this.remix.branding = theme
      }

      if (basename !== '') {
         this.remix.name = basename
         this.remix.versionName = basename
      } else {
         this.remix.name = this.snapshot_basename
         this.remix.versionName = this.snapshot_basename
      }
   }

   /**
    *
    * @param basename
    */

   async produce(basename = '', script_only = false, theme = '', myAddons: IMyAddons, verbose = false) {
      const echo = Utils.setEcho(verbose)

      if (!fs.existsSync(this.snapshot_dir)) {
         shx.mkdir('-p', this.snapshot_dir)
      }

      await this.loadRemix(basename, theme)

      if (await Utils.isLive()) {
         console.log(
            chalk.red(
               '>>> eggs: This is a live system! An egg cannot be produced from an egg!'
            )
         )
      } else {
         if (verbose) {
            console.log(`
             egg ${this.remix.name}`)
         }

         await this.liveCreateStructure(verbose)
         if (Pacman.packageIsInstalled('calamares')) {
            await this.calamaresConfigure(verbose)
         }
         console.log(Pacman.packageIsInstalled('calamares'))
         console.log(this.remix)
         //process.exit()
         await this.isoCreateStructure(verbose)
         await this.isolinuxPrepare(verbose)
         await this.isoStdmenuCfg(verbose)
         await this.isolinuxCfg(verbose)
         await this.isoMenuCfg()
         await this.copyKernel()
         if (this.make_efi) {
            await this.makeEfi(verbose)
         }
         await this.bindLiveFs(verbose)
         await this.createUserLive(theme, myAddons, verbose)
         await this.editLiveFs(verbose)
         await this.editBootMenu(verbose)

         await this.makeSquashfs(script_only, verbose)
         if (this.make_efi) {
            await this.editEfi(verbose)
         }
         await this.mkIso(script_only, verbose)
         await this.uBindLiveFs(verbose)
      }
   }

   /**
    * Crea la struttura della workdir
    */
   async liveCreateStructure(verbose = false) {
      if (verbose) {
         console.log('Overy: liveCreateStructure')
      }

      Utils.warning(`Creatings egg in ${this.work_dir.path}`)

      if (!fs.existsSync(this.work_dir.path)) {
         shx.mkdir('-p', this.work_dir.path)
      }

      if (!fs.existsSync(this.work_dir.path + '/README.md')) {
         shx.cp(
            path.resolve(__dirname, '../../conf/ovary.md'),
            this.work_dir.path + 'README.md'
         )
      }

      if (!fs.existsSync(this.work_dir.lowerdir)) {
         shx.mkdir('-p', this.work_dir.lowerdir)
      }
      if (!fs.existsSync(this.work_dir.upperdir)) {
         shx.mkdir('-p', this.work_dir.upperdir)
      }
      if (!fs.existsSync(this.work_dir.workdir)) {
         shx.mkdir('-p', this.work_dir.workdir)
      }
      if (!fs.existsSync(this.work_dir.merged)) {
         shx.mkdir('-p', this.work_dir.merged)
      }
   }

   /**
    * calamaresConfigura
    * Installa calamares se force_installer=yes e lo configura
    */
   async calamaresConfigure(verbose = false) {
      if (verbose) {
         console.log('ovary: calamaresConfigure')
      }
      if (Pacman.isXInstalled()) {
         // Se force_installer e calamares non è installato
         if (
            this.force_installer &&
            !(await Pacman.prerequisitesCalamaresCheck())
         ) {
            console.log(
               'Installing ' +
               chalk.bgGray('calamares') +
               ' due force_installer=yes.'
            )
            await Pacman.prerequisitesCalamaresInstall(verbose)
            await Pacman.clean(verbose)
         }
         // Configuro calamares
         this.incubator = new Incubator(this.remix, this.distro, this.user_opt, verbose)
         this.incubator.config()
      }
   }

   /**
    * editLiveFs
    * - Truncate logs, remove archived log
    * - Allow all fixed drives to be mounted with pmount
    * - Enable or disable password login trhough ssh for users (not root)
    * - Create an empty /etc/fstab
    * - Blanck /etc/machine-id
    * - Add some basic files to /dev
    * - Clear configs from /etc/network/interfaces, wicd and NetworkManager and netman
    */
   async editLiveFs(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         console.log('ovary: editLiveFs')
      }

      // sudo systemctl disable wpa_supplicant

      // Truncate logs, remove archived logs.
      let cmd = `find ${this.work_dir.merged}/var/log -name "*gz" -print0 | xargs -0r rm -f`
      await exec(cmd, echo)
      cmd = `find ${this.work_dir.merged}/var/log/ -type f -exec truncate -s 0 {} \\;`
      await exec(cmd, echo)

      // Allow all fixed drives to be mounted with pmount
      if (this.pmount_fixed) {
         if (fs.existsSync(`${this.work_dir.merged}/etc/pmount.allow`))
            await exec(
               `sed -i 's:#/dev/sd\[a-z\]:/dev/sd\[a-z\]:' ${this.work_dir.merged}/pmount.allow`,
               echo
            )
      }

      // Enable or disable password login through ssh for users (not root)
      // Remove obsolete live-config file
      if (
         fs.existsSync(
            `${this.work_dir.merged}lib/live/config/1161-openssh-server`
         )
      ) {
         await exec(
            'rm -f "$work_dir"/myfs/lib/live/config/1161-openssh-server',
            echo
         )
      }
      if (fs.existsSync(`${this.work_dir.merged}/etc/ssh/sshd_config`)) {
         await exec(
            `sed -i 's/PermitRootLogin yes/PermitRootLogin prohibit-password/' ${this.work_dir.merged}/etc/ssh/sshd_config`,
            echo
         )
         if (this.ssh_pass) {
            await exec(
               `sed -i 's|.*PasswordAuthentication.*no|PasswordAuthentication yes|' ${this.work_dir.merged}/etc/ssh/sshd_config`,
               echo
            )
         } else {
            await exec(
               `sed -i 's|.*PasswordAuthentication.*yes|PasswordAuthentication no|' ${this.work_dir.merged}/etc/ssh/sshd_config`,
               echo
            )
         }
      }

      /**
       * /etc/fstab should exist, even if it's empty,
       * to prevent error messages at boot
       */
      await exec(`rm ${this.work_dir.merged}/etc/fstab`, echo)
      await exec(`touch ${this.work_dir.merged}/etc/fstab`, echo)

      /**
       * Blank out systemd machine id. If it does not exist, systemd-journald
       * will fail, but if it exists and is empty, systemd will automatically
       * set up a new unique ID.
       */
      if (fs.existsSync(`${this.work_dir.merged}/etc/machine-id`)) {
         await exec(`rm ${this.work_dir.merged}/etc/machine-id`, echo)
         await exec(`touch ${this.work_dir.merged}/etc/machine-id`, echo)
         Utils.write(`${this.work_dir.merged}/etc/machine-id`, ':')
      }

      /**
       * LMDE4: utilizza UbuntuMono16.pf2
       * aggiungo un link a /boot/grub/fonts/UbuntuMono16.pf2
       */
      shx.cp(
         `${this.work_dir.merged}/boot/grub/fonts/unicode.pf2`,
         `${this.work_dir.merged}/boot/grub/fonts/UbuntuMono16.pf2`
      )

      /**
       * Su DEVUAN NON Esiste systemd
       */
      if (this.distro.distroId !== 'Devuan') {
         /**
         * SU UBUNTU E DERIVATE NON DISABILITARE systemd-resolved.service
         */
         if (this.distro.distroLike !== 'Ubuntu') {
            await exec(
               `chroot ${this.work_dir.merged} systemctl disable systemd-resolved.service`
            )
         }
         await exec(`chroot ${this.work_dir.merged} systemctl disable systemd-networkd.service`)

         await exec(
            `chroot ${this.work_dir.merged} systemctl disable remote-cryptsetup.target`
         )
         await exec(
            `chroot ${this.work_dir.merged} systemctl disable speech-dispatcherd.service`
         )
         await exec(
            `chroot ${this.work_dir.merged} systemctl disable wpa_supplicant-nl80211@.service`
         )
         await exec(
            `chroot ${this.work_dir.merged} systemctl disable wpa_supplicant@.service`
         )
         await exec(
            `chroot ${this.work_dir.merged} systemctl disable wpa_supplicant-wired@.service`
         )
      }

      // Probabilmente non necessario
      // shx.touch(`${this.work_dir.merged}/etc/resolv.conf`)

      /**
       * Clear configs from /etc/network/interfaces, wicd and NetworkManager
       * and netman, so they aren't stealthily included in the snapshot.
       */
      if (fs.existsSync(`${this.work_dir.merged}/etc/network/interfaces`)) {
         await exec(`rm ${this.work_dir.merged}/etc/network/interfaces`, echo)
      }
      await exec(`touch ${this.work_dir.merged}/etc/network/interfaces`, echo)
      Utils.write(
         `${this.work_dir.merged}/etc/network/interfaces`,
         'auto lo\niface lo inet loopback'
      )

      await exec(
         `rm -f ${this.work_dir.merged}/var/lib/wicd/configurations/*`,
         echo
      )
      await exec(
         `rm -f ${this.work_dir.merged}/etc/wicd/wireless-settings.conf`,
         echo
      )

      await exec(
         `rm -f ${this.work_dir.merged}/etc/NetworkManager/system-connections/*`,
         echo
      )

      await exec(`rm -f ${this.work_dir.merged}/etc/network/wifi/*`, echo)


      /**
       * Andiamo a fare pulizia in /etc/network/:
       * if-down.d  if-post-down.d  if-pre-up.d  if-up.d  interfaces  interfaces.d
       */
      const cleanDirs = [
         'if-down.d',
         'if-post-down.d',
         'if-pre-up.d',
         'if-up.d',
         'interfaces.d'
      ]
      let cleanDir = ''
      for (cleanDir of cleanDirs) {
         await exec(
            `rm -f ${this.work_dir.merged}/etc/network/${cleanDir}/wpasupplicant`,
            echo
         )
      }

      /**
       * add some basic files to /dev
       */
      /*
    await exec(`mknod -m 622 ${this.work_dir.merged}/dev/console c 5 1`, echo)
    await exec(`mknod -m 666 ${this.work_dir.merged}/dev/null c 1 3`, echo)
    await exec(`mknod -m 666 ${this.work_dir.merged}/dev/zero c 1 5`, echo)
    await exec(`mknod -m 666 ${this.work_dir.merged}/dev/ptmx c 5 2`, echo)
    await exec(`mknod -m 666 ${this.work_dir.merged}/dev/tty c 5 0`, echo)
    await exec(`mknod -m 444 ${this.work_dir.merged}/dev/random c 1 8`, echo)
    await exec(`mknod -m 444 ${this.work_dir.merged}/dev/urandom c 1 9`, echo)
    await exec(`chown -v root:tty ${this.work_dir.merged}/dev/{console,ptmx,tty}`, echo)
  
    await exec(`ln -sv /proc/self/fd ${this.work_dir.merged}/dev/fd`, echo)
    await exec(`ln -sv /proc/self/fd/0 ${this.work_dir.merged}/dev/stdin`, echo)
    await exec(`ln -sv /proc/self/fd/1 ${this.work_dir.merged}/dev/stdout`, echo)
    await exec(`ln -sv /proc/self/fd/2 ${this.work_dir.merged}/dev/stderr`, echo)
    await exec(`ln -sv /proc/kcore ${this.work_dir.merged}/dev/core`, echo)
    await exec(`mkdir -v ${this.work_dir.merged}/dev/shm`, echo)
    await exec(`mkdir -v ${this.work_dir.merged}/dev/pts`, echo)
    await exec(`chmod 1777 ${this.work_dir.merged}/dev/shm`, echo)
    */
   }

   /**
    * editBootMenu
    */
   async editBootMenu(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         console.log('ovary: editBootMenu')
      }

      let cmd = ''
      if (this.edit_boot_menu) {
         cmd = `${this.gui_editor} ${this.work_dir.path}/iso/isolinux/menu.cfg`
         await exec(cmd, echo)
         if (this.make_efi) {
            cmd = `${this.gui_editor} ${this.work_dir.path}/iso/boot/grub/grub.cfg`
            await exec(cmd, echo)
         }
      }
   }

   /**
    *  async isoCreateStructure() {
    */
   async isoCreateStructure(verbose = false) {
      if (verbose) {
         console.log('ovary: createStructure')
      }

      if (!fs.existsSync(this.work_dir.pathIso)) {
         shx.mkdir('-p', `${this.work_dir.pathIso}/boot/grub/x86_64-efi`)
         shx.mkdir('-p', `${this.work_dir.pathIso}/efi/boot`)
         shx.mkdir('-p', `${this.work_dir.pathIso}/isolinux`)
         shx.mkdir('-p', `${this.work_dir.pathIso}/live`)
      }
   }

   async isolinuxPrepare(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         console.log('ovary: isolinuxPrepare')
      }

      const isolinuxbin = `${this.distro.isolinuxPath}isolinux.bin`
      const vesamenu = `${this.distro.syslinuxPath}vesamenu.c32`

      await exec(
         `rsync -a ${this.distro.syslinuxPath}chain.c32 ${this.work_dir.pathIso}/isolinux/`,
         echo
      )
      await exec(
         `rsync -a ${this.distro.syslinuxPath}ldlinux.c32 ${this.work_dir.pathIso}/isolinux/`,
         echo
      )
      await exec(
         `rsync -a ${this.distro.syslinuxPath}libcom32.c32 ${this.work_dir.pathIso}/isolinux/`,
         echo
      )
      await exec(
         `rsync -a ${this.distro.syslinuxPath}libutil.c32 ${this.work_dir.pathIso}/isolinux/`,
         echo
      )
      await exec(
         `rsync -a ${isolinuxbin} ${this.work_dir.pathIso}/isolinux/`,
         echo
      )
      await exec(
         `rsync -a ${vesamenu} ${this.work_dir.pathIso}/isolinux/`,
         echo
      )
   }

   /**
    *
    * @param verbose
    */
   async isoStdmenuCfg(verbose = false) {
      if (verbose) {
         console.log('ovary: isoStdmenuCfg')
      }

      const file = `${this.work_dir.pathIso}/isolinux/stdmenu.cfg`
      const text = `menu background splash.png
    menu color title	* #FFFFFFFF *
    menu color border	* #00000000 #00000000 none
    menu color sel		* #ffffffff #76a1d0ff *
    menu color hotsel	1;7;37;40 #ffffffff #76a1d0ff *
    menu color tabmsg	* #ffffffff #00000000 *
    menu color help		37;40 #ffdddd00 #00000000 none
    # XXX When adjusting vshift, take care that rows is set to a small
    # enough value so any possible menu will fit on the screen,
    # rather than falling off the bottom.
    menu vshift 8
    menu rows 8
    # The help line must be at least one line from the bottom.
    menu helpmsgrow 14
    # The command line must be at least one line from the help line.
    menu cmdlinerow 16
    menu timeoutrow 16
    menu tabmsgrow 18
    menu tabmsg Press ENTER to boot or TAB to edit a menu entry`

      Utils.write(file, text)
   }

   /**
    * create isolinux.cfg
    * @param verbose
    */
   isolinuxCfg(verbose = false) {
      if (verbose) {
         console.log('ovary: isolinuxCfg')
      }
      const file = `${this.work_dir.pathIso}/isolinux/isolinux.cfg`
      const text = `# D-I config version 2.0
# search path for the c32 support libraries (libcom32, libutil etc.)
path 
include menu.cfg
default vesamenu.c32
prompt 0
timeout 200\n`
      Utils.write(file, text)
   }

   async isoMenuCfg(verbose = false) {
      /**
       *
       * debconf                 allows one to apply arbitrary preseed files placed on the live media or an http/ftp server.
       * hostname                configura i file /etc/hostname e /etc/hosts.
       * user-setup              aggiunge un account per l'utente live.
       * sudo                    concede i privilegi per sudo all'utente live.
       * locales                 configura la localizzazione.
       * locales-all             configura locales-all.
       * tzdata                  configura il file /etc/timezone.
       * gdm3                    configura il login automatico per gdm3.
       * kdm                     configura il login automatico per kdm.
       * lightdm                 configura il login automatico per lightdm.
       * lxdm                    configura il login automatico per lxdm.
       * nodm                    configura il login automatico per nodm.
       * slim                    configura il login automatico per slim.
       * xinit                   configura il login automatico con xinit.
       * keyboard-configuration  configura la tastiera.
       * systemd                 configura il login automatico con systemd.
       * sysvinit                configura sysvinit.
       * sysv-rc                 configura sysv-rc disabilitando i servizi elencati.
       * login                   disabilita lastlog.
       * apport                  disabilita apport.
       * gnome-panel-data        disabilita il pulsante di blocco dello schermo.
       * gnome-power-manager     disabilita l'ibernazione.
       * gnome-screensaver       disabilita lo screensaver che blocca lo schermo.
       * kaboom                  disabilita la procedura guidata di migrazione di KDE (squeeze e successive).
       * kde-services            disabilita i servizi di KDE non voluti (squeeze e successive).
       * policykit               concede i privilegi per l'utente tramite policykit.
       * ssl-cert                rigenera certificati ssl snake-oil.
       * anacron                 disabilita anacron.
       * util-linux              disabilita hwclock (parte di util-linux).
       * login                   disabilita lastlog.
       * xserver-xorg            configura xserver-xorg.
       * broadcom-sta            configura il driver per broadcom-sta WLAN.
       * openssh-server          ricrea le chiavi di openssh-server.
       * xfce4-panel             configura xfce4-panel con le impostazioni predefinite.
       * xscreensaver            disabilita lo screensaver che blocca lo schermo.
       * hooks                   allows one to run arbitrary commands from a file placed on the live media or an http/ftp server.
       *
       */

      const mpath = `${this.work_dir.pathIso}/isolinux/menu.cfg`
      const spath = `${this.work_dir.pathIso}/isolinux/splash.png`

      fs.copyFileSync(
         path.resolve(__dirname, '../../conf/isolinux.menu.cfg.template'),
         mpath
      )
      fs.copyFileSync(
         path.resolve(__dirname, '../../assets/penguins-eggs-splash.png'),
         spath
      )

      shx.sed('-i', '%custom-name%', this.remix.name, mpath)
      shx.sed('-i', '%kernel%', Utils.kernerlVersion(), mpath)
      shx.sed('-i', '%vmlinuz%', `/live${this.kernel_image}`, mpath)
      shx.sed('-i', '%initrd-img%', `/live${this.initrd_image}`, mpath)
      shx.sed('-i', '%username-opt%', this.user_opt, mpath)
      shx.sed('-i', '%netconfig-opt%', this.netconfig_opt, mpath)
      shx.sed('-i', '%timezone-opt%', this.timezone_opt, mpath)
   }

   /**
    * copy kernel
    */
   async copyKernel(verbose = false) {
      if (verbose) {
         console.log('ovary: liveKernel')
      }
      shx.cp(this.kernel_image, `${this.work_dir.pathIso}/live/`)
      shx.cp(this.initrd_image, `${this.work_dir.pathIso}/live/`)
   }

   /**
    * squashFs: crea in live filesystem.squashfs
    */
   async makeSquashfs(script_only = false, verbose = false) {
      let echo = { echo: false, ignore: false }
      if (verbose) {
         echo = { echo: true, ignore: false }
      }

      if (verbose) {
         console.log('ovary: makeSquashfs')
      }

      /**
       * exclude all the accurence of cryptdisks in rc0.d, etc
       */
      // let fexcludes = ["/boot/efi/EFI", "/etc/fstab", "/etc/mtab", "/etc/udev/rules.d/70-persistent-cd.rules", "/etc/udev/rules.d/70-persistent-net.rules"]
      // for (let i in fexcludes) {
      //  this.addRemoveExclusion(true, fexcludes[i])
      // }
      const rcd = [
         'rc0.d',
         'rc1.d',
         'rc2.d',
         'rc3.d',
         'rc4.d',
         'rc5.d',
         'rc6.d',
         'rcS.d'
      ]
      let files: string[]
      for (const i in rcd) {
         files = fs.readdirSync(`${this.work_dir.merged}/etc/${rcd[i]}`)
         for (const n in files) {
            if (files[n].includes('cryptdisks')) {
               this.addRemoveExclusion(true, `/etc/${rcd[i]}${files[n]}`)
            }
         }
      }

      if (
         shx.exec('/usr/bin/test -L /etc/localtime', { silent: true }) &&
         shx.exec('cat /etc/timezone', { silent: true }) !== 'Europe/Rome'
      ) {
         this.addRemoveExclusion(true, '/etc/localtime')
      }

      this.addRemoveExclusion(true, this.snapshot_dir /* .absolutePath() */)

      const compression = `-comp ${this.compression}`
      if (fs.existsSync(`${this.work_dir.pathIso}/live/filesystem.squashfs`)) {
         fs.unlinkSync(`${this.work_dir.pathIso}/live/filesystem.squashfs`)
      }
      // let cmd = `mksquashfs ${this.work_dir.merged} ${this.work_dir.pathIso}/live/filesystem.squashfs ${compression} ${(this.mksq_opt === '' ? '' : ' ' + this.mksq_opt)} -wildcards -ef ${this.snapshot_excludes} ${this.session_excludes} `
      let cmd = `mksquashfs ${this.work_dir.merged} ${this.work_dir.pathIso}/live/filesystem.squashfs ${compression} -wildcards -ef ${this.snapshot_excludes} ${this.session_excludes} `
      cmd = cmd.replace(/\s\s+/g, ' ')
      Utils.writeX(`${this.work_dir.path}mksquashfs`, cmd)
      if (!script_only) {
         await exec(cmd, echo)
      }
   }

   /**
    * Restituisce true per le direcory da montare con overlay
    * @param dir
    */
   needOverlay(dir: string): boolean {
      // const excludeDirs = ['cdrom', 'dev', 'home', 'live', 'media', 'mnt', 'proc', 'run', 'sys', 'swapfile', 'tmp']
      const mountDirs = ['etc', 'var', 'boot']
      let mountDir = ''
      let overlay = false
      for (mountDir of mountDirs) {
         if (mountDir === dir) {
            overlay = true
         }
      }
      return overlay
   }

   /**
    * Ritorna true se c'è bisogno del mount --bind
    * @param dir
    * @returns bind
    */
   onlyMerged(dir: string): boolean {
      // 'home' viene adesso con merge
      const noDirs = [
         'cdrom',
         'dev',
         'live',
         'home',
         'media',
         'mnt',
         'proc',
         'run',
         'sys',
         'swapfile',
         'tmp'
      ]

      // deepin
      noDirs.push('data')
      noDirs.push('recovery')

      let noDir = ''
      let bind = true
      for (noDir of noDirs) {
         if (dir === noDir) {
            bind = false
         }
      }
      return bind
   }

   /**
    * Esegue il bind del fs live
    *
    * Dato che adesso crea lo script bind,
    * sarebbe forse meglio che NON eseguisse
    * i comandi e, quindi,
    * if (!script_only) {
    *    await exec('${this.work_dir.path}bind)
    * }
    * @param verbose
    */
   async bindLiveFs(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         console.log('ovary: bindLiveFs')
      }

      const dirs = [
         'bin',
         'boot',
         'dev',
         'etc',
         'home',
         'lib',
         'lib32',
         'lib64',
         'libx32',
         'media',
         'mnt',
         'opt',
         'proc',
         'root',
         'run',
         'sbin',
         'srv',
         'sys',
         'tmp',
         'usr',
         'var'
      ]
      /**
       * Attenzione: 
       * fs.readdirSync('/', { withFileTypes: true })
       * viene ignorato da Node8, ma da problemi da Node10 in poi
       */
      const rootDirs = fs.readdirSync('/')
      const startLine = `#############################################################`
      const titleLine = `# -----------------------------------------------------------`
      const endLine = `# ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n`

      let lnkDest = ''
      let cmd = ''
      const cmds: string[] = []
      cmds.push(
         `# NOTE: home, cdrom, dev, live, media, mnt, proc, run, sys and tmp`
      )
      cmds.push(`#       need just a mkdir in ${this.work_dir.merged}`)
      cmds.push(`# host: ${os.hostname()} user: ${Utils.getPrimaryUser()}\n`)

      for (const dir of rootDirs) {
         // const dirname = N8.dirent2string(dir)
         const dirname = dir
         console.log(`>>>>>>>>>>>>>>> ${dirname} <<<<<<<<<<<<<<<<<<`)
         cmds.push(startLine)
         if (N8.isDirectory(dirname)) {
            if (dirname !== 'lost+found') {
               cmd = `# /${dirname} is a directory`
               if (this.needOverlay(dirname)) {
                  cmds.push(`${cmd} and need to be written`)
                  cmds.push(titleLine)
                  cmds.push(`# create mountpoint lower`)
                  cmds.push(
                     await makeIfNotExist(
                        `${this.work_dir.lowerdir}/${dirname}`
                     )
                  )
                  cmds.push(
                     `# first: mount /${dir} rw in ${this.work_dir.lowerdir}/${dirname}`
                  )
                  cmds.push(
                     await rexec(
                        `mount --bind --make-slave /${dir} ${this.work_dir.lowerdir}/${dirname}`,
                        echo
                     )
                  )
                  cmds.push(`# now remount it ro`)
                  cmds.push(
                     await rexec(
                        `mount -o remount,bind,ro ${this.work_dir.lowerdir}/${dirname}`,
                        echo
                     )
                  )
                  cmds.push(
                     `\n# second: create mountpoint upper, work and ${this.work_dir.merged} and mount ${dirname}`
                  )
                  cmds.push(
                     await makeIfNotExist(
                        `${this.work_dir.upperdir}/${dirname}`,
                        verbose
                     )
                  )
                  cmds.push(
                     await makeIfNotExist(
                        `${this.work_dir.workdir}/${dirname}`,
                        verbose
                     )
                  )
                  cmds.push(
                     await makeIfNotExist(
                        `${this.work_dir.merged}/${dirname}`,
                        verbose
                     )
                  )

                  cmds.push(
                     `\n# thirth: mount /${dirname} rw in ${this.work_dir.merged}`
                  )
                  cmds.push(
                     await rexec(
                        `mount -t overlay overlay -o lowerdir=${this.work_dir.lowerdir}/${dirname},upperdir=${this.work_dir.upperdir}/${dir},workdir=${this.work_dir.workdir}/${dir} ${this.work_dir.merged}/${dirname}`,
                        echo
                     )
                  )
               } else {
                  cmds.push(`${cmd} who don't need to be written`)
                  cmds.push(titleLine)
                  cmds.push(
                     `# mount -o bind /${dirname} ${this.work_dir.merged}/${dirname}`
                  )
                  cmds.push(
                     await makeIfNotExist(
                        `${this.work_dir.merged}/${dir}`,
                        verbose
                     )
                  )
                  if (this.onlyMerged(dirname)) {
                     cmds.push(
                        await makeIfNotExist(
                           `${this.work_dir.merged}/${dirname}`,
                           verbose
                        )
                     )
                     cmds.push(
                        await rexec(
                           `mount --bind --make-slave /${dirname} ${this.work_dir.merged}/${dirname}`,
                           echo
                        )
                     )
                     cmds.push(
                        await rexec(
                           `mount -o remount,bind,ro ${this.work_dir.merged}/${dirname}`,
                           echo
                        )
                     )
                  }
               }
            }
         } else if (N8.isFile(dirname)) {
            cmds.push(`# /${dirname} is just a file`)
            cmds.push(titleLine)
            if (!fs.existsSync(`${this.work_dir.merged}/${dirname}`)) {
               cmds.push(
                  await rexec(`cp /${dir} ${this.work_dir.merged}`, echo)
               )
            } else {
               cmds.push('# file exist... skip')
            }
         } else if (N8.isSymbolicLink(dirname)) {
            lnkDest = fs.readlinkSync(`/${dirname}`)
            cmds.push(
               `# /${dirname} is a symbolic link to /${lnkDest} in the system`
            )
            cmds.push(`# we need just to recreate it`)
            cmds.push(
               `# ln -s ${this.work_dir.merged}/${lnkDest} ${this.work_dir.merged}/${lnkDest}`
            )
            cmds.push(
               `# but we don't know if the destination exist, and I'm too lazy today. So, for now: `
            )
            cmds.push(titleLine)
            if (!fs.existsSync(`${this.work_dir.merged}/${dirname}`)) {
               if (fs.existsSync(lnkDest)) {
                  cmds.push(
                     `ln -s ${this.work_dir.merged}/${lnkDest} ${this.work_dir.merged}/${lnkDest}`
                  )
               } else {
                  cmds.push(
                     await rexec(`cp -r /${dir} ${this.work_dir.merged}`, echo)
                  )
               }
            } else {
               cmds.push('# SymbolicLink exist... skip')
            }
         }
         console.log()
         cmds.push(endLine)
      }
      Utils.writeXs(`${this.work_dir.path}bind`, cmds)
   }

   /**
    * ubind del fs live
    * @param verbose
    */
   async uBindLiveFs(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         console.log('ovary: uBindLiveFs')
      }

      const cmds: string[] = []
      cmds.push(
         `# NOTE: home, cdrom, dev, live, media, mnt, proc, run, sys and tmp`
      )
      cmds.push(`#       need just to be removed in ${this.work_dir.merged}`)
      cmds.push(`# host: ${os.hostname()} user: ${Utils.getPrimaryUser()}\n`)

      // await exec(`/usr/bin/pkill mksquashfs; /usr/bin/pkill md5sum`, {echo: true})
      if (fs.existsSync(this.work_dir.merged)) {
         const bindDirs = fs.readdirSync(this.work_dir.merged, {
            withFileTypes: true
         })
         for (const dir of bindDirs) {
            const dirname = N8.dirent2string(dir)

            cmds.push(`#############################################################`)
            if (N8.isDirectory(dirname)) {
               cmds.push(`\n# directory: ${dirname}`)
               if (this.needOverlay(dirname)) {
                  cmds.push(`\n# ${dirname} has overlay`)
                  cmds.push(`\n# First, umount it from ${this.work_dir.path}`)
                  cmds.push(await rexec(`umount ${this.work_dir.merged}/${dirname}`,echo))

                  cmds.push(`\n# Second, umount it from ${this.work_dir.lowerdir}`)
                  cmds.push(await rexec(`umount ${this.work_dir.lowerdir}/${dirname}`,echo))
               } else if (this.onlyMerged(dirname)) {
                  cmds.push(await rexec(`umount ${this.work_dir.merged}/${dirname}`,echo))
               }
               cmds.push(`\n# remove in ${this.work_dir.merged} and ${this.work_dir.lowerdir}`)
               cmds.push(await rexec(`rm ${this.work_dir.merged}/${dirname} -rf`, echo))
               cmds.push(await rexec(`rm ${this.work_dir.lowerdir}/${dirname} -rf`,echo))
            } else if (N8.isFile(dirname)) {
               cmds.push(`\n# ${dirname} = file`)
               cmds.push(await rexec(`rm ${this.work_dir.merged}/${dirname}`, echo))
            } else if (N8.isSymbolicLink(dirname)) {
               cmds.push(`\n# ${dirname} = symbolicLink`)
               cmds.push(
                  await rexec(`rm ${this.work_dir.merged}/${dirname}`, echo)
               )
            }
         }
      }
      Utils.writeXs(`${this.work_dir.path}ubind`, cmds)
   }

   /**
    * create la home per user_opt
    * @param verbose
    */
   async createUserLive(theme = 'eggs', myAddons: IMyAddons, verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         console.log('ovary: createUserLive')
      }

      /**
       * delete all user in chroot
       */
      const cmds: string[] = []
      const cmd = `chroot ${this.work_dir.merged} getent passwd {1000..60000} |awk -F: '{print $1}'`
      const result = await exec(cmd, {
         echo: verbose,
         ignore: false,
         capture: true
      })
      const users: string[] = result.data.split('\n')
      for (let i = 0; i < users.length - 1; i++) {
         cmds.push(
            await rexec(
               `chroot ${this.work_dir.merged} deluser ${users[i]}`,
               echo
            )
         )
      }

      cmds.push(await rexec(`chroot ${this.work_dir.merged} adduser ${this.user_opt} --home /home/${this.user_opt} --shell /bin/bash --disabled-password --gecos ",,,"`, echo))
      cmds.push(await rexec(`chroot ${this.work_dir.merged} echo ${this.user_opt}:${this.user_opt_passwd} | chroot ${this.work_dir.merged} chpasswd `, echo))
      cmds.push(await rexec(`chroot ${this.work_dir.merged} usermod -aG sudo ${this.user_opt}`, echo)
      )

      /**
       * Cambio passwd su root in chroot
       */
      cmds.push(await rexec(`chroot ${this.work_dir.merged} echo root:${this.root_passwd} | chroot ${this.work_dir.merged} chpasswd `, echo))

      /**
       * Solo per sistemi grafici
       */
      if (Pacman.isXInstalled()) {
         let traduce = true
         if (fs.existsSync('/etc/skel/Desktop')){
            traduce = false
         }
         await Xdg.create(this.user_opt, this.work_dir.merged, traduce, verbose)
         const pathHomeLive = `/home/${this.user_opt}`
         let pathToDesktopLive: string
         pathToDesktopLive = pathHomeLive + '/' + Xdg.traduce('DESKTOP',traduce)

         // Copia icona penguins-eggs
         shx.cp(path.resolve(__dirname, '../../assets/eggs.png'), '/usr/share/icons/')

         /**
          * creazione dei link in /usr/share/applications
          */
         shx.cp(path.resolve(__dirname, '../../assets/penguins-eggs.desktop'), '/usr/share/applications/')
         shx.cp(path.resolve(__dirname, '../../assets/penguins-eggs-adapt.desktop'), '/usr/share/applications/')
         shx.cp(path.resolve(__dirname, '../../assets/penguins-eggs-installer.desktop'), '/usr/share/applications/')
         shx.cp(path.resolve(__dirname, `../../addons/${theme}/theme/applications/debian-install.desktop`), `/usr/share/applications/`)

         // Copia link comuni sul desktop
         shx.cp('/usr/share/applications/penguins-eggs.desktop', `${this.work_dir.merged}${pathToDesktopLive}`)

         if (myAddons.dwagent) {
            let dirAddon = path.resolve(__dirname, `../../addons/eggs/dwagent`)
            shx.cp(`${dirAddon}/applications/dwagent.desktop`, `${this.work_dir.merged}/usr/share/applications/`)
            shx.cp(`${dirAddon}/bin/dwagent.sh`, `${this.work_dir.merged}/usr/local/bin/`)
            shx.cp(`${dirAddon}/artwork/remote-assistance.png`, `${this.work_dir.merged}/usr/share/icons/`)
            shx.cp(`${this.work_dir.merged}/usr/share/applications/dwagent.desktop`, `${this.work_dir.merged}${pathToDesktopLive}`)
         }

         if (myAddons.installer_choice) {
            let dirAddon = path.resolve(__dirname, `../../addons/eggs/installer-choice/`)
            shx.cp(`${dirAddon}/applications/installer-choice.desktop`, `${this.work_dir.merged}/usr/share/applications/`)
            shx.cp(`${dirAddon}/bin/installer-choice.sh`, `${this.work_dir.merged}/usr/local/bin/`)
            shx.mkdir('-p', `${this.work_dir.merged}/usr/local/share/penguins-eggs/`)
            shx.cp(`${dirAddon}/html/installer-choice.html`, `${this.work_dir.merged}/usr/local/share/penguins-eggs/`)
            shx.cp(`${this.work_dir.merged}/usr/share/applications/installer-choice.desktop`, `${this.work_dir.merged}${pathToDesktopLive}`)
         }

         if (myAddons.proxmox_ve) {
            let dirAddon = path.resolve(__dirname, `../../addons/eggs/proxmox-ve`)
            shx.cp(`${dirAddon}/applications/proxmox-ve.desktop`, `${this.work_dir.merged}/usr/share/applications/`)
            // shx.cp(`${dirAddon}/bin/dwagent.sh`, `${this.work_dir.merged}/usr/local/bin/`)
            shx.cp(`${dirAddon}/artwork/proxmox-ve.png`, `${this.work_dir.merged}/usr/share/icons/`)
            shx.cp(`${this.work_dir.merged}/usr/share/applications/proxmox-ve.desktop`, `${this.work_dir.merged}${pathToDesktopLive}`)
         }

         // Solo per lxde, lxqt, mate, xfce e deepin-desktop installa adjust per ridimensionare il video
         if (
            Pacman.packageIsInstalled('lxde-core') ||
            Pacman.packageIsInstalled('lxqt-core') ||
            Pacman.packageIsInstalled('deepin-desktop-base') ||
            Pacman.packageIsInstalled('mate-desktop') ||
            Pacman.packageIsInstalled('ubuntu-mate-core') ||
            Pacman.packageIsInstalled('xfce4')
         ) {
            shx.cp('/usr/share/applications/penguins-eggs-adjust.desktop', `${this.work_dir.merged}${pathToDesktopLive}`)
         }

         // Seleziona tra eggs-installer e calamares
         if (Pacman.packageIsInstalled('calamares')) {
            shx.cp('/usr/share/applications/install-debian.desktop', `${this.work_dir.merged}${pathToDesktopLive}`)
         } else {
            shx.cp('/usr/share/applications/penguins-eggs-installer.desktop', `${this.work_dir.merged}${pathToDesktopLive}`)
         }

         // Rendo avviabili i link del Desktop
         await exec(`chmod a+x ${this.work_dir.merged}${pathToDesktopLive}/*.desktop`,echo)

         // ed imposto la home di /home/live a live:live
         await exec(`chroot ${this.work_dir.merged}  chown ${this.user_opt}:${this.user_opt} ${pathHomeLive} -R`,echo)
         // await exec(`chown 1000:1000 ${this.work_dir.merged}${pathHomeLive} -R`, echo)

         /**
          * Solo per GNOME
          * Rendo trusted i link
          * funziona solo montando /dev
          * NON FUNZIONANTE!!!
          */
         if (Pacman.packageIsInstalled('gnome-shell-NOT_USED_FOR_NOW')) {
            // Monto /dev
            await makeIfNotExist(`${this.work_dir.merged}/dev`, verbose)
            await exec(
               `mount --bind --make-slave /dev ${this.work_dir.merged}/dev`,
               echo
            )
            // await exec(`mount -o remount,bind,ro ${this.work_dir.merged}/dev`, echo)

            await exec(
               `chroot ${this.work_dir.merged} sudo -u ${this.user_opt} dbus-launch gio set file://${pathToDesktopLive}/dwagent-sh.desktop metadata::trusted true`,
               echo
            )
            await exec(
               `chroot ${this.work_dir.merged} sudo -u ${this.user_opt} dbus-launch gio set file://${pathToDesktopLive}/penguins-eggs-adjust.desktop metadata::trusted true`,
               echo
            )
            await exec(
               `chroot ${this.work_dir.merged} sudo -u ${this.user_opt} dbus-launch gio set file://${pathToDesktopLive}/penguins-eggs.desktop metadata::trusted true`,
               echo
            )

            // smonto devpts
            if (Utils.isMountpoint(`${this.work_dir.merged}/dev/devpts`)) {
               await exec(`umount ${this.work_dir.merged}/dev/devpts`, echo)
            }

            if (Utils.isMountpoint(`${this.work_dir.merged}/dev`)) {
               await exec(`umount ${this.work_dir.merged}/dev`, echo)
            }
         }

         /**
          * Autologin passare a xdg ed aggiungere altri
          */
         Xdg.autologin(
            Utils.getPrimaryUser(),
            this.user_opt,
            this.work_dir.merged
         )
      }
      Utils.writeXs(`${this.work_dir.path}createuserlive`, cmds)
   }

   /**
    * Add or remove exclusion
    * @param add {boolean} true = add, false remove
    * @param exclusion {atring} path to add/remove
    */
   addRemoveExclusion(add: boolean, exclusion: string): void {
      if (exclusion.startsWith('/')) {
         exclusion = exclusion.substring(1) // remove / initial Non compatible with
      }

      if (add) {
         if (this.session_excludes === '') {
            this.session_excludes += `-e '${exclusion}' `
         } else {
            this.session_excludes += ` '${exclusion}' `
         }
      } else {
         this.session_excludes.replace(` '${exclusion}'`, '')
         if (this.session_excludes === '-e') {
            this.session_excludes = ''
         }
      }
   }

   /**
    * makeEfi
    * Create /boot and /efi for UEFI
    */
   async makeEfi(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         console.log('ovary: makeEfi')
      }

      /**
       * Carica il primo grub.cfg dal memdisk, quindi in sequenza
       * grub.cfg1 -> memdisk
       * grub.cfg2 -> /boot/grub/x86_64-efi
       * grub.cfg3 -> /boot/grub
       */

      const tempDir = shx
         .exec('mktemp -d /tmp/work_temp.XXXX', { silent: true })
         .stdout.trim()

      // for initial grub.cfg
      shx.mkdir('-p', `${tempDir}/boot/grub`)
      const grubCfg = `${tempDir}/boot/grub/grub.cfg`
      shx.touch(grubCfg)
      let text = ''
      text += 'search --file --set=root /isolinux/isolinux.cfg\n'
      text += 'set prefix=($root)/boot/grub\n'
      text += 'source $prefix/x86_64-efi/grub.cfg\n'
      Utils.write(grubCfg, text)

      /**
       * Andiamo a costruire efi_work
       */
      if (!fs.existsSync(this.efi_work)) {
         shx.mkdir('-p', this.efi_work)
      }

      // salviamo currentDir
      const currentDir = process.cwd()

      /**
       * efi_work
       */
      process.chdir(this.efi_work)

      /**
       * start with empty directories Clear dir boot and efi
       */
      /*
    const files = fs.readdirSync('.');
    for (var i in files) {
      if (files[i] === './boot') {
        await exec(`rm ./boot -rf`, echo)
      }
      if (files[i] === './efi') {
        await exec(`rm ./efi -rf`, echo)
      }
    }
    */
      shx.mkdir('-p', './boot/grub/x86_64-efi')
      shx.mkdir('-p', './efi/boot')

      // copy splash
      shx.cp(
         path.resolve(__dirname, '../../assets/penguins-eggs-splash.png'),
         `${this.efi_work}/boot/grub/spash.png`
      )

      // second grub.cfg file
      let cmd =
         'for i in $(ls /usr/lib/grub/x86_64-efi|grep part_|grep .mod|sed \'s/.mod//\'); do echo "insmod $i" >> boot/grub/x86_64-efi/grub.cfg; done'
      await exec(cmd, echo)
      // Additional modules so we don't boot in blind mode. I don't know which ones are really needed.
      // cmd = `for i in efi_gop efi_uga ieee1275_fb vbe vga video_bochs video_cirrus jpeg png gfxterm ; do echo "insmod $i" >> boot/grub/x86_64-efi/grub.cfg ; done`
      cmd =
         'for i in efi_gop efi_gop efi_uga gfxterm video_bochs video_cirrus jpeg png ; do echo "insmod $i" >> boot/grub/x86_64-efi/grub.cfg ; done'

      await exec(cmd, echo)

      await exec(
         'echo source /boot/grub/grub.cfg >> boot/grub/x86_64-efi/grub.cfg',
         echo
      )
      /**
       * fine lavoro in efi_work
       */

      // Torniamo alla directory precedente
      process.chdir(tempDir)

      // make a tarred "memdisk" to embed in the grub image
      await exec('tar -cvf memdisk boot', echo)

      // make the grub image
      await exec(
         "grub-mkimage -O x86_64-efi -m memdisk -o bootx64.efi -p '(memdisk)/boot/grub' search iso9660 configfile normal memdisk tar cat part_msdos part_gpt fat ext2 ntfs ntfscomp hfsplus chain boot linux",
         echo
      )

      // pdpd (torna a efi_work)
      process.chdir(this.efi_work)

      // copy the grub image to efi/boot (to go later in the device's root)
      shx.cp(`${tempDir}/bootx64.efi`, './efi/boot')

      // Do the boot image "boot/grub/efiboot.img"
      await exec(
         'dd if=/dev/zero of=boot/grub/efiboot.img bs=1K count=1440',
         echo
      )
      await exec('/sbin/mkdosfs -F 12 boot/grub/efiboot.img', echo)
      shx.mkdir('-p', 'img-mnt')
      await exec('mount -o loop boot/grub/efiboot.img img-mnt', echo)
      shx.mkdir('-p', 'img-mnt/efi/boot')
      shx.cp('-r', `${tempDir}/bootx64.efi`, 'img-mnt/efi/boot/')

      // ###############################

      // copy modules and font
      shx.cp('-r', '/usr/lib/grub/x86_64-efi/*', 'boot/grub/x86_64-efi/')

      // if this doesn't work try another font from the same place (grub's default, unicode.pf2, is much larger)
      // Either of these will work, and they look the same to me. Unicode seems to work with qemu. -fsr
      fs.copyFileSync('/usr/share/grub/unicode.pf2', 'boot/grub/font.pf2')

      // doesn't need to be root-owned ${pwd} = current Directory
      // const user = Utils.getPrimaryUser()
      // await exec(`chown -R ${user}:${user} $(pwd) 2>/dev/null`, echo)
      // console.log(`pwd: ${pwd}`)
      // await exec(`chown -R ${user}:${user} $(pwd)`, echo)

      // Cleanup efi temps
      await exec('umount img-mnt', echo)
      await exec('rmdir img-mnt', echo)

      // popD Torna alla directory corrente
      process.chdir(currentDir)

      // Copy efi files to iso
      await exec(
         `rsync -avx ${this.efi_work}/boot ${this.work_dir.pathIso}/`,
         echo
      )
      await exec(
         `rsync -avx ${this.efi_work}/efi  ${this.work_dir.pathIso}/`,
         echo
      )

      // Do the main grub.cfg (which gets loaded last):
      fs.copyFileSync(
         path.resolve(__dirname, '../../conf/grub/grub.template.cfg'),
         `${this.work_dir.pathIso}/boot/grub/grub.cfg`
      )
      fs.copyFileSync(
         path.resolve(__dirname, '../../conf/grub/theme.cfg'),
         `${this.work_dir.pathIso}/boot/grub/theme.cfg`
      )
      fs.copyFileSync(
         path.resolve(__dirname, '../../conf/grub/loopback.cfg'),
         `${this.work_dir.pathIso}/boot/grub/loopback.cfg`
      )
   }

   /**
    * editEfi
    */
   async editEfi(verbose = false) {
      if (verbose) {
         console.log('editing grub.cfg')
      }
      // editEfi()
      const gpath = `${this.work_dir.pathIso}/boot/grub/grub.cfg`
      shx.sed('-i', '%custom-name%', this.remix.name, gpath)
      shx.sed('-i', '%kernel%', Utils.kernerlVersion(), gpath)
      shx.sed('-i', '%vmlinuz%', `/live${this.kernel_image}`, gpath)
      shx.sed('-i', '%initrd-img%', `/live${this.initrd_image}`, gpath)
      shx.sed('-i', '%username-opt%', this.user_opt, gpath)
      shx.sed('-i', '%netconfig-opt%', this.netconfig_opt, gpath)
      shx.sed('-i', '%timezone-opt%', this.timezone_opt, gpath)
   }

   /**
    * makeIsoImage
    */
   async mkIso(script_only = false, verbose = false) {
      let echo = { echo: false, ignore: false }
      if (verbose) {
         echo = { echo: true, ignore: false }
      }

      if (verbose) {
         console.log('ovary: mkIso')
      }

      let uefi_opt = ''
      if (this.make_efi) {
         uefi_opt =
            '-eltorito-alt-boot -e boot/grub/efiboot.img -isohybrid-gpt-basdat -no-emul-boot'
      }

      let isoHybridOption = `-isohybrid-mbr ${this.distro.isolinuxPath}isohdpfx.bin `

      if (this.make_isohybrid) {
         if (fs.existsSync('/usr/lib/syslinux/mbr/isohdpfx.bin')) {
            isoHybridOption =
               '-isohybrid-mbr /usr/lib/syslinux/mbr/isohdpfx.bin'
         } else if (fs.existsSync('/usr/lib/syslinux/isohdpfx.bin')) {
            isoHybridOption = '-isohybrid-mbr /usr/lib/syslinux/isohdpfx.bin'
         } else if (fs.existsSync('/usr/lib/ISOLINUX/isohdpfx.bin')) {
            isoHybridOption = '-isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin'
         } else {
            Utils.warning(
               "Can't create isohybrid. File: isohdpfx.bin not found. The resulting image will be a standard iso file"
            )
         }

         // xorriso 1.5.0 : RockRidge filesystem manipulator, libburnia project.
         // originale cmd = `xorriso -as mkisofs -r -J -joliet-long -l -iso-level 3 -cache-inodes ${isoHybridOption} -partition_offset 16 -volid ${this.eggName} -b isolinux/isolinux.bin -c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table ${uefi_opt} -o ${this.snapshot_dir}${this.eggName} ${this.work_dir.pathIso}`

         this.eggName = Utils.getFilename(this.remix.name)

         let cmd = `xorriso  -as mkisofs \
                          -volid ${this.eggName} \
                          -joliet-long \
                          -l \
                          -iso-level 3 \
                          -b isolinux/isolinux.bin \
                          ${isoHybridOption} \
                          -partition_offset 16 \
                          -c isolinux/boot.cat \
                          -no-emul-boot \
                          -boot-load-size 4 \
                          -boot-info-table \
                          ${uefi_opt} \
                          -output ${this.snapshot_dir}${this.eggName} \
                          ${this.work_dir.pathIso}`

         cmd = cmd.replace(/\s\s+/g, ' ')
         Utils.writeX(`${this.work_dir.path}mkiso`, cmd)
         if (!script_only) {
            await exec(cmd, echo)
         }

         /**
          * Ultima versione
          * Tolto -cache-inodes (veniva ignorato)
          *
          * Non solo supportati, almeno da xorriso 1.5.0, i flag:
          *   -h 256
          *   -s 63
          *
          * Sarebbero da sostituire i flag brevi con quelli estesi, rimangono:
          *   -l
          *   -b
          *   -c
          *
          * Il seguente è un esempio corrente funzionante:
          *
          * xorriso  -as mkisofs
          *                              volid incubator-x64_2020-06-05_100.iso
          *                              -joliet-long
          *                              -l
          *                              -iso-level 3
          *                              -b isolinux/isolinux.bin
          *                              -isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin
          *                              -partition_offset 16
          *                              -c isolinux/boot.cat
          *                              -no-emul-boot
          *                              -boot-load-size 4
          *                              -boot-info-table
          *                              -output /home/eggs/incubator-x64_2020-06-05_100.iso
          *                              /home/eggs/ovarium/iso
          */
      }
   }

   /**
    * funzioni private
    */

   /**
    * addDebianRepo
    */
   async addDebianRepo(verbose = false) {
      if (verbose) {
         console.log('ovary: addDebianRepo')
      }
      shx.cp('-r', '/home/live/debian-live/*', this.work_dir.pathIso)
   }

   /**
    * only show the result
    */
   finished(script_only = false) {
      Utils.titles('produce')
      if (!script_only) {
         console.log(
            'eggs is finished!\n\nYou can find the file iso: ' +
            chalk.cyanBright(this.eggName) +
            '\nin the nest: ' +
            chalk.cyanBright(this.snapshot_dir) +
            '.'
         )
      } else {
         console.log(
            'eggs is finished!\n\nYou can find the scripts to build iso: ' +
            chalk.cyanBright(this.eggName) +
            '\nin the ovarium: ' +
            chalk.cyanBright(this.work_dir.path) +
            '.'
         )
         console.log(`usage`)
         console.log(chalk.cyanBright(`cd ${this.work_dir.path}`))
         console.log(chalk.cyanBright(`sudo ./bind`))
         console.log(
            `Make all yours modifications in the directories filesystem.squashfs and iso.`
         )
         console.log(`After when you are ready:`)
         console.log(chalk.cyanBright(`sudo ./mksquashfs`))
         console.log(chalk.cyanBright(`sudo ./mkiso`))
         console.log(chalk.cyanBright(`sudo ./ubind`))
         console.log(`happy hacking!`)
      }
   }
}

/**
 * Crea il path se non esiste
 * @param path
 */
async function makeIfNotExist(path: string, verbose = false): Promise<string> {
   if (verbose) {
      console.log('ovary: makeIfNotExist')
   }
   const echo = Utils.setEcho(verbose)
   let cmd = `# ${path} alreasy exist`
   if (!fs.existsSync(path)) {
      cmd = `mkdir ${path} -p`
      await exec(cmd, echo)
   }
   return cmd
}

/**
 * 
 * @param cmd 
 * @param echo 
 */
async function rexec(cmd: string, echo: object): Promise<string> {
   console.log(cmd)
   await exec(cmd, echo)
   return cmd
}
