/* eslint-disable no-console */
/**
 * penguins-eggs: ovary.ts VERSIONE DEBIAN-LIVE
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * Al momento popolo solo le directory live ed isolinux, mentre boot ed EFI no!
 * createStructure
 * isolinuxPrepare, isolinuxCfg
 * liveKernel, liveSquashFs
 * makeIso
 *  xorriso -as mkisofs -r -J -joliet-long -l -cache-inodes -isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin  -partition_offset 16 -volid "Penguin's eggs lm32-mate" -b isolinux/isolinux.bin -c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table -o /home/eggs/lm32-mate_2019-04-17_1830-02.iso /home/eggs/lm32-mate/iso
 */

/**
 * pacchetti 
 * - efibootmgr
 * - grub-efi-amd64-signed
 * - grub-efi-amd64.bin
 * - grub-efi-amd64-signed
 * libefiboot1
 * libefivar1
 * Ci sono tutti!
 */

import fs = require('fs')
import path = require('path')
import os = require('os')
import ini = require('ini')
import shx = require('shelljs')
import pjson = require('pjson')

import Utils from './utils'
import Calamares from './calamares-config'
import Oses from './oses'
import Prerequisites from '../commands/prerequisites'
import { IDistro, IOses, IPackage } from '../interfaces'

const exec = require('../lib/utils').exec

/**
 * Ovary:
 */
export default class Ovary {
  app = {} as IPackage

  distro = {} as IDistro

  oses = {} as Oses

  iso = {} as IOses

  calamares = {} as Calamares

  prerequisites = {} as Prerequisites

  eggName = 'egg'

  i686 = false

  live = false

  force_installer = false

  reset_accounts = false

  debian_version = 10

  snapshot_dir = ''

  work_dir = ''

  efi_work = ''

  config_file = '/etc/penguins-eggs.conf' as string

  gui_editor = '/usr/bin/joe' as string

  snapshot_excludes = '/usr/local/share/excludes/penguins-eggs-exclude.list' as string

  edit_boot_menu = false

  kernel_image = '' as string

  user_live = '' as string

  username_opt = '' as string

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

  mksq_opt = '' as string

  save_message = '' as string

  session_excludes = '' as string

  snapshot_basename = '' as string

  version = '' as string

  bindedFs = false

  /**
   * Egg
   * @param compression
   */
  constructor(compression = '', bindedFs = false) {
    this.compression = compression
    this.bindedFs = bindedFs

    this.app.author = 'Piero Proietti'
    this.app.homepage = 'https://github.com/pieroproietti/penguins-eggs'
    this.app.mail = 'piero.proietti@gmail.com'
    this.app.name = pjson.name as string
    this.app.version = pjson.version

    this.distro.name = os.hostname()
    this.distro.versionName = 'Emperor'
    this.distro.versionNumber = 'zero' // Utils.formatDate()
    this.distro.branding = 'eggs'
    this.distro.kernel = Utils.kernerlVersion()

    this.live = Utils.isLive()

    this.i686 = Utils.isi686()
    this.debian_version = Utils.getDebianVersion()
  }

  /**
  * inizializzazioni che non può essere messa nel constructor
  * a causa della necessità di async.
  * @returns {boolean} success
  */
  async fertilization(): Promise<boolean> {
    this.oses = new Oses()
    this.iso = this.oses.info(this.distro)

    if (this.loadSettings() && this.listFreeSpace()) {
      this.distro.pathHome = this.work_dir + this.distro.name
      this.distro.pathLowerdir = this.distro.pathHome + '/.lowerdir'
      this.distro.pathUpperdir = this.distro.pathHome + '/.upperdir'
      this.distro.pathWorkdir = this.distro.pathHome + '/.workdir'
      this.distro.pathLiveFs = this.distro.pathHome + '/fs'
      this.distro.pathIso = this.distro.pathHome + '/iso'
      let answer = JSON.parse(await Utils.customConfirm(`Select yes to continue...`))
      if (answer.confirm === 'Yes') {
        return true
      }
    }
    return false
  }

  /**
   * Load configuration from /etc/penguins-eggs.conf
   * @returns {boolean} Success
   */
  public async loadSettings(): Promise<boolean> {
    let foundSettings: boolean

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
    this.work_dir = this.snapshot_dir + '.work/'
    this.efi_work = this.work_dir + 'efi-work/'
    this.snapshot_excludes = settings.General.snapshot_excludes
    this.snapshot_basename = settings.General.snapshot_basename
    this.make_efi = settings.General.make_efi === "yes"
    this.make_isohybrid = settings.General.make_isohybrid === "yes"
    this.make_md5sum = settings.General.make_md5sum === "yes"
    if (this.compression === '') {
      this.compression = settings.General.compression
    }
    this.mksq_opt = settings.General.mksq_opt
    this.edit_boot_menu = settings.General.edit_boot_menu === "yes"
    this.gui_editor = settings.General.gui_editor
    this.force_installer = settings.General.force_installer === "yes"
    this.reset_accounts = settings.General.reset_accounts === "yes"
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
    this.pmount_fixed = settings.General.pmount_system === "yes"
    this.ssh_pass = settings.General.ssh_pass === "yes"

    /**
     * Use the login name set in the config file. If not set, use the primary 
     * user's name. If the name is not "user" then add boot option. ALso use
     * the same username for cleaning geany history.
     */
    this.user_live = settings.General.user_live

    if (this.user_live === undefined || this.user_live === '') {
      this.user_live = shx.exec(`awk -F":" '/1000:1000/ { print $1 }' /etc/passwd`).stdout.trim()
      if (this.user_live === '') {
        this.user_live = 'live'
      }
    }
    this.username_opt = `username=${this.user_live}`

    const timezone = shx.exec('cat /etc/timezone', { silent: true }).stdout.trim()
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
    console.log(`snapshot_exclude:  ${this.snapshot_excludes}`)
    if (this.snapshot_basename === 'hostname') {
      console.log(`snapshot_basename: ${os.hostname} (hostname)`)
    } else {
      console.log(`snapshot_basename: ${this.snapshot_basename}`)
    }
    console.log(`work_dir:          ${this.work_dir}`)
    console.log(`efi_work:          ${this.efi_work}`)
    console.log(`make_efi:          ${this.make_efi}`)
    console.log(`make_md5sum:       ${this.make_md5sum}`)
    console.log(`make_isohybrid:    ${this.make_isohybrid}`)
    console.log(`compression:       ${this.compression}`)
    console.log(`mksq_opt:          ${this.mksq_opt}`)
    console.log(`edit_boot_menu:    ${this.edit_boot_menu}`)
    console.log(`gui_editor:        ${this.gui_editor}`)
    console.log(`force_installer:   ${this.force_installer}`)
    console.log(`reset_accounts:    ${this.reset_accounts}`)
    console.log(`kernel_image:      ${this.kernel_image}`)
    console.log(`user_live:         ${this.user_live}`)
    console.log(`initrd_image:      ${this.initrd_image}`)
    console.log(`netconfig_opt:     ${this.netconfig_opt}`)
    console.log(`ifnames_opt:       ${this.ifnames_opt}`)
    console.log(`pmount_fixed:      ${this.pmount_fixed}`)
    console.log(`ssh_pass:          ${this.ssh_pass}`)
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
    // Lo spazio usato da SquashFS non è stimabile da live errore buffer troppo piccolo
    if (!Utils.isLive()) {
      console.log(`Disk used space: ${Utils.getUsedSpace()}`)
    }

    const freeSpace = shx.exec(`df -h "${path}" | /usr/bin/awk 'NR==2 {print $4}'`, { silent: true }).stdout.trim()
    console.log(`Space available: ${freeSpace}`)
    console.log('')
    console.log('The free space should  be sufficient to hold the')
    console.log('compressed data from / and /home')
    console.log('')
    console.log('If necessary, you can create more available space')
    console.log('by removing previous  snapshots and saved copies:')
    console.log(`- ${Utils.getSnapshotCount(this.snapshot_dir)} snapshots are taking up ${Utils.getSnapshotSize(this.snapshot_dir)} of disk space.`)
    console.log('')
  }


  /**
   *
   * @param basename
   */
  async produce(basename = '') {
    if (!fs.existsSync(this.snapshot_dir)) {
      shx.mkdir('-p', this.snapshot_dir)
    }

    if (basename !== '') {
      this.distro.name = basename
    }

    if (await Utils.isLive()) {
      console.log(
        '>>> eggs: This is a live system! An egg cannot be produced from an egg!'
      )
    } else {
      console.log('------------------------------------------')
      console.log('Laying the system into the egg...')
      console.log('------------------------------------------')
      await this.liveCreateStructure()
      await this.calamaresConfigure()
      await this.isoCreateStructure()
      await this.isolinuxPrepare()
      await this.isoStdmenuCfg()
      await this.isolinuxCfg()
      await this.isoMenuCfg()
      await this.copyKernel()
      if (this.make_efi) {
        await this.makeEfi()
      }
      if (this.bindedFs) {
        await this.bindFs() // bind FS
      } else {
        await this.makeFs() // copy fs
      }
      await this.editLiveFs()
      await this.editBootMenu()
      await this.addDebianRepo()
      await this.makeSquashFs()
      await this.uBindFs()
      // await this.cleanUp()
      if (this.make_efi) {
        await this.editEfi()
      }
      await this.makeIsoImage()
    }
  }

  /**
   * 
   */
  async liveCreateStructure() {
    console.log('------------------------------------------')
    console.log('Overy: liveCreateStructure')
    console.log('------------------------------------------')
    if (!fs.existsSync(this.distro.pathLowerdir)) {
      shx.mkdir('-p', this.distro.pathLowerdir)
    }
    if (!fs.existsSync(this.distro.pathUpperdir)) {
      shx.mkdir('-p', this.distro.pathUpperdir)
    }
    if (!fs.existsSync(this.distro.pathWorkdir)) {
      shx.mkdir('-p', this.distro.pathWorkdir)
    }
    if (!fs.existsSync(this.distro.pathLiveFs)) {
      shx.mkdir('-p', this.distro.pathLiveFs)
    }
  }

  /**
   * calamaresConfigura
   * Installa calamares se force_installer=yes e lo configura
   */
  async  calamaresConfigure() {
    // Se force_installer e calamares non è installato
    if (this.force_installer && !Utils.packageIsInstalled('calamares')) {
      shx.exec(`apt-get update`, { async: false })
      shx.exec(`apt-get install --yes \
              calamares \
              calamares-settings-debian`, { async: false })
    }

    // Se calamares è installato allora lo configura
    if (Utils.packageIsInstalled('calamares')) {
      this.calamares = new Calamares(this.distro, this.iso)
      await this.calamares.configure()
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
  async editLiveFs() {
    console.log('==========================================')
    console.log('ovary: editLiveFs')
    console.log('==========================================')

    // Truncate logs, remove archived logs.
    let cmd = `find ${this.distro.pathLiveFs}/var/log -name "*gz" -print0 | xargs -0r rm -f`
    shx.exec(cmd)
    cmd = `find ${this.distro.pathLiveFs}/var/log/ -type f -exec truncate -s 0 {} \\;`
    shx.exec(cmd)

    // Allow all fixed drives to be mounted with pmount
    if (this.pmount_fixed) {
      if (fs.existsSync(`${this.distro.pathLiveFs}/etc/pmount.allow`))
        shx.exec(`sed -i 's:#/dev/sd\[a-z\]:/dev/sd\[a-z\]:' ${this.distro.pathLiveFs}/pmount.allow`)
    }

    // Enable or disable password login through ssh for users (not root)
    // Remove obsolete live-config file
    if (fs.existsSync(`${this.distro.pathLiveFs}lib/live/config/1161-openssh-server`)) {
      shx.exec(`rm -f "$work_dir"/myfs/lib/live/config/1161-openssh-server`)
    }

    shx.exec(`sed -i 's/PermitRootLogin yes/PermitRootLogin prohibit-password/' ${this.distro.pathLiveFs}/etc/ssh/sshd_config`)
    if (this.ssh_pass) {
      shx.exec(`sed -i 's|.*PasswordAuthentication.*no|PasswordAuthentication yes|' ${this.distro.pathLiveFs}/etc/ssh/sshd_config`)
    } else {
      shx.exec(`sed -i 's|.*PasswordAuthentication.*yes|PasswordAuthentication no|' ${this.distro.pathLiveFs}/etc/ssh/sshd_config`)
    }


    /**
     * /etc/fstab should exist, even if it's empty,
     * to prevent error messages at boot
     */
    const text = ''
    if (fs.existsSync(`${this.distro.pathLiveFs}/etc/fstab`)) {
      shx.mkdir('-p', '/tmp/penguins-eggs')
      shx.cp(`${this.distro.pathLiveFs}/etc/fstab`, `/tmp/penguins-eggs`)
    }
    shx.exec(`touch ${this.distro.pathLiveFs}/etc/fstab`, { silent: true })
    Utils.write(`${this.distro.pathLiveFs}/etc/fstab`, text)

    /**
     * Blank out systemd machine id. If it does not exist, systemd-journald
     * will fail, but if it exists and is empty, systemd will automatically
     * set up a new unique ID.
     */
    if (fs.existsSync(`${this.distro.pathLiveFs}/etc/machine-id`)) {
      shx.exec(`touch ${this.distro.pathLiveFs}/etc/machine-id`, { silent: true })
      Utils.write(`${this.distro.pathLiveFs}/etc/machine-id`, `:`)
    }


    /**
     * add some basic files to /dev
     */
    /*
    shx.exec(`mknod -m 622 ${this.distro.pathLiveFs}/dev/console c 5 1`)
    shx.exec(`mknod -m 666 ${this.distro.pathLiveFs}/dev/null c 1 3`)
    shx.exec(`mknod -m 666 ${this.distro.pathLiveFs}/dev/zero c 1 5`)
    shx.exec(`mknod -m 666 ${this.distro.pathLiveFs}/dev/ptmx c 5 2`)
    shx.exec(`mknod -m 666 ${this.distro.pathLiveFs}/dev/tty c 5 0`)
    shx.exec(`mknod -m 444 ${this.distro.pathLiveFs}/dev/random c 1 8`)
    shx.exec(`mknod -m 444 ${this.distro.pathLiveFs}/dev/urandom c 1 9`)
    shx.exec(`chown -v root:tty ${this.distro.pathLiveFs}/dev/{console,ptmx,tty}`)

    shx.exec(`ln -sv /proc/self/fd ${this.distro.pathLiveFs}/dev/fd`)
    shx.exec(`ln -sv ${this.distro.pathLiveFs}/proc/self/fd/0 /dev/stdin`)
    shx.exec(`ln -sv ${this.distro.pathLiveFs}/proc/self/fd/1 /dev/stdout`)
    shx.exec(`ln -sv ${this.distro.pathLiveFs}/proc/self/fd/2 /dev/stderr`)
    shx.exec(`ln -sv ${this.distro.pathLiveFs}/proc/kcore /dev/core`)
    shx.exec(`mkdir -v ${this.distro.pathLiveFs}/dev/shm`)
    shx.exec(`mkdir -v ${this.distro.pathLiveFs}/dev/pts`)
    shx.exec(`chmod 1777 ${this.distro.pathLiveFs}/dev/shm`)
    */

    /**
     * Clear configs from /etc/network/interfaces, wicd and NetworkManager
     * and netman, so they aren't stealthily included in the snapshot.
    */
    shx.exec(`touch ${this.distro.pathLiveFs}/etc/network/interfaces`, { silent: true })
    Utils.write(`${this.distro.pathLiveFs}/etc/network/interfaces`, `auto lo\niface lo inet loopback`)

    shx.exec(`rm -f ${this.distro.pathLiveFs}/var/lib/wicd/configurations/*`)
    shx.exec(`rm -f ${this.distro.pathLiveFs}/etc/wicd/wireless-settings.conf`)
    shx.exec(`rm -f ${this.distro.pathLiveFs}/etc/NetworkManager/system-connections/*`)
    shx.exec(`rm -f ${this.distro.pathLiveFs}/etc/network/wifi/*`)
  }

  /**
   * editBootMenu
   */
  async editBootMenu() {
    let cmd = ''
    if (this.edit_boot_menu) {
      cmd = `${this.gui_editor} ${this.distro.pathHome}/iso/boot/isolinux/menu.cfg`
      console.log(cmd)
      shx.exec(cmd)
      if (this.make_efi) {
        cmd = `${this.gui_editor} ${this.distro.pathHome}/iso/boot/grub/grub.cfg`
        console.log(cmd)
        shx.exec(cmd)
      }
    }
  }

  /**
   *  async isoCreateStructure() {
   */
  async isoCreateStructure() {
    console.log('==========================================')
    console.log('ovary: createStructure')
    console.log('==========================================')

    if (!fs.existsSync(this.distro.pathIso)) {
      shx.mkdir(`-p`, `${this.distro.pathIso}/boot/grub/x86_64-efi`)
      shx.mkdir(`-p`, `${this.distro.pathIso}/efi/boot`)
      shx.mkdir(`-p`, `${this.distro.pathIso}/isolinux`)
      shx.mkdir(`-p`, `${this.distro.pathIso}/live`)
      // shx.mkdir(`-p`, `${this.distro.pathIso}/boot/syslinux`)
    }
  }

  async isolinuxPrepare() {
    console.log('==========================================')
    console.log('ovary: isolinuxPrepare')
    console.log('==========================================')

    const isolinuxbin = `${this.iso.isolinuxPath}isolinux.bin`
    const vesamenu = `${this.iso.syslinuxPath}vesamenu.c32`

    shx.exec(`rsync -a ${this.iso.syslinuxPath}chain.c32 ${this.distro.pathIso}/isolinux/`, { silent: true })
    shx.exec(`rsync -a ${this.iso.syslinuxPath}ldlinux.c32 ${this.distro.pathIso}/isolinux/`, { silent: true })
    shx.exec(`rsync -a ${this.iso.syslinuxPath}libcom32.c32 ${this.distro.pathIso}/isolinux/`, { silent: true })
    shx.exec(`rsync -a ${this.iso.syslinuxPath}libutil.c32 ${this.distro.pathIso}/isolinux/`, { silent: true })
    shx.exec(`rsync -a ${isolinuxbin} ${this.distro.pathIso}/isolinux/`, { silent: true })
    shx.exec(`rsync -a ${vesamenu} ${this.distro.pathIso}/isolinux/`, { silent: true })
  }

  async isoStdmenuCfg() {
    console.log('==========================================')
    console.log('ovary: isoStdmenuCfg')
    console.log('==========================================')

    const file = `${this.distro.pathIso}/isolinux/stdmenu.cfg`
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

  isolinuxCfg() {
    console.log('==========================================')
    console.log('ovary: isolinuxCfg')
    console.log('==========================================')

    const file = `${this.distro.pathIso}/isolinux/isolinux.cfg`
    const text = `# D-I config version 2.0
# search path for the c32 support libraries (libcom32, libutil etc.)
path 
include menu.cfg
default vesamenu.c32
prompt 0
timeout 200\n`
    Utils.write(file, text)
  }

  async isoMenuCfg() {
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


    const mpath = `${this.distro.pathIso}/isolinux/menu.cfg`
    const spath = `${this.distro.pathIso}/isolinux/splash.png`

    fs.copyFileSync(path.resolve(__dirname, '../../conf/isolinux.menu.cfg.template'), mpath)
    fs.copyFileSync(path.resolve(__dirname, '../../assets/penguins-eggs-splash.png'), spath)

    shx.sed('-i', '%custom-name%', this.distro.name, mpath)
    shx.sed('-i', '%kernel%', Utils.kernerlVersion(), mpath)
    shx.sed('-i', '%vmlinuz%', `/live${this.kernel_image}`, mpath)
    shx.sed('-i', '%initrd-img%', `/live${this.initrd_image}`, mpath)
    shx.sed('-i', '%username-opt%', this.username_opt, mpath)
    shx.sed('-i', '%netconfig-opt%', this.netconfig_opt, mpath)
    shx.sed('-i', '%timezone-opt%', this.timezone_opt, mpath)
  }

  /**
   * alive: rende live
   */
  async copyKernel() {
    console.log('==========================================')
    console.log('ovary: liveKernel')
    console.log('==========================================')
    // fs.copyFileSync(this.kernel_image, `${this.distro.pathIso}/live/`)
    // fs.copyFileSync(this.initrd_image, `${this.distro.pathIso}/live/`)
    shx.cp(this.kernel_image, `${this.distro.pathIso}/live/`)
    shx.cp(this.initrd_image, `${this.distro.pathIso}/live/`)
  }


  /**
   * squashFs: crea in live filesystem.squashfs
   */
  async makeSquashFs() {
    console.log('==========================================')
    console.log('ovary: makeSquashFs')
    console.log('==========================================')

    this.addRemoveExclusion(true, this.snapshot_dir /* .absolutePath() */)

    if (this.reset_accounts) {
      // exclude /etc/localtime if link and timezone not America/New_York
      if (shx.exec('/usr/bin/test -L /etc/localtime', { silent: true }) && shx.exec('cat /etc/timezone', { silent: true }) !== 'America/New_York') {
        this.addRemoveExclusion(true, '/etc/localtime')
      }
    }
    const compression = `-comp ${this.compression} `
    let cmd = `mksquashfs ${this.distro.pathLiveFs} ${this.distro.pathIso}/live/filesystem.squashfs ${compression} ${(this.mksq_opt === '' ? '' : ' ' + this.mksq_opt)} -wildcards -ef ${this.snapshot_excludes} ${this.session_excludes} `
    console.log(cmd)
    shx.exec(cmd, { silent: false })
    // usr/bin/mksquashfs /.bind-root iso-template/antiX/linuxfs -comp ${this.compression} ${(this.mksq_opt === '' ? '' : ' ' + this.mksq_opt)} -wildcards -ef ${this.snapshot_excludes} ${this.session_excludes}`)
  }

  /**
   * Return the eggName with architecture and date
   * @param basename
   * @returns eggName
   */
  getFilename(basename = ''): string {
    let arch = 'x64'
    if (Utils.isi686()) {
      arch = 'i386'
    }
    if (basename === '') {
      basename = this.snapshot_basename
    }
    let isoName = `${basename}-${arch}_${Utils.formatDate(new Date())}`
    if (isoName.length >= 28)
      isoName = isoName.substr(0, 28) // 28 +  4 .iso = 32 lunghezza max di volid
    return `${isoName}.iso`
  }

  /**
   * Kill mksquashfs and md5sum...
   * Execute installed-to-live cleanup
   * Remove mx-snapshot in work_dir
   
   */
  async cleanUp() {
    console.log('==========================================')
    console.log('ovary: cleanUp')
    console.log('==========================================')

    shx.exec('sync', { silent: true })
    if (this.bindedFs) {
      shx.exec('/usr/bin/pkill mksquashfs; /usr/bin/pkill md5sum', { silent: true })
      shx.cp('/tmp/penguins-eggs/fstab', '/etc/fstab') // Pezza a colori
    }
    shx.exec('/usr/bin/[ -f /tmp/installed-to-live/cleanup.conf ] && /sbin/installed-to-live cleanup', { silent: true })

    if (fs.existsSync(`${this.work_dir}/mx-snapshot`)) {
      shx.exec(`rm -r ${this.work_dir}`, { silent: true })
    }
  }

  /**
   * makeLiveFs
   * Crea il LiveFs mediante copia (lento ma preciso)
   */
  public async makeFs() {
    console.log('==========================================')
    console.log(`ovary: makeFs ${this.distro.pathLiveFs}`)
    console.log('==========================================')

    let f = ''
    // root
    f += ' --filter="- /cdrom/*"'
    f += ' --filter="- /dev/*"'
    f += ' --filter="- /live"'
    f += ' --filter="- /media/*"'
    f += ' --filter="- /mnt/*"'
    f += ' --filter="- /proc/*"'
    f += ' --filter="- /sys/*"'
    f += ' --filter="- /swapfile"'
    f += ' --filter="- /tmp/*"'
    f += ' --filter="- /persistence.conf"'

    // boot
    f += ' --filter="- /boot/grub/grub.cfg"'
    f += ' --filter="- /boot/grub/menu.lst"'
    f += ' --filter="- /boot/grub/device.map"'
    f += ' --filter="- /boot/*.bak"'
    f += ' --filter="- /boot/*.old-dkms"'

    // etc
    f += ' --filter="- /etc/apt/sources.list~"'
    f += ' --filter="- /etc/blkid.tab"'
    f += ' --filter="- /etc/blkid.tab.old"'
    f += ' --filter="- /etc/crypttab"'
    f += ' --filter="- /etc/fstab"'
    f += ' --filter="- /etc/fstab.d/*"'
    f += ' --filter="- /etc/initramfs-tools/conf.d/resume"' // see remove-cryptroot and nocrypt.sh
    f += ' --filter="- /etc/initramfs-tools/conf.d/cryptroot"' // see remove-cryptroot and nocrypt.sh
    f += ' --filter="- /etc/mtab"'
    f += ' --filter="- /etc/popularity-contest.conf"'
    f += ' --filter="- /etc/ssh/ssh_host_*_key*"' // Exclude ssh_host_keys. New ones will be generated upon live boot.
    f += ' --filter="- /etc/ssh/ssh_host_key*"' // Exclude ssh_host_keys. New ones will be generated upon live boot.
    f += ' --filter="- /etc/sudoers.d/live"' // Exclude live da sudoers.d non serve se installato

    // lib
    f += ' --filter="- /lib/live/image"'
    f += ' --filter="- /lib/live/mount"'
    f += ' --filter="- /lib/live/overlay"'
    f += ' --filter="- /lib/live/rootfs"'

    f += ' --filter="- /home/*"'
    f += ' --filter="- /root/*"'
    f += ' --filter="- /run/*"'

    // var
    f += ' --filter="- /var/backups/*.gz"'
    f += ' --filter="- /var/cache/apt/archives/*.deb"'
    f += ' --filter="- /var/cache/apt/pkgcache.bin"'
    f += ' --filter="- /var/cache/apt/srcpkgcache.bin"'
    f += ' --filter="- /var/cache/apt/apt-file/*"'
    f += ' --filter="- /var/cache/debconf/*~old"'
    f += ' --filter="- /var/lib/apt/*~"'
    f += ' --filter="- /var/lib/apt/cdroms.list"'
    f += ' --filter="- /var/lib/apt/lists/*"'
    f += ' --filter="- /var/lib/aptitude/*.old"'
    f += ' --filter="- /var/lib/dbus/machine-id"'
    f += ' --filter="- /var/lib/dhcp/*"'
    f += ' --filter="- /var/lib/dpkg/*~old"'
    f += ' --filter="- /var/lib/live/config/*"'
    f += ' --filter="- /var/log/*"'
    f += ' --filter="- /var/mail/*"'
    f += ' --filter="- /var/spool/mail/*"'

    // usr
    f += ' --filter="- /usr/share/icons/*/icon-theme.cache"'
    f += ' --filter="- /usr/lib/live/image"'
    f += ' --filter="- /usr/lib/live/mount"'
    f += ' --filter="- /usr/lib/live/overlay"'
    f += ' --filter="- /usr/lib/live/rootfs"'

    let home = ''
    if (this.reset_accounts) {
      home = '--filter="- /home/*"'
    } else {
      home = '--filter="+/home/*"'
    }

    const cmd = `\
      rsync \
      --archive \
      --delete-before \
      --delete-excluded \
      --filter="- ${this.distro.pathHome}" \
      ${f} \
      --filter="- /lib/live/*" \
      --filter="+ /lib/live/boot/*" \
      --filter="+ /lib/live/config/*" \
      --filter="+ /lib/live/init-config-sh" \
      --filter="+ /lib/live/setup-network.sh" \
      ${home} \
      / ${this.distro.pathLiveFs}`
    shx.exec(cmd.trim(), { async: false })
    if (this.reset_accounts) {
      this.makeLiveHome()
    }
  }

  /**
   * 
   * @param dir 
   */
  isEscluded(dir: string): boolean {
    let toExclude = false
    const excludeDirs = [
      'home',
      'cdrom',
      'dev',
      'live',
      'media',
      'mnt',
      'proc',
      'run',
      'sys',
      'swapfile',
      'tmp']

    for (let excludeDir of excludeDirs) {
      if (excludeDir === dir) {
        toExclude = true
      }
    }
    return toExclude
  }

  /**
    * Check if exist mx-snapshot in work_dir;
    * If respin mode remove all the users
    */
  async bindFs() {
    Utils.titles()
    console.log('==========================================')
    console.log('ovary: bindFs')
    console.log('==========================================')
    const rootDirs = fs.readdirSync('/', { withFileTypes: true })
    let cmd = ''
    let ln = ''
    let dest = ''
    for (let dir of rootDirs) {
      if (dir.isDirectory()) {
        if (!(dir.name === 'lost+found')) {
          console.log(`# ${dir.name} = directory`)
          if (!(fs.existsSync(`${this.distro.pathLowerdir}/${dir.name}`))) {
            cmd = `mkdir ${this.distro.pathLowerdir}/${dir.name}`
            console.log(cmd)
            await exec(cmd)
          } else {
            console.log(`# directory esistente... skip`)
          }
          if (!this.isEscluded(dir.name)) {
            cmd = `mount --bind --make-slave /${dir.name} ${this.distro.pathLowerdir}/${dir.name}`
            console.log(cmd)
            await exec(cmd)
            cmd = `mount -o remount,bind,ro ${this.distro.pathLowerdir}/${dir.name}`
            console.log(cmd)
            await exec(cmd)
          }
        }

      } else if (dir.isFile()) {
        console.log(`# ${dir.name} = file`)
        if (!(fs.existsSync(`${this.distro.pathLowerdir}/${dir.name}`))) {
          cmd = `cp /${dir.name} ${this.distro.pathLowerdir}`
          console.log(cmd)
          await exec(cmd)
        } else {
          console.log(`# file esistente... skip`)
        }
      } else if (dir.isSymbolicLink()) {
        console.log(`# ${dir.name} = symbolicLink`)
        if (!(fs.existsSync(`${this.distro.pathLowerdir}/${dir.name}`))) {
          ln = `/${dir.name}`
          dest = `/${fs.readlinkSync(ln)}`
          cmd = `ln -s ${dest} ${this.distro.pathLowerdir}/${dir.name}`
          console.log(cmd)
          await exec(cmd)
          ln = ''
          dest = ''
        } else {
          console.log(`# SymbolicLink esistente... skip`)
        }
      }
    }

    // Monto overlay
    cmd = `mount -t overlay overlay -o lowerdir=${this.distro.pathLowerdir},upperdir=${this.distro.pathUpperdir},workdir=${this.distro.pathWorkdir} ${this.distro.pathLiveFs}`
    console.log(cmd)
    await exec(cmd)
  }

  /**
   * 
   */
  async uBindFs() {
    console.log('==========================================')
    console.log('ovary: unBindFs')
    console.log('==========================================')

    let cmd = ''
    
    // Rimuovo overlay
    cmd = `umount ${this.distro.pathLiveFs}`
    console.log(cmd)
    process.exit(0)
    await exec(cmd)


    if (fs.existsSync(this.distro.pathLowerdir)) {
      const bindDirs = fs.readdirSync(this.distro.pathLowerdir, { withFileTypes: true })
      for (let dir of bindDirs) {
        if (dir.isDirectory()) {
          console.log(`# ${dir.name} = directory`)
          if (!this.isEscluded(dir.name)) {
            cmd = `umount ${this.distro.pathLowerdir}/${dir.name}`
            await exec(cmd)
            console.log(cmd)
          }
          cmd = `rm ${this.distro.pathLowerdir}/${dir.name} -rf`
          console.log(cmd)
          await exec(cmd)
        } else if (dir.isFile()) {
          console.log(`# ${dir.name} = file`)
          cmd = `rm ${this.distro.pathLowerdir}/${dir.name} -rf`
          console.log(cmd)
          await exec(cmd)
        } else if (dir.isSymbolicLink()) {
          console.log(`# ${dir.name} = symbolicLink`)
          cmd = `rm ${this.distro.pathLowerdir}/${dir.name}`
          console.log(cmd)
          await exec(cmd)
        }
      }
    }
  }

  /**
 * 
 */
  async makeLiveHome() {
    console.log('==========================================')
    console.log('ovary: makeLiveHome')
    console.log('==========================================')

    const user: string = Utils.getPrimaryUser()

    // Copiamo i link su /usr/share/applications
    shx.cp(path.resolve(__dirname, '../../conf/grub.cfg.template'), `${this.distro.pathIso}/boot/grub/grub.cfg`)

    shx.cp(path.resolve(__dirname, `../../assets/penguins-eggs.desktop`), `/usr/share/applications/`)
    shx.cp(path.resolve(__dirname, `../../assets/eggs.png`), `/usr/share/icons/`)

    shx.cp(path.resolve(__dirname, `../../assets/dwagent-sh.desktop`), `/usr/share/applications/`)
    shx.cp(path.resolve(__dirname, `../../assets/assistenza-remota.png`), `/usr/share/icons/`)

    // creazione della home per user live
    shx.cp(`-r`, `/etc/skel/.`, `${this.distro.pathLiveFs}/home/${user}`)
    shx.exec(`chown -R 1000:1000 ${this.distro.pathLiveFs}/home/${user}`, { async: false })
    shx.mkdir(`-p`, `${this.distro.pathLiveFs}/home/${user}/Desktop`)

    // Copiare i link sul desktop per user live
    shx.cp('/usr/share/applications/penguins-eggs.desktop', `${this.distro.pathLiveFs}/home/${user}/Desktop`)
    shx.cp('/usr/share/applications/dwagent-sh.desktop', `${this.distro.pathLiveFs}/home/${user}/Desktop`)
    if (Utils.packageIsInstalled('calamares')) {
      shx.cp('/usr/share/applications/install-debian.desktop', `${this.distro.pathLiveFs}/home/${user}/Desktop`)
      shx.exec(`chown 1000:1000 ${this.distro.pathLiveFs}/home/${user}/Desktop/install-debian.desktop`)
    }
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
  async makeEfi() {
    /**
     * Carica il primo grub.cfg dal memdisk, quindi in sequenza
     * grub.cfg1 -> memdisk
     * grub.cfg2 -> /boot/grub/x86_64-efi
     * grub.cfg3 -> /boot/grub
     */
    console.log('==========================================')
    console.log('ovary: makeEfi')
    console.log('==========================================')


    const tempDir = shx.exec('mktemp -d /tmp/work_temp.XXXX', { silent: true }).stdout.trim()
    // shx.rm('tempDir')
    // shx.ln('-s', tempDir, 'tempDir')

    // for initial grub.cfg
    shx.mkdir('-p', `${tempDir}/boot/grub`)
    const grubCfg = `${tempDir}/boot/grub/grub.cfg`
    shx.touch(grubCfg)
    let text = ''
    text += 'search --file --set=root /isolinux/isolinux.cfg\n'
    text += 'set prefix=(\$root)/boot/grub\n'
    text += 'source \$prefix/x86_64-efi/grub.cfg\n'
    Utils.write(grubCfg, text)

    // #################################

    /**
    * Andiamo a costruire efi_work
     */

    if (!fs.existsSync(this.efi_work)) {
      shx.mkdir(`-p`, this.efi_work)
    }

    // pushd efi_work
    const currentDir = process.cwd()
    process.chdir(this.efi_work)

    /**
     * start with empty directories Clear dir boot and efi
     */
    const files = fs.readdirSync('.');
    for (var i in files) {
      if (files[i] === 'boot') {
        shx.exec(`rm ./boot -rf`, { silent: true })
      }
      if (files[i] === 'efi') {
        shx.exec(`rm ./efi -rf`, { silent: true })
      }
    }
    shx.mkdir(`-p`, `./boot/grub/x86_64-efi`)
    shx.mkdir(`-p`, `./efi/boot`)

    // copy splash
    shx.cp(path.resolve(__dirname, '../../assets/penguins-eggs-splash.png'), `${this.efi_work}/boot/grub/spash.png`)

    // second grub.cfg file
    let cmd = `for i in $(ls /usr/lib/grub/x86_64-efi|grep part_|grep \.mod|sed 's/.mod//'); do echo "insmod $i" >> boot/grub/x86_64-efi/grub.cfg; done`
    shx.exec(cmd, { silent: true })
    // Additional modules so we don't boot in blind mode. I don't know which ones are really needed.
    cmd = `for i in efi_gop efi_uga ieee1275_fb vbe vga video_bochs video_cirrus jpeg png gfxterm ; do echo "insmod $i" >> boot/grub/x86_64-efi/grub.cfg ; done`
    shx.exec(cmd, { silent: true })

    shx.exec(`echo source /boot/grub/grub.cfg >> boot/grub/x86_64-efi/grub.cfg`, { silent: true })

    // pushd tempDir
    process.chdir(tempDir)

    // make a tarred "memdisk" to embed in the grub image
    shx.exec(`tar -cvf memdisk boot`, { silent: true })

    // make the grub image
    shx.exec(`grub-mkimage -O x86_64-efi -m memdisk -o bootx64.efi -p '(memdisk)/boot/grub' search iso9660 configfile normal memdisk tar cat part_msdos part_gpt fat ext2 ntfs ntfscomp hfsplus chain boot linux`, { silent: true })


    // pdpd (torna a efi_work)
    process.chdir(this.efi_work)

    // copy the grub image to efi/boot (to go later in the device's root)
    shx.cp(`${tempDir}/bootx64.efi`, `./efi/boot`)
    //await sleep(3000);


    // Do the boot image "boot/grub/efiboot.img"
    shx.exec(`dd if=/dev/zero of=boot/grub/efiboot.img bs=1K count=1440`, { silent: true })
    shx.exec(`/sbin/mkdosfs -F 12 boot/grub/efiboot.img`, { silent: true })
    shx.mkdir(`-p`, `img-mnt`)
    shx.exec(`mount -o loop boot/grub/efiboot.img img-mnt`, { silent: true })
    shx.mkdir('-p', `img-mnt/efi/boot`)
    shx.cp(`-r`, `${tempDir}/bootx64.efi`, `img-mnt/efi/boot/`)

    // ###############################

    // copy modules and font
    shx.cp(`-r`, `/usr/lib/grub/x86_64-efi/*`, `boot/grub/x86_64-efi/`)

    // if this doesn't work try another font from the same place (grub's default, unicode.pf2, is much larger)
    // Either of these will work, and they look the same to me. Unicode seems to work with qemu. -fsr
    fs.copyFileSync(`/usr/share/grub/unicode.pf2`, `boot/grub/font.pf2`)

    // doesn't need to be root-owned ${pwd} = current Directory
    // shx.exec(`chown -R 1000:1000 $(pwd) 2>/dev/null`)
    shx.exec(`chown -R 1000:1000 $(pwd) 2>/dev/null`)

    // Cleanup efi temps
    shx.exec(`umount img-mnt`, { silent: true })
    shx.exec(`rmdir img-mnt`, { silent: true })

    // popD Torna alla directory corrente
    process.chdir(currentDir)

    // Copy efi files to iso
    shx.exec(`rsync -avx ${this.efi_work}/boot ${this.distro.pathIso}/`, { silent: true })
    shx.exec(`rsync -avx ${this.efi_work}/efi  ${this.distro.pathIso}/`, { silent: true })

    // Do the main grub.cfg (which gets loaded last):
    fs.copyFileSync(path.resolve(__dirname, '../../conf/grub.cfg.template'), `${this.distro.pathIso}/boot/grub/grub.cfg`)
    shx.cp(path.resolve(__dirname, '../../conf/loopback.cfg'), `${this.distro.pathIso}/boot/grub/`)


  }

  editEfi() {
    // editEfi()
    const gpath = `${this.distro.pathIso}/boot/grub/grub.cfg`
    shx.sed('-i', '%custom-name%', this.distro.name, gpath)
    shx.sed('-i', '%kernel%', Utils.kernerlVersion(), gpath)
    shx.sed('-i', '%vmlinuz%', `/live${this.kernel_image}`, gpath)
    shx.sed('-i', '%initrd-img%', `/live${this.initrd_image}`, gpath)
    shx.sed('-i', '%username-opt%', this.username_opt, gpath)
    shx.sed('-i', '%netconfig-opt%', this.netconfig_opt, gpath)
    shx.sed('-i', '%timezone-opt%', this.timezone_opt, gpath)
  }

  /**
   * makeIsoImage
   */
  async makeIsoImage() {
    const volid = this.getFilename(this.iso.distroName)
    const isoName = `${this.snapshot_dir}${volid}`
    console.log('==========================================')
    console.log(`ovary: makeIsoImage ${isoName}`)
    console.log('==========================================')

    const uefi_opt = '-eltorito-alt-boot -e boot/grub/efiboot.img -isohybrid-gpt-basdat -no-emul-boot'

    let isoHybridOption = `-isohybrid-mbr ${this.iso.isolinuxPath}isohdpfx.bin `

    if (this.make_isohybrid) {
      if (fs.existsSync('/usr/lib/syslinux/mbr/isohdpfx.bin')) {
        isoHybridOption = '-isohybrid-mbr /usr/lib/syslinux/mbr/isohdpfx.bin'
      } else if (fs.existsSync('/usr/lib/syslinux/isohdpfx.bin')) {
        isoHybridOption = `-isohybrid-mbr /usr/lib/syslinux/isohdpfx.bin`
      } else if (fs.existsSync('/usr/lib/ISOLINUX/isohdpfx.bin')) {
        isoHybridOption = `-isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin`
      } else {
        console.log(`Can't create isohybrid.  File: isohdpfx.bin not found. The resulting image will be a standard iso file`)
      }
      const volid = this.getFilename(this.iso.distroName)
      const isoName = `${this.snapshot_dir}${volid}`

      let cmd = `xorriso -as mkisofs -r -J -joliet-long -l -iso-level 3 -cache-inodes ${isoHybridOption} -partition_offset 16 -volid ${volid} -b isolinux/isolinux.bin -c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table ${uefi_opt} -o ${isoName} ${this.distro.pathIso}`
      console.log(cmd)
      shx.exec(cmd, { silent: false })
    }
  }

  /**
   * addDebianRepo
   */
  async addDebianRepo() {
    console.log('==========================================')
    console.log(`ovary: addDebianRepo`)
    console.log('==========================================')

    shx.cp('-r', '/home/live/debian-live/*', this.distro.pathIso)
  }
}