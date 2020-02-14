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

  distro = {} as IDistro

  oses = {} as Oses

  iso = {} as IOses

  calamares = {} as Calamares

  prerequisites = {} as Prerequisites

  eggName = 'egg'

  i686 = false

  live = false

  force_installer = false

  reset_accounts = true

  debian_version = 10 as number

  lib_mod_dir = '' as string

  snapshot_dir = '/home/eggs/' as string // /home/snapshot

  work_dir = '/tmp/work_dir/'

  config_file = '/etc/penguins-eggs.conf' as string

  gui_editor = '/usr/bin/joe' as string

  snapshot_excludes = '/usr/local/share/excludes/penguins-eggs-exclude.list' as string

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

  bindRoot = '/.bind-root'

  // Altre mie
  users: string[] = []

  /**
   * Egg
   * @param compression
   */
  constructor(compression = 'xz') {
    this.compression = compression || ''
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
    this.compression = compression || ''
    this.live = Utils.isLive()
    this.users = Utils.usersList()
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
      this.work_dir = this.snapshot_dir
      this.distro.pathHome = this.work_dir + '.' +this.distro.name
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
    if (this.compression === '') {
      this.compression = settings.General.compression
    }
    this.snapshot_dir = settings.General.snapshot_dir.trim()
    if (!this.snapshot_dir.endsWith('/')){
      this.snapshot_dir += '/'
    }
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
    this.reset_accounts = settings.General.reset_accounts

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
      await this.system2live()
      await this.makeDhcp()
      console.log('------------------------------------------')
      console.log('Spawning the system into the egg...\nThis process can be very long, perhaps it\'s time for a coffee!')
      console.log('------------------------------------------')
      await this.makeSquashFs()
      await this.cleanUp()
      await this.makeIsoFs()
    }
  }

  /**
   * 
   */
  async  calamaresConfigure(){
    if (Utils.packageIsInstalled('calamares')){
      this.calamares = new Calamares(this.distro, this.iso)
      await this.calamares.configure()
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
    const bindRoot = '/.bind-root'
    Utils.write(`${bindRoot}/etc/network/interfaces`, text)
    /**
     * Clear configs from /etc/network/interfaces, wicd and NetworkManager
     * and netman, so they aren't stealthily included in the snapshot.
     */
    shx.exec(`rm -f ${bindRoot}/var/lib/wicd/configurations/*`)
    shx.exec(`rm -f ${bindRoot}/etc/wicd/wireless-settings.conf`)
    shx.exec(`rm -f ${bindRoot}/etc/NetworkManager/system-connections/*`)
    shx.exec(`rm -f ${bindRoot}/etc/network/wifi/*`)
  }

  /**
   *  async isoCreateStructure() {
   */
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

    Utils.write(file, text)
    Utils.shxExec(`cp ${__dirname}/../../assets/penguins-eggs-syslinux.png ${this.distro.pathIso}/boot/isolinux`)
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

    this.addRemoveExclusion(true, this.snapshot_dir /* .absolutePath() */)

    if (this.reset_accounts) {
      this.addRemoveExclusion(true, '/etc/minstall.conf')
      // exclude /etc/localtime if link and timezone not America/New_York
      if (Utils.shxExec('/usr/bin/test -L /etc/localtime') && Utils.shxExec('cat /etc/timezone') !== 'America/New_York') {
        this.addRemoveExclusion(true, '/etc/localtime')
      }
    }

    const option = `-comp ${this.compression} `
    Utils.shxExec(
      `mksquashfs /.bind-root ${this.distro.pathIso}/live/filesystem.squashfs ${option} -wildcards -ef ${this.snapshot_excludes} ${this.session_excludes} `
      // usr/bin/mksquashfs /.bind-root iso-template/antiX/linuxfs -comp ${this.compression} ${(this.mksq_opt === '' ? '' : ' ' + this.mksq_opt)} -wildcards -ef ${this.snapshot_excludes} ${this.session_excludes}`)
    )
  }

  async makeIsoFs() {
    console.log('==========================================')
    console.log('iso: makeIsoFs')
    console.log('==========================================')

    const isoHybridOption = `-isohybrid-mbr ${this.iso.isolinuxPath}isohdpfx.bin `
    const volid = this.getFilename(this.iso.distroName)
    const isoName = `${this.snapshot_dir}${volid}`

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
    let isoName = `${basename}-${arch}_${Utils.formatDate(new Date())}`
    if (isoName.length >= 32)
      isoName = isoName.substr(0,32)
    return `${isoName}.iso`
  }

  /**
   * Kill mksquashfs and md5sum...
   * Execute installed-to-live cleanup
   * Remove mx-snapshot in work_dir
   * if backup mode delete minstall.desktop in user
   */
  async cleanUp() {
    console.log('==========================================')
    console.log('ovary: cleanUp')
    console.log('==========================================')

    Utils.shxExec('sync')
    Utils.shxExec('/usr/bin/pkill mksquashfs; /usr/bin/pkill md5sum')
    Utils.shxExec('/usr/bin/[ -f /tmp/installed-to-live/cleanup.conf ] && /sbin/installed-to-live cleanup')

    if (fs.existsSync(`${this.work_dir}/mx-snapshot`)) {
      Utils.shxExec(`rm -r ${this.work_dir}`)
    }

  }

  /**
   * Check if exist mx-snapshot in work_dir;
   * If respin mode remove all the users
   */
  async system2live() {
    console.log('==========================================')
    console.log('ovary: system2live')
    console.log('==========================================')

    Utils.shxExec(`mkdir -r ${this.work_dir}/mx-snapshot`)

    // checks if work_dir looks OK
    // if (!this.work_dir.includes('/mx-snapshot')) { // Se non contiene /mx-snapshot
    //  console.log(`${this.work_dir} NON contiene mx-snapshot!`)
    //  return
    // }

    let bind_boot = ''
    let bind_boot_too = ''
    if (shx.exec('mountpoint /boot').code) {
      bind_boot = 'bind=/boot'
      bind_boot_too = ',/boot'
    }

    /**
     * setup environment if creating a respin 
     * (reset root/demo, remove personal accounts) 
     * */ 
    if (this.reset_accounts) {
      /**
       * Se resettiamo gli account e NON copiamo home, BISOGNA ricreare la home dell'user primario 1000:1000
       */
      const user: string = Utils.getPrimaryUser()
      Utils.shxExec(`/sbin/installed-to-live -b ${this.bindRoot} start ${bind_boot} empty=/home general version-file read-write`)
      // creazione di home per user live
      shx.exec(`cp -r /etc/skel/. ${this.bindRoot}/home/${user}`, {async: false})
      shx.exec(`chown -R live:live ${this.bindRoot}/home/${user}`, {async: false})
      shx.exec(`mkdir ${this.bindRoot}/home/${user}/Desktop`, {async: false})
  
      // creazione dei link per user live
      console.log('system2live: creating initial live link... \n')
      shx.exec(`cp /etc/penguins-eggs/${user}/Desktop/* ${this.bindRoot}/home/${user}/Desktop`, {async: false})
      shx.exec(`chmod +x ${this.bindRoot}/home/${user}/Desktop/*.desktop`, {async: false})
      shx.exec(`chown ${user}:${user} ${this.bindRoot}/home/${user}/Desktop/*`, {async: false})
    } else {
      Utils.shxExec(`/sbin/installed-to-live -b ${this.bindRoot} start bind=/home${bind_boot_too} live-files version-file adjtime read-write`)
    }

    shx.echo('Done')

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
}
