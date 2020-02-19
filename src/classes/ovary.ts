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

  pmount_fixed = false

  ssh_pass = false

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

    // this.users = Utils.usersList()
    this.i686 = Utils.isi686()
    this.debian_version = Utils.getDebianVersion()
    // const name = shx.exec(`cat /etc/mx-version | /usr/bin/cut -f1 -d' '`).stdout.trim()
  }

  /**
  * inizializzazioni che non può essere messa nel constructor
  * a causa di chiamate async.
  * @returns {boolean} success
  */
  async fertilization(): Promise<boolean> {
    this.oses = new Oses()
    this.iso = this.oses.info(this.distro)

    const loadSettings = await this.loadSettings()
    if (!Utils.isLive()) {
      // Lo spazio usato da SquashFS non è stimabile da live errore buffer troppo piccolo
      console.log(`Space: ${Utils.getUsedSpace()}`)
    }
    const listFreeSpace = await this.listFreeSpace()

    if (this.loadSettings() && this.listFreeSpace()) {
      this.distro.pathHome = this.work_dir + '.' + this.distro.name
      this.distro.pathLiveFs = this.distro.pathHome + '/fs'
      this.distro.pathIso = this.distro.pathHome + '/iso'
      return true
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
    this.work_dir = settings.General.work_dir.trim()
    if (!this.work_dir.endsWith('/')) {
      this.work_dir += '/'
    }
    this.efi_work = settings.General.efi_work.trim()
    if (!this.efi_work.endsWith('/')) {
      this.efi_work += '/'
    }
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
    this.pmount_fixed = settings.General.pmount_system === "yes"
    this.ssh_pass = settings.General.ssh_pass === "yes"
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
    console.log(`initrd_image:      ${this.initrd_image}`)
    console.log(`pmount_fixed:      ${this.pmount_fixed}`)
    console.log(`ssh_pass:          ${this.ssh_pass}`)
  }

  /**
   * Calculate and show free space on the disk
   * @returns {void}
   */
  async listFreeSpace(): Promise<void> {
    const path: string = this.snapshot_dir // convert to absolute path

    Utils.shxExec(`df -h "${path}" | /usr/bin/awk 'NR==2 {print $4}'`)
    console.log('The free space should be sufficient to hold the compressed data from / and /home')
    console.log('')
    console.log('If necessary, you can create more available space')
    console.log('by removing previous snapshots and saved copies:')
    console.log(`${Utils.getSnapshotCount(this.snapshot_dir)} snapshots are taking up ${Utils.getSnapshotSize(this.snapshot_dir)} of disk space.`)
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
      await this.calamaresConfigure()
      await this.isoCreateStructure()
      await this.isolinuxPrepare()
      await this.isoStdmenuCfg()
      await this.isolinuxCfg()
      await this.isoMenuCfg()
      await this.copyKernel()
      if (this.bindedFs) {
        await this.bindFs() // bind FS
      } else {
        await this.makeFs() // copy fs
      }
      await this.editLiveFs()
      await this.editBootMenu()
      // await this.makeFsTab()
      // await this.makeInterfaces()
      await this.makeSquashFs()
      await this.cleanUp()
      await this.makeIsoFs()
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

    // Se calamares è installato lo configura
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
    shx.exec(`find myfs/var/log -name "*gz" -print0 | xargs -0r rm -f`)
    shx.exec(`find myfs/var/log/ -type f -exec truncate -s 0 {} \;`)


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

    shx.exec(`sed -i 's/PermitRootLogin yes/PermitRootLogin prohibit-password/' "$work_dir"/myfs/etc/ssh/sshd_config`)
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
      shx.mkdir('/tmp/penguins-eggs')
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
      Utils.shxExec(`mkdir -p ${this.distro.pathIso}/live`)
      Utils.shxExec(`mkdir -p ${this.distro.pathIso}/EFI`)
      Utils.shxExec(`mkdir -p ${this.distro.pathIso}/boot`)
      Utils.shxExec(`mkdir -p ${this.distro.pathIso}/boot/isolinux`)
      Utils.shxExec(`mkdir -p ${this.distro.pathIso}/boot/grub`)
      Utils.shxExec(`mkdir -p ${this.distro.pathIso}/boot/syslinux`)
    }
  }

  async isolinuxPrepare() {
    console.log('==========================================')
    console.log('ovary: isolinuxPrepare')
    console.log('==========================================')

    const isolinuxbin = `${this.iso.isolinuxPath}isolinux.bin`
    const vesamenu = `${this.iso.syslinuxPath}vesamenu.c32`

    Utils.shxExec(
      `rsync -a ${this.iso.syslinuxPath}chain.c32 ${this.distro.pathIso}/boot/isolinux/`
    )
    Utils.shxExec(
      `rsync -a ${this.iso.syslinuxPath}ldlinux.c32 ${this.distro.pathIso}/boot/isolinux/`
    )
    Utils.shxExec(
      `rsync -a ${this.iso.syslinuxPath}libcom32.c32 ${this.distro.pathIso}/boot/isolinux/`
    )
    Utils.shxExec(
      `rsync -a ${this.iso.syslinuxPath}libutil.c32 ${this.distro.pathIso}/boot/isolinux/`
    )
    Utils.shxExec(`rsync -a ${isolinuxbin} ${this.distro.pathIso}/boot/isolinux/`)
    Utils.shxExec(`rsync -a ${vesamenu} ${this.distro.pathIso}/boot/isolinux/`)
  }

  async isoStdmenuCfg() {
    console.log('==========================================')
    console.log('ovary: isoStdmenuCfg')
    console.log('==========================================')

    const file = `${this.distro.pathIso}/boot/isolinux/stdmenu.cfg`
    const text = `
# Refer to http://www.syslinux.org/wiki/index.php/Comboot/menu.c32
MENU BACKGROUND penguins-eggs-syslinux.png
TIMEOUT 50
 
MENU WIDTH 78
MENU MARGIN 4
MENU ROWS 8
MENU VSHIFT 10
MENU TIMEOUTROW 16
MENU TABMSGROW 18
MENU CMDLINEROW 16
MENU HELPMSGROW 16
MENU HELPMSGENDROW 29

MENU COLOR border       30;44   #40ffffff #a0000000 std
MENU COLOR title        1;36;44 #9033ccff #a0000000 std
MENU COLOR sel          7;37;40 #e0ffffff #20ffffff all
MENU COLOR unsel        37;44   #50ffffff #a0000000 std
MENU COLOR help         37;40   #c0ffffff #a0000000 std
MENU COLOR timeout_msg  37;40   #80ffffff #00000000 std
MENU COLOR timeout      1;37;40 #c0ffffff #00000000 std
MENU COLOR msg07        37;40   #90ffffff #a0000000 std
MENU COLOR tabmsg       31;40   #30ffffff #00000000 std
MENU VSHIFT 8
MENU TABMSG Press ENTER to boot or TAB to edit a menu entry
  `

    Utils.write(file, text)
  }

  isolinuxCfg() {
    console.log('==========================================')
    console.log('ovary: isolinuxCfg')
    console.log('==========================================')

    const file = `${this.distro.pathIso}/boot/isolinux/isolinux.cfg`
    const text = `
# Generated by ${this.app.name} V. ${this.app.version} 
# D-I config version 2.0
# search path for the c32 support libraries (libcom32, libutil etc.)
path 
include menu.cfg
default vesamenu.c32
prompt 0
timeout 0
`
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

    const kernelVersion = Utils.kernerlVersion()
    const kernel_name = path.basename(this.kernel_image)
    const initrd_name = path.basename(this.initrd_image)

    this.iso.append = `append initrd=/live/${initrd_name} boot=live components username=live `
    this.iso.appendSafe = `append initrd=/live/${initrd_name} boot=live components username=live xforcevesa verbose`
    this.iso.aqs = 'quit splash debug=true nocomponents '

    console.log('==========================================')
    console.log('ovary: menuCfg')
    console.log('==========================================')

    const file = `${this.distro.pathIso}/boot/isolinux/menu.cfg`
    const text = `
    INCLUDE stdmenu.cfg
    MENU title Main Menu
    DEFAULT ^${this.distro.name} 
    LABEL ${this.distro.name} (kernel ${kernelVersion}) Italian (it)
        SAY "Booting ${this.distro.name} Italian (it)"
        linux /live/${kernel_name}
        ${this.iso.append} locales=it_IT.UTF-8 timezone=Europe/Rome ${this.iso.aqs}
    
    MENU begin advanced
    MENU title ${this.distro.name} with Localisation Support
    
    LABEL Albanian (sq)
          SAY "Booting Albanian (sq)..."
          linux /live/${kernel_name}
          ${this.iso.append} locales=sq_AL.UTF-8 ${this.iso.aqs}
    LABEL Amharic (am) 
          SAY "Booting Amharic (am)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=am_ET.UTF-8 ${this.iso.aqs}
          
    LABEL Arabic (ar) 
          SAY "Booting Arabic (ar)..."
          linux /live/${kernel_name}
          ${this.iso.append} locales=ar_EG.UTF-8 ${this.iso.aqs}
    
    LABEL Asturian (ast)
          SAY "Booting Asturian (ast)..."  
          linux /live/${kernel_name}
          ${this.iso.append}  locales=ast_ES.UTF-8 ${this.iso.aqs}
    
    LABEL Basque (eu)
          SAY "Booting Basque (eu)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=eu_ES.UTF-8 ${this.iso.aqs}
          
    LABEL Belarusian (be)
          SAY "Booting Belarusian (be)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=be_BY.UTF-8 ${this.iso.aqs}
    
    LABEL Bangla (bn)
          SAY "Booting Bangla (bn)..."
          linux /live/${kernel_name}
          ${this.iso.append} locales=bn_BD ${this.iso.aqs}
    
    LABEL Bosnian (bs)
          SAY "Booting Bosnian (bs)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=bs_BA.UTF-8 ${this.iso.aqs}
    
    LABEL Bulgarian (bg)
          SAY "Booting Bulgarian (bg)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=bg_BG.UTF-8 ${this.iso.aqs}
        
    LABEL Tibetan (bo)
          SAY "Booting Tibetan (bo)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=bo_IN ${this.iso.aqs}
        
        LABEL C (C)
          SAY "Booting C (C)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=C ${this.iso.aqs}
        
        LABEL Catalan (ca)
          SAY "Booting Catalan (ca)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=ca_ES.UTF-8 ${this.iso.aqs}
        
        LABEL Chinese (Simplified) (zh_CN)
          SAY "Booting Chinese (Simplified) (zh_CN)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=zh_CN.UTF-8 ${this.iso.aqs}
        
        LABEL Chinese (Traditional) (zh_TW)
          SAY "Booting Chinese (Traditional) (zh_TW)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=zh_TW.UTF-8 ${this.iso.aqs}
        
        LABEL Croatian (hr)
          SAY "Booting Croatian (hr)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=hr_HR.UTF-8 ${this.iso.aqs}
        
        LABEL Czech (cs)
          SAY "Booting Czech (cs)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=cs_CZ.UTF-8 ${this.iso.aqs}
        
        LABEL Danish (da)
          SAY "Booting Danish (da)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=da_DK.UTF-8 ${this.iso.aqs}
        
        LABEL Dutch (nl)
          SAY "Booting Dutch (nl)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=nl_NL.UTF-8 ${this.iso.aqs}
        
        LABEL Dzongkha (dz)
          SAY "Booting Dzongkha (dz)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=dz_BT ${this.iso.aqs}
        
        LABEL English (en)
          SAY "Booting English (en)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=en_US.UTF-8 ${this.iso.aqs}
        
        LABEL Esperanto (eo)
          SAY "Booting Esperanto (eo)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=eo.UTF-8 ${this.iso.aqs}
        
        LABEL Estonian (et)
          SAY "Booting Estonian (et)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=et_EE.UTF-8 ${this.iso.aqs}
        
        LABEL Finnish (fi)
          SAY "Booting Finnish (fi)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=fi_FI.UTF-8 ${this.iso.aqs}
        
        LABEL French (fr)
          SAY "Booting French (fr)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=fr_FR.UTF-8 ${this.iso.aqs}
        
        LABEL Galician (gl)
          SAY "Booting Galician (gl)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=gl_ES.UTF-8 ${this.iso.aqs}
        
        LABEL Georgian (ka)
          SAY "Booting Georgian (ka)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=ka_GE.UTF-8 ${this.iso.aqs}
        
        LABEL German (de)
          SAY "Booting German (de)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=de_DE.UTF-8 ${this.iso.aqs}
        
        LABEL Greek (el)
          SAY "Booting Greek (el)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=el_GR.UTF-8 ${this.iso.aqs}
        
        LABEL Gujarati (gu)
          SAY "Booting Gujarati (gu)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=gu_IN ${this.iso.aqs}
        
        LABEL Hebrew (he)
          SAY "Booting Hebrew (he)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=he_IL.UTF-8 ${this.iso.aqs}
        
        LABEL Hindi (hi)
          SAY "Booting Hindi (hi)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=hi_IN ${this.iso.aqs}
        
        LABEL Hungarian (hu)
          SAY "Booting Hungarian (hu)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=hu_HU.UTF-8 ${this.iso.aqs}
        
        LABEL Icelandic (is)
          SAY "Booting Icelandic (is)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=is_IS.UTF-8 ${this.iso.aqs}
        
        LABEL Indonesian (id)
          SAY "Booting Indonesian (id)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=id_ID.UTF-8 ${this.iso.aqs}
        
        LABEL Irish (ga)
          SAY "Booting Irish (ga)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=ga_IE.UTF-8 ${this.iso.aqs}
        
        LABEL Italian (it)
          SAY "Booting Italian (it)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=it_IT.UTF-8 ${this.iso.aqs}
        
        LABEL Japanese (ja)
          SAY "Booting Japanese (ja)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=ja_JP.UTF-8 ${this.iso.aqs}
        
        LABEL Kazakh (kk)
          SAY "Booting Kazakh (kk)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=kk_KZ.UTF-8 ${this.iso.aqs}
        
        LABEL Khmer (km)
          SAY "Booting Khmer (km)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=km_KH ${this.iso.aqs}
        
        LABEL Kannada (kn)
          SAY "Booting Kannada (kn)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=kn_IN ${this.iso.aqs}
        
        LABEL Korean (ko)
          SAY "Booting Korean (ko)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=ko_KR.UTF-8 ${this.iso.aqs}
        
        LABEL Kurdish (ku)
          SAY "Booting Kurdish (ku)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=ku_TR.UTF-8 ${this.iso.aqs}
        
        LABEL Lao (lo)
          SAY "Booting Lao (lo)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=lo_LA ${this.iso.aqs}
        
        LABEL Latvian (lv)
          SAY "Booting Latvian (lv)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=lv_LV.UTF-8 ${this.iso.aqs}
        
        LABEL Lithuanian (lt)
          SAY "Booting Lithuanian (lt)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=lt_LT.UTF-8 ${this.iso.aqs}
        
        LABEL Malayalam (ml)
          SAY "Booting Malayalam (ml)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=ml_IN ${this.iso.aqs}
        
        LABEL Marathi (mr)
          SAY "Booting Marathi (mr)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=mr_IN ${this.iso.aqs}
        
        LABEL Macedonian (mk)
          SAY "Booting Macedonian (mk)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=mk_MK.UTF-8 ${this.iso.aqs}
        
        LABEL Burmese (my)
          SAY "Booting Burmese (my)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=my_MM ${this.iso.aqs}
        
        LABEL Nepali (ne)
          SAY "Booting Nepali (ne)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=ne_NP ${this.iso.aqs}
        
        LABEL Northern Sami (se_NO)
          SAY "Booting Northern Sami (se_NO)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=se_NO ${this.iso.aqs}
        
        LABEL Norwegian Bokmaal (nb_NO)
          SAY "Booting Norwegian Bokmaal (nb_NO)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=nb_NO.UTF-8 ${this.iso.aqs}
        
        LABEL Norwegian Nynorsk (nn_NO)
          SAY "Booting Norwegian Nynorsk (nn_NO)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=nn_NO.UTF-8 ${this.iso.aqs}
        
        LABEL Persian (fa)
          SAY "Booting Persian (fa)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=fa_IR ${this.iso.aqs}
        
        LABEL Polish (pl)
          SAY "Booting Polish (pl)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=pl_PL.UTF-8 ${this.iso.aqs}
        
        LABEL Portuguese (pt)
          SAY "Booting Portuguese (pt)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=pt_PT.UTF-8 ${this.iso.aqs}
        
        LABEL Portuguese (Brazil) (pt_BR)
          SAY "Booting Portuguese (Brazil) (pt_BR)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=pt_BR.UTF-8 ${this.iso.aqs}
        
        LABEL Punjabi (Gurmukhi) (pa)
          SAY "Booting Punjabi (Gurmukhi) (pa)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=pa_IN ${this.iso.aqs}
        
        LABEL Romanian (ro)
          SAY "Booting Romanian (ro)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=ro_RO.UTF-8 ${this.iso.aqs}
        
        LABEL Russian (ru)
          SAY "Booting Russian (ru)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=ru_RU.UTF-8 ${this.iso.aqs}
        
        LABEL Sinhala (si)
          SAY "Booting Sinhala (si)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=si_LK ${this.iso.aqs}
        
        LABEL Serbian (Cyrillic) (sr)
          SAY "Booting Serbian (Cyrillic) (sr)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=sr_RS ${this.iso.aqs}
        
        LABEL Slovak (sk)
          SAY "Booting Slovak (sk)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=sk_SK.UTF-8 ${this.iso.aqs}
        
        LABEL Slovenian (sl)
          SAY "Booting Slovenian (sl)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=sl_SI.UTF-8 ${this.iso.aqs}
        
        LABEL Spanish (es)
          SAY "Booting Spanish (es)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=es_ES.UTF-8 ${this.iso.aqs}
        
        LABEL Swedish (sv)
          SAY "Booting Swedish (sv)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=sv_SE.UTF-8 ${this.iso.aqs}
        
        LABEL Tagalog (tl)
          SAY "Booting Tagalog (tl)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=tl_PH.UTF-8 ${this.iso.aqs}
        
        LABEL Tamil (ta)
          SAY "Booting Tamil (ta)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=ta_IN ${this.iso.aqs}
        
        LABEL Telugu (te)
          SAY "Booting Telugu (te)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=te_IN ${this.iso.aqs}
        
        LABEL Tajik (tg)
          SAY "Booting Tajik (tg)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=tg_TJ.UTF-8 ${this.iso.aqs}
        
        LABEL Thai (th)
          SAY "Booting Thai (th)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=th_TH.UTF-8 ${this.iso.aqs}
        
        LABEL Turkish (tr)
          SAY "Booting Turkish (tr)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=tr_TR.UTF-8 ${this.iso.aqs}
        
        LABEL Uyghur (ug)
          SAY "Booting Uyghur (ug)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=ug_CN ${this.iso.aqs}
        
        LABEL Ukrainian (uk)
          SAY "Booting Ukrainian (uk)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=uk_UA.UTF-8 ${this.iso.aqs}
        
        LABEL Vietnamese (vi)
          SAY "Booting Vietnamese (vi)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=vi_VN ${this.iso.aqs}
        
        LABEL Welsh (cy)
          SAY "Booting Welsh (cy)..."
          linux /live/${kernel_name}
          ${this.iso.append}  locales=cy_GB.UTF-8 ${this.iso.aqs}
        
         LABEL mainmenu 
          MENU label Back
          MENU exit
          MENU end
         
    LABEL ${this.distro.name} safe
      MENU LABEL ^${this.distro.name} safe
      kernel /live/vmlinuz
      ${this.iso.appendSafe}`

    Utils.write(file, text)
    Utils.shxExec(`cp ${__dirname}/../../assets/penguins-eggs-syslinux.png ${this.distro.pathIso}/boot/isolinux`)
  }

  /**
   * alive: rende live
   */
  async copyKernel() {
    console.log('==========================================')
    console.log('ovary: liveKernel')
    console.log('==========================================')
    Utils.shxExec(`cp ${this.kernel_image} ${this.distro.pathIso}/live/`)
    Utils.shxExec(`cp ${this.initrd_image} ${this.distro.pathIso}/live/`)
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
      if (Utils.shxExec('/usr/bin/test -L /etc/localtime') && Utils.shxExec('cat /etc/timezone') !== 'America/New_York') {
        this.addRemoveExclusion(true, '/etc/localtime')
      }
    }
    const compression = `-comp ${this.compression} `
    let cmd = `mksquashfs ${this.distro.pathLiveFs} ${this.distro.pathIso}/live/filesystem.squashfs ${compression} ${(this.mksq_opt === '' ? '' : ' ' + this.mksq_opt)} -wildcards -ef ${this.snapshot_excludes} ${this.session_excludes} `
    console.log(cmd)
    Utils.shxExec(cmd, { silent: false })
    // usr/bin/mksquashfs /.bind-root iso-template/antiX/linuxfs -comp ${this.compression} ${(this.mksq_opt === '' ? '' : ' ' + this.mksq_opt)} -wildcards -ef ${this.snapshot_excludes} ${this.session_excludes}`)
  }

  async makeIsoFs() {
    const isoHybridOption = `-isohybrid-mbr ${this.iso.isolinuxPath}isohdpfx.bin `
    const volid = this.getFilename(this.iso.distroName)
    const isoName = `${this.snapshot_dir}${volid}`

    console.log('==========================================')
    console.log(`ovary: makeIsoFs ${isoName}`)
    console.log('==========================================')

    Utils.shxExec(
      `xorriso -as mkisofs -r -J -joliet-long -l -cache-inodes ${isoHybridOption} -partition_offset 16 -volid ${volid} -b boot/isolinux/isolinux.bin -c boot/isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table -o ${isoName} ${this.distro.pathIso}`
      , { silent: false })
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

    Utils.shxExec('sync')
    if (this.bindedFs) {
      Utils.shxExec('/usr/bin/pkill mksquashfs; /usr/bin/pkill md5sum')
      shx.cp('/tmp/penguins-eggs/fstab', '/etc/fstab') // Pezza a colori
    }
    Utils.shxExec('/usr/bin/[ -f /tmp/installed-to-live/cleanup.conf ] && /sbin/installed-to-live cleanup')

    if (fs.existsSync(`${this.work_dir}/mx-snapshot`)) {
      Utils.shxExec(`rm -r ${this.work_dir}`)
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
   * Check if exist mx-snapshot in work_dir;
   * If respin mode remove all the users
   */
  async bindFs() {
    console.log('==========================================')
    console.log('ovary: bindLiveFs')
    console.log('==========================================')

    // Utils.shxExec(`mkdir -r ${this.work_dir}/mx-snapshot`)

    // checks if work_dir looks OK
    // if (!this.work_dir.includes('/mx-snapshot')) { // Se non contiene /mx-snapshot
    //  console.log(`${this.work_dir} NON contiene mx-snapshot!`)
    //  return
    // }

    let bindBoot = ''
    let bindBootToo = ''
    if (shx.exec('mountpoint /boot').code) {
      bindBoot = 'bind=/boot'
      bindBootToo = ',/boot'
    }

    /**
     * setup environment if creating a respin 
     * (reset root/demo, remove personal accounts) 
     */
    let cmd = ''
    if (this.reset_accounts) {
      cmd = `/sbin/installed-to-live -b ${this.distro.pathLiveFs} start ${bindBoot} empty=/home general version-file read-write`
      await Utils.shxExec(cmd)
      await this.makeLiveHome()
    } else {
      cmd = `/sbin/installed-to-live -b ${this.distro.pathLiveFs} start bind=/home${bindBootToo} live-files version-file adjtime read-write`
      await Utils.shxExec(cmd)
    }
  }

  /**
 * 
 */
  async makeLiveHome() {
    const user: string = Utils.getPrimaryUser()

    // Copiamo i link su /usr/share/applications
    shx.cp(`${__dirname}../../assets/dw-agent-sh.desktop`, `/usr/share/applications/`)
    shx.cp(`${__dirname}../../assets/assistenza-remota.png`, `/usr/share/icons/`)
    shx.cp(`${__dirname}../../assets/penguins-eggs.desktop`, `/usr/share/applications/`)
    shx.cp(`${__dirname}../../assets/eggs.png`, `/usr/share/icons/`)

    // creazione della home per user live
    shx.exec(`cp -r /etc/skel/. ${this.distro.pathLiveFs}/home/${user}`, { async: false })
    shx.exec(`chown -R live:live ${this.distro.pathLiveFs}/home/${user}`, { async: false })
    shx.exec(`mkdir ${this.distro.pathLiveFs}/home/${user}/Desktop`, { async: false })

    // Copiare i link sul desktop
    shx.cp('/usr/share/applications/dw-agent.desktop', `${this.distro.pathLiveFs}/home/${user}/Desktop`)
    shx.cp('/usr/share/applications/penguins-eggs.desktop', `${this.distro.pathLiveFs}/home/${user}/Desktop`)

    // creazione dei link per user live da /etc/penguins-eggs/
    shx.exec(`cp /etc/penguins-eggs/${user}/Desktop/* ${this.distro.pathLiveFs}/home/${user}/Desktop`, { async: false })
    shx.exec(`chmod +x ${this.distro.pathLiveFs}/home/${user}/Desktop/*.desktop`, { async: false })
    shx.exec(`chown ${user}:${user} ${this.distro.pathLiveFs}/home/${user}/Desktop/*`, { async: false })
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
    this.efi_work = '/home/eggs/.work/efi_files'
    // console.log(`efi_work: ${this.efi_work}`)

    // create /boot and /efi for uefi.
    const uefiOption = '-eltorito-alt-boot -e boot/grub/efiboot.img -isohybrid-gpt-basdat -no-emul-boot'
    const tempDir = shx.exec('mktemp -d /tmp/work_temp.XXXX').stdout.trim()
    // console.log(`tempDir: ${tempDir}`)
    // shx.rm('_temp')
    // shx.ln('-s', tempDir, '_temp')

    // for initial grub.cfg
    shx.mkdir('-p', `${tempDir}/boot/grub`)
    const grubCfg = `${tempDir}/boot/grub/grub.cfg`
    // console.log(`grubCfg: ${grubCfg}`)

    shx.touch(grubCfg)
    let text = ''
    text += 'search --file --set=root /isolinux/isolinux.cfg'
    text += 'set prefix=(\$root)/boot/grub'
    text += 'source \$prefix/x86_64-efi/grub.cfg'
    Utils.write(grubCfg, text)

    if (!fs.existsSync(this.efi_work)) {
      // console.log(`creazione di: ${this.efi_work}`)
      fs.mkdirSync(this.efi_work)
    }

    // pushd this.efi_work
    // start with empty directories
    const files = fs.readdirSync(this.efi_work);
    for (var i in files) {
      if (files[i] === 'boot') {
        shx.exec(`rm ${this.efi_work}/boot -rf`)
      }
      if (files[i] === 'efi') {
        shx.exec(`rm ${this.efi_work}/efi -rf`)
      }
    }
    shx.mkdir(`-p`, `${this.efi_work}/boot/grub/x86_64-efi`)
    shx.mkdir(`-p`, `${this.efi_work}/efi/boot`)

    // copy splash
    shx.cp(path.resolve(__dirname, '../../assets/penguins-eggs-syslinux.png'), `${this.efi_work}/boot/grub/spash.png`)

    // second grub.cfg file
    let cmd = `for i in $(ls /usr/lib/grub/x86_64-efi|grep part_|grep \.mod|sed 's/.mod//'); do echo "insmod $i" >> ${this.efi_work}/boot/grub/x86_64-efi/grub.cfg; done`
    shx.exec(cmd)

    // Additional modules so we don't boot in blind mode. I don't know which ones are really needed.
    cmd = `for i in efi_gop efi_uga ieee1275_fb vbe vga video_bochs video_cirrus jpeg png gfxterm ; do echo "insmod $i" >> ${this.efi_work}/boot/grub/x86_64-efi/grub.cfg ; done`
    shx.exec(cmd)

    shx.echo(`source /boot/grub/grub.cfg >> ${this.efi_work}/boot/grub/x86_64-efi/grub.cfg`)

    // pushd "$tempdir"
    // make a tarred "memdisk" to embed in the grub image
    // Ci potrebbero essere problemi di path 
    shx.exec(`tar -cvf ${tempDir}/memdisk ${tempDir}/boot`)

    // make the grub image
    shx.exec(`grub-mkimage -O x86_64-efi -m ${tempDir}/memdisk -o ${tempDir}/bootx64.efi -p '(memdisk)/boot/grub' search iso9660 configfile normal memdisk tar cat part_msdos part_gpt fat ext2 ntfs ntfscomp hfsplus chain boot linux`)

    // copy the grub image to efi/boot (to go later in the device's root)
    shx.cp(`${tempDir}/bootx64.efi`, `${this.efi_work}/efi/boot`)

    // Do the boot image "boot/grub/efiboot.img"
    shx.exec(`dd if=/dev/zero of=${this.efi_work}/boot/grub/efiboot.img bs=1K count=1440`)
    shx.exec(`/sbin/mkdosfs -F 12 ${this.efi_work}/boot/grub/efiboot.img`)
    shx.mkdir(`${this.efi_work}/img-mnt`)
    shx.exec(`mount -o loop ${this.efi_work}/boot/grub/efiboot.img ${this.efi_work}/img-mnt`)
    shx.mkdir('-p', `${this.efi_work}/img-mnt/efi/boot`)
    shx.cp(`${tempDir}/bootx64.efi`, `${this.efi_work}/img-mnt/efi/boot/`)
    // #######################
    // copy modules and font
    shx.cp(`-r`, `/usr/lib/grub/x86_64-efi/*`, `${this.efi_work}/boot/grub/x86_64-efi/`)

    // if this doesn't work try another font from the same place (grub's default, unicode.pf2, is much larger)
    // Either of these will work, and they look the same to me. Unicode seems to work with qemu. -fsr
    shx.cp(`-r`, `/usr/share/grub/unicode.pf2`, `${this.efi_work}/boot/grub/font.pf2`)

    // doesn't need to be root-owned
    shx.exec(`chown -R 1000:1000 $(pwd) `) // 2>/dev/null`)

    // Cleanup efi temps
    shx.exec(`umount ${this.efi_work}/img-mnt`)
    shx.exec(`rmdir ${this.efi_work}/img-mnt`)

    //   # Copy efi files to iso
    shx.exec(`rsync -avx ${this.efi_work}/boot ${this.work_dir}/iso/`)
    shx.exec(`rsync -avx ${this.efi_work}/efi  ${this.work_dir}/iso/`)

    // Do the main grub.cfg (which gets loaded last):
    shx.cp(path.resolve(__dirname, '../../conf/grub.cfg.template'), `${this.work_dir}/iso/boot/grub/grub.cfg`)
  }
}
