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
import os = require('os')
import ini = require('ini')
import shx = require('shelljs')
import pjson = require('pjson')

import Utils from './utils'
import Calamares from './calamares-config'
import Oses from './oses'
import Prerequisites from '../commands/prerequisites'
import {IDistro, IOses, IPackage} from '../interfaces'

/**
 * Iso:
 */
export default class Ovary {
  app = {} as IPackage

  workDir = '/home/snapshot/'

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

  debian_version = 10 as number

  lib_mod_dir = '' as string

  snapshot_dir = '' as string // /home/snapshot

  config_file = '/etc/mx-snapshot.conf' as string

  gui_editor = '/usr/bin/joe' as string

  snapshot_excludes = '/etc/mx-snapshot-exclude.list' as string

  edit_boot_menu = '' as string

  kernel_used = '' as string

  make_isohybrid = 'yes' as string

  make_md5sum = 'yes' as string

  compression = '' as string

  mksq_opt = '' as string

  save_message = '' as string

  session_excludes = '' as string

  snapshot_basename = '' as string

  stamp = '' as string

  version = '' as string

  work_dir = '' as string

  // Altre mie
  users: string[] = []

  /**
   * Egg
   * @param compression
   */
  constructor(compression = 'xz') {
    this.compression = compression

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
    this.distro.pathHome = this.workDir + `${this.distro.name}`
    this.distro.pathFs = this.distro.pathHome + '/fs'
    this.distro.pathIso = this.distro.pathHome + '/iso'

    this.compression = compression || ''
    this.live = Utils.isLive()
    this.users = Utils.usersList()
    this.i686 = Utils.isi686()
    this.debian_version = Utils.getDebianVersion()
    // this.reset_accounts = true
    // const name = shx.exec(`cat /etc/mx-version | /usr/bin/cut -f1 -d' '`).stdout.trim()
    console.log(`Space: ${Utils.getUsedSpace()}`)
  }

  /**
  * inizializzazioni che non può essere messa nel constructor
  * a causa di chiamate async.
  * @returns {boolean} success
  */
  async fertilization(): Promise<boolean> {
    this.oses = new Oses()
    this.iso = this.oses.info(this.distro)
    this.calamares = new Calamares(this.distro, this.iso)

    const loadSettings = await this.loadSettings()
    const listFreeSpace = await this.listFreeSpace()

    if (loadSettings && listFreeSpace) {
      return true
    }
    return false
  }

  /**
   * Load configuration from /etc/penguins-eggs.conf
   * @returns {boolean} Success
   */
  async loadSettings(): Promise<boolean> {
    let foundSettings: boolean

    const settings = ini.parse(fs.readFileSync(this.config_file, 'utf-8'))

    if (settings.General.snapshot_dir === '') {
      foundSettings = false
    } else {
      foundSettings = true
    }

    this.session_excludes = ''
    if (this.compression === '') {
      this.compression = settings.General.compression
    }
    this.snapshot_dir = settings.General.snapshot_dir.trim()
    this.snapshot_excludes = settings.General.snapshot_excludes
    this.snapshot_basename = settings.General.snapshot_basename
    this.make_md5sum = settings.General.make_md5sum
    this.make_isohybrid = settings.General.make_isohybrid
    this.mksq_opt = settings.General.mksq_opt
    this.edit_boot_menu = settings.General.edit_boot_menu
    this.lib_mod_dir = settings.General.lib_mod_dir
    this.gui_editor = settings.General.gui_editor
    this.stamp = settings.General.stamp
    this.force_installer = settings.General.force_installer

    return foundSettings
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
    if (basename !== '') {
      this.distro.name = basename
    }

    if (await Utils.isLive()) {
      console.log(
        '>>> eggs: This is a live system! An egg cannot be produced from an egg!'
      )
    } else {
      this.calamares.configure()  // c.configure(o)
      console.log('------------------------------------------')
      console.log('Laying the system into the egg...')
      console.log('------------------------------------------')
      await this.eggCreateStructure()
      await this.isoCreateStructure()
      await this.isolinuxPrepare()
      await this.isoStdmenuCfg()
      await this.isolinuxCfg()
      await this.isoMenuCfg()
      await this.copyKernel()
      console.log('------------------------------------------')
      console.log('Spawning the system into the egg...\nThis process can be very long, perhaps it\'s time for a coffee!')
      console.log('------------------------------------------')
      await this.system2egg()
      await this.makeDhcp()
      await this.makeSquashFs()
      await this.makeIsoFs()
    }
  }

  /**
 *
 */
  public async makeDhcp() {
    console.log('==========================================')
    console.log('makeDhcp: ')
    console.log('==========================================')
    const text = 'auto lo\niface lo inet loopback'
    Utils.bashWrite(`${this.distro.pathFs}/etc/network/interfaces`, text)
  }

  /**
   * eggCreateStructue
   */
  public async eggCreateStructure() {
    console.log('==========================================')
    console.log('eggs: createStructure')
    console.log('==========================================')
    if (!fs.existsSync(this.distro.pathHome)) {
      Utils.shxExec(`mkdir -p ${this.distro.pathHome}`)
    }

    if (!fs.existsSync(this.distro.pathFs)) {
      // Utils.shxExec(`rm -rf ${this.distro.pathFs}`);
      Utils.shxExec(`mkdir -p ${this.distro.pathFs}`)
      Utils.shxExec(`mkdir -p ${this.distro.pathFs}/dev`)
      Utils.shxExec(`mkdir -p ${this.distro.pathFs}/etc`)
      Utils.shxExec(`mkdir -p ${this.distro.pathFs}/etc/intefaces`)
      Utils.shxExec(`mkdir -p ${this.distro.pathFs}/etc/live`)
      Utils.shxExec(`mkdir -p ${this.distro.pathFs}/proc`)
      Utils.shxExec(`mkdir -p ${this.distro.pathFs}/sys`)
      Utils.shxExec(`mkdir -p ${this.distro.pathFs}/media`)
      Utils.shxExec(`mkdir -p ${this.distro.pathFs}/run`)
      Utils.shxExec(`mkdir -p ${this.distro.pathFs}/var`)
      Utils.shxExec(`mkdir -p ${this.distro.pathFs}/tmp`)
    }
  }

  /**
   * system2egg
   */
  public async system2egg() {
    let cmd = ''
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

    // Copia la home di live da system ad egg
    cmd = `\
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
      --filter="- /home/*" \
      / ${this.distro.pathFs}`
    console.log('system2egg: copyng system... \n')
    shx.exec(cmd.trim(), {
      async: false,
    })

    console.log('system2egg: creating home... \n')
    shx.exec(`cp -r /etc/skel/. ${this.distro.pathFs}/home/live`, {async: false})
    shx.exec(`chown -R live:live ${this.distro.pathFs}/home/live`, {async: false})
    shx.exec(`mkdir ${this.distro.pathFs}/home/live/Desktop`, {async: false})

    console.log('system2egg: creating initial live link... \n')
    shx.exec(`cp /etc/penguins-eggs/live/Desktop/* ${this.distro.pathFs}/home/live/Desktop`, {async: false})
    shx.exec(`chmod +x ${this.distro.pathFs}/home/live/Desktop/*.desktop`, {async: false})
    shx.exec(`chown live:live ${this.distro.pathFs}/home/live/Desktop/*`, {async: false})
  }

  show() {
    console.log('eggs: iso parameters ')
    console.log('>>> kernelVer: ' + this.distro.kernel)
    console.log('>>> netDomainName: ' + this.net.domainName)
  }

  async kill() {
    console.log('==========================================')
    console.log('iso: kill ')
    console.log('==========================================')
    Utils.shxExec(`rm -rf ${this.workDir}`)
  }

  async isoCreateStructure() {
    console.log('==========================================')
    console.log('iso: createStructure')
    console.log('==========================================')

    if (!fs.existsSync(this.distro.pathIso)) {
      Utils.shxExec(`mkdir -p ${this.distro.pathIso}/live`)
      Utils.shxExec(`mkdir -p ${this.distro.pathIso}/EFI`)
      Utils.shxExec(`mkdir -p ${this.distro.pathIso}/boot`)
      Utils.shxExec(`mkdir -p ${this.distro.pathIso}/boot/isolinux`)
      Utils.shxExec(`mkdir -p ${this.distro.pathIso}/boot/grub`)
      Utils.shxExec(`mkdir -p ${this.distro.pathIso}/boot/syslinux`)
      // Utils.shxExec(`ln -s ${this.distro.pathIso}/live  ${this.distro.pathIso}/antiX`)
    }
  }

  async isolinuxPrepare() {
    console.log('==========================================')
    console.log('iso: isolinuxPrepare')
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
    console.log('iso: isoStdmenuCfg')
    console.log('==========================================')

    const file = `${this.distro.pathIso}/boot/isolinux/stdmenu.cfg`
    const text = `
menu background penguins-eggs-3-syslinux.png
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
menu tabmsg Press ENTER to boot or TAB to edit a menu entry
  `

    Utils.bashWrite(file, text)
  }

  isolinuxCfg() {
    console.log('==========================================')
    console.log('iso: isolinuxCfg')
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
    Utils.bashWrite(file, text)
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

    const kernel = Utils.kernerlVersion()

    this.iso.append = 'append initrd=/live/initrd.img boot=live components username=live '
    this.iso.appendSafe = 'append initrd=/live/initrd.img boot=live components username=live xforcevesa verbose'
    this.iso.aqs = 'quit splash debug=true nocomponents '

    console.log('==========================================')
    console.log('iso: menuCfg')
    console.log('==========================================')

    const file = `${this.distro.pathIso}/boot/isolinux/menu.cfg`
    const text = `
    INCLUDE stdmenu.cfg
    MENU title Main Menu
    DEFAULT ^${this.distro.name} 
    LABEL ${this.distro.name} (kernel ${kernel}) Italian (it)
        SAY "Booting ${this.distro.name} Italian (it)"
        linux /live/vmlinuz
        ${this.iso.append} locales=it_IT.UTF-8 timezone=Europe/Rome ${this.iso.aqs}
    
    MENU begin advanced
    MENU title ${this.distro.name} with Localisation Support
    
    LABEL Albanian (sq) (kernel ${kernel})
          SAY "Booting Albanian (sq)..."
          linux /live/vmlinuz
          ${this.iso.append} locales=sq_AL.UTF-8 ${this.iso.aqs}
    LABEL Amharic (am) 
          SAY "Booting Amharic (am)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=am_ET.UTF-8 ${this.iso.aqs}
          
    LABEL Arabic (ar) 
          SAY "Booting Arabic (ar)..."
          linux /live/vmlinuz
          ${this.iso.append} locales=ar_EG.UTF-8 ${this.iso.aqs}
    
    LABEL Asturian (ast)
          SAY "Booting Asturian (ast)..."  
          linux /live/vmlinuz
          ${this.iso.append}  locales=ast_ES.UTF-8 ${this.iso.aqs}
    
    LABEL Basque (eu)
          SAY "Booting Basque (eu)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=eu_ES.UTF-8 ${this.iso.aqs}
          
    LABEL Belarusian (be)
          SAY "Booting Belarusian (be)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=be_BY.UTF-8 ${this.iso.aqs}
    
    LABEL Bangla (bn)
          SAY "Booting Bangla (bn)..."
          linux /live/vmlinuz
          ${this.iso.append} locales=bn_BD ${this.iso.aqs}
    
    LABEL Bosnian (bs)
          SAY "Booting Bosnian (bs)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=bs_BA.UTF-8 ${this.iso.aqs}
    
    LABEL Bulgarian (bg)
          SAY "Booting Bulgarian (bg)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=bg_BG.UTF-8 ${this.iso.aqs}
        
    LABEL Tibetan (bo)
          SAY "Booting Tibetan (bo)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=bo_IN ${this.iso.aqs}
        
        LABEL C (C)
          SAY "Booting C (C)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=C ${this.iso.aqs}
        
        LABEL Catalan (ca)
          SAY "Booting Catalan (ca)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=ca_ES.UTF-8 ${this.iso.aqs}
        
        LABEL Chinese (Simplified) (zh_CN)
          SAY "Booting Chinese (Simplified) (zh_CN)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=zh_CN.UTF-8 ${this.iso.aqs}
        
        LABEL Chinese (Traditional) (zh_TW)
          SAY "Booting Chinese (Traditional) (zh_TW)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=zh_TW.UTF-8 ${this.iso.aqs}
        
        LABEL Croatian (hr)
          SAY "Booting Croatian (hr)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=hr_HR.UTF-8 ${this.iso.aqs}
        
        LABEL Czech (cs)
          SAY "Booting Czech (cs)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=cs_CZ.UTF-8 ${this.iso.aqs}
        
        LABEL Danish (da)
          SAY "Booting Danish (da)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=da_DK.UTF-8 ${this.iso.aqs}
        
        LABEL Dutch (nl)
          SAY "Booting Dutch (nl)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=nl_NL.UTF-8 ${this.iso.aqs}
        
        LABEL Dzongkha (dz)
          SAY "Booting Dzongkha (dz)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=dz_BT ${this.iso.aqs}
        
        LABEL English (en)
          SAY "Booting English (en)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=en_US.UTF-8 ${this.iso.aqs}
        
        LABEL Esperanto (eo)
          SAY "Booting Esperanto (eo)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=eo.UTF-8 ${this.iso.aqs}
        
        LABEL Estonian (et)
          SAY "Booting Estonian (et)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=et_EE.UTF-8 ${this.iso.aqs}
        
        LABEL Finnish (fi)
          SAY "Booting Finnish (fi)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=fi_FI.UTF-8 ${this.iso.aqs}
        
        LABEL French (fr)
          SAY "Booting French (fr)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=fr_FR.UTF-8 ${this.iso.aqs}
        
        LABEL Galician (gl)
          SAY "Booting Galician (gl)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=gl_ES.UTF-8 ${this.iso.aqs}
        
        LABEL Georgian (ka)
          SAY "Booting Georgian (ka)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=ka_GE.UTF-8 ${this.iso.aqs}
        
        LABEL German (de)
          SAY "Booting German (de)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=de_DE.UTF-8 ${this.iso.aqs}
        
        LABEL Greek (el)
          SAY "Booting Greek (el)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=el_GR.UTF-8 ${this.iso.aqs}
        
        LABEL Gujarati (gu)
          SAY "Booting Gujarati (gu)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=gu_IN ${this.iso.aqs}
        
        LABEL Hebrew (he)
          SAY "Booting Hebrew (he)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=he_IL.UTF-8 ${this.iso.aqs}
        
        LABEL Hindi (hi)
          SAY "Booting Hindi (hi)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=hi_IN ${this.iso.aqs}
        
        LABEL Hungarian (hu)
          SAY "Booting Hungarian (hu)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=hu_HU.UTF-8 ${this.iso.aqs}
        
        LABEL Icelandic (is)
          SAY "Booting Icelandic (is)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=is_IS.UTF-8 ${this.iso.aqs}
        
        LABEL Indonesian (id)
          SAY "Booting Indonesian (id)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=id_ID.UTF-8 ${this.iso.aqs}
        
        LABEL Irish (ga)
          SAY "Booting Irish (ga)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=ga_IE.UTF-8 ${this.iso.aqs}
        
        LABEL Italian (it)
          SAY "Booting Italian (it)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=it_IT.UTF-8 ${this.iso.aqs}
        
        LABEL Japanese (ja)
          SAY "Booting Japanese (ja)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=ja_JP.UTF-8 ${this.iso.aqs}
        
        LABEL Kazakh (kk)
          SAY "Booting Kazakh (kk)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=kk_KZ.UTF-8 ${this.iso.aqs}
        
        LABEL Khmer (km)
          SAY "Booting Khmer (km)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=km_KH ${this.iso.aqs}
        
        LABEL Kannada (kn)
          SAY "Booting Kannada (kn)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=kn_IN ${this.iso.aqs}
        
        LABEL Korean (ko)
          SAY "Booting Korean (ko)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=ko_KR.UTF-8 ${this.iso.aqs}
        
        LABEL Kurdish (ku)
          SAY "Booting Kurdish (ku)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=ku_TR.UTF-8 ${this.iso.aqs}
        
        LABEL Lao (lo)
          SAY "Booting Lao (lo)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=lo_LA ${this.iso.aqs}
        
        LABEL Latvian (lv)
          SAY "Booting Latvian (lv)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=lv_LV.UTF-8 ${this.iso.aqs}
        
        LABEL Lithuanian (lt)
          SAY "Booting Lithuanian (lt)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=lt_LT.UTF-8 ${this.iso.aqs}
        
        LABEL Malayalam (ml)
          SAY "Booting Malayalam (ml)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=ml_IN ${this.iso.aqs}
        
        LABEL Marathi (mr)
          SAY "Booting Marathi (mr)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=mr_IN ${this.iso.aqs}
        
        LABEL Macedonian (mk)
          SAY "Booting Macedonian (mk)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=mk_MK.UTF-8 ${this.iso.aqs}
        
        LABEL Burmese (my)
          SAY "Booting Burmese (my)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=my_MM ${this.iso.aqs}
        
        LABEL Nepali (ne)
          SAY "Booting Nepali (ne)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=ne_NP ${this.iso.aqs}
        
        LABEL Northern Sami (se_NO)
          SAY "Booting Northern Sami (se_NO)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=se_NO ${this.iso.aqs}
        
        LABEL Norwegian Bokmaal (nb_NO)
          SAY "Booting Norwegian Bokmaal (nb_NO)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=nb_NO.UTF-8 ${this.iso.aqs}
        
        LABEL Norwegian Nynorsk (nn_NO)
          SAY "Booting Norwegian Nynorsk (nn_NO)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=nn_NO.UTF-8 ${this.iso.aqs}
        
        LABEL Persian (fa)
          SAY "Booting Persian (fa)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=fa_IR ${this.iso.aqs}
        
        LABEL Polish (pl)
          SAY "Booting Polish (pl)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=pl_PL.UTF-8 ${this.iso.aqs}
        
        LABEL Portuguese (pt)
          SAY "Booting Portuguese (pt)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=pt_PT.UTF-8 ${this.iso.aqs}
        
        LABEL Portuguese (Brazil) (pt_BR)
          SAY "Booting Portuguese (Brazil) (pt_BR)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=pt_BR.UTF-8 ${this.iso.aqs}
        
        LABEL Punjabi (Gurmukhi) (pa)
          SAY "Booting Punjabi (Gurmukhi) (pa)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=pa_IN ${this.iso.aqs}
        
        LABEL Romanian (ro)
          SAY "Booting Romanian (ro)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=ro_RO.UTF-8 ${this.iso.aqs}
        
        LABEL Russian (ru)
          SAY "Booting Russian (ru)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=ru_RU.UTF-8 ${this.iso.aqs}
        
        LABEL Sinhala (si)
          SAY "Booting Sinhala (si)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=si_LK ${this.iso.aqs}
        
        LABEL Serbian (Cyrillic) (sr)
          SAY "Booting Serbian (Cyrillic) (sr)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=sr_RS ${this.iso.aqs}
        
        LABEL Slovak (sk)
          SAY "Booting Slovak (sk)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=sk_SK.UTF-8 ${this.iso.aqs}
        
        LABEL Slovenian (sl)
          SAY "Booting Slovenian (sl)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=sl_SI.UTF-8 ${this.iso.aqs}
        
        LABEL Spanish (es)
          SAY "Booting Spanish (es)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=es_ES.UTF-8 ${this.iso.aqs}
        
        LABEL Swedish (sv)
          SAY "Booting Swedish (sv)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=sv_SE.UTF-8 ${this.iso.aqs}
        
        LABEL Tagalog (tl)
          SAY "Booting Tagalog (tl)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=tl_PH.UTF-8 ${this.iso.aqs}
        
        LABEL Tamil (ta)
          SAY "Booting Tamil (ta)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=ta_IN ${this.iso.aqs}
        
        LABEL Telugu (te)
          SAY "Booting Telugu (te)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=te_IN ${this.iso.aqs}
        
        LABEL Tajik (tg)
          SAY "Booting Tajik (tg)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=tg_TJ.UTF-8 ${this.iso.aqs}
        
        LABEL Thai (th)
          SAY "Booting Thai (th)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=th_TH.UTF-8 ${this.iso.aqs}
        
        LABEL Turkish (tr)
          SAY "Booting Turkish (tr)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=tr_TR.UTF-8 ${this.iso.aqs}
        
        LABEL Uyghur (ug)
          SAY "Booting Uyghur (ug)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=ug_CN ${this.iso.aqs}
        
        LABEL Ukrainian (uk)
          SAY "Booting Ukrainian (uk)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=uk_UA.UTF-8 ${this.iso.aqs}
        
        LABEL Vietnamese (vi)
          SAY "Booting Vietnamese (vi)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=vi_VN ${this.iso.aqs}
        
        LABEL Welsh (cy)
          SAY "Booting Welsh (cy)..."
          linux /live/vmlinuz
          ${this.iso.append}  locales=cy_GB.UTF-8 ${this.iso.aqs}
        
         LABEL mainmenu 
          MENU label Back
          MENU exit
          MENU end
         
    LABEL ${this.distro.name} safe
      MENU LABEL ^${this.distro.name} safe
      kernel /live/vmlinuz
      ${this.iso.appendSafe}`

    Utils.bashWrite(file, text)
    Utils.shxExec(`cp ${__dirname}/../../assets/penguins-eggs-3-syslinux.png ${this.distro.pathIso}/boot/isolinux`)
  }

  /**
   * alive: rende live
   */
  async copyKernel() {
    console.log('==========================================')
    console.log('iso: liveKernel')
    console.log('==========================================')
    Utils.shxExec(`cp /vmlinuz ${this.distro.pathIso}/live/`)
    Utils.shxExec(`cp /initrd.img ${this.distro.pathIso}/live/`)
  }

  /**
   * squashFs: crea in live filesystem.squashfs
   */
  async makeSquashFs() {
    console.log('==========================================')
    console.log('iso: makeSquashFs')
    console.log('==========================================')
    const option = `-comp ${this.compression}`
    Utils.shxExec(
      `mksquashfs ${this.distro.pathFs} ${this.distro.pathIso}/live/filesystem.squashfs ${option} -noappend`
    )
  }

  async makeIsoFs() {
    console.log('==========================================')
    console.log('iso: makeIsoFs')
    console.log('==========================================')

    const isoHybridOption = `-isohybrid-mbr ${this.iso.isolinuxPath}isohdpfx.bin `
    const volid = this.getFilename(this.iso.distroName)
    const isoName = `${this.workDir}${volid}`

    Utils.shxExec(
      `xorriso -as mkisofs -r -J -joliet-long -l -cache-inodes ${isoHybridOption} -partition_offset 16 -volid ${volid} -b boot/isolinux/isolinux.bin -c boot/isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table -o ${isoName} ${this.distro.pathIso}`
    )
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
    return `${basename}-${arch}-lv_${Utils.formatDate(new Date())}.iso`
  }
}
