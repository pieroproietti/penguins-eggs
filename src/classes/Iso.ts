/**
 * penguins-eggs: iso.ts 
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

"use strict";

import fs from "fs";
import shell from "shelljs";
import utils from "../lib/utils";
import { IDistro, IOses, INet, IUser, IPackage } from "../interfaces";
import { dist } from "pjson";
import Oses from "./Oses";

/**
 * Iso: 
 */
class Iso {
  // Properties
  private app: IPackage;
  private workDir: string;

  private distro: IDistro;
  private net: INet;
  private user: IUser;
  private root: IUser;

  constructor(
    app: IPackage,
    workDir?: string,
    distro?: IDistro,
    user?: IUser,
    root?: IUser,
    net?: INet
  ) {
    this.app = {} as IPackage;
    this.distro = {} as IDistro;
    this.user = {} as IUser;
    this.root = {} as IUser;
    this.net = {} as INet;

    this.app = app;

    if (workDir == undefined) {
      this.workDir = "/home/eggs/";
    } else {
      this.workDir = workDir;
    }

    if (distro == undefined) {
      this.distro.name = 'penguin';
      this.distro.kernel = utils.kernerlVersion();
    } else {
      this.distro.name = distro.name;
      this.distro.kernel = distro.kernel;
    }
    this.distro.pathHome = workDir + `${this.distro.name}`;
    this.distro.pathFs = this.distro.pathHome + `/fs`;
    this.distro.pathIso = this.distro.pathHome + `/iso`;

    if (net == undefined) {
      this.net.dhcp = false;
      this.net.address = "192.168.61.100";
      this.net.netmask = "255.255.255.0";
      this.net.gateway = "192.168.61.1";
    } else {
      this.net.dhcp = net.dhcp;
      this.net.address = net.address;
      this.net.netmask = net.netmask;
      this.net.gateway = net.gateway;
    }
    this.net.name = utils.netDeviceName();
    this.net.domainName = "lan";
    this.net.dnsAddress = utils.netDns();

    if (user == undefined) {
      this.user.name = "live";
      this.user.fullName = "live";
      this.user.password = "evolution"
    } else {
      this.user.name = user.name;
      this.user.fullName = user.fullName;
      this.user.password = user.password;
    }

    if (root == undefined) {
      this.root.name = "root";
      this.root.fullName = "root";
      this.root.password = "evolution"
    } else {
      this.root.name = user.name;
      this.root.fullName = user.fullName;
      this.root.password = user.password;
    }

  }

  async produce(o: IOses, c: any) {

    if (await utils.isLive()) {
      console.log(
        ">>> eggs: This is a live system! An egg cannot be produced from an egg!"
      );
    } else {
      c.configure(o);
      console.log("------------------------------------------");
      console.log(`Laying the system into the egg...`);
      console.log("------------------------------------------");
      await this.eggCreateStructure();
      await this.isoCreateStructure();
      await this.isolinuxPrepare(o);
      await this.stdMenuCfg(o);
      await this.isolinuxCfg(o);
      await this.menuCfg(o);
      await this.liveKernel();
      console.log("------------------------------------------");
      console.log(`Spawning the system into the egg...\nThis process can be very long, perhaps it's time for a coffee!`);
      console.log("------------------------------------------");
      await this.system2egg();
      await this.liveDhcp();
      await this.liveSquashFs();
      await this.makeIsoFs(o);
    }
  }

  /**
   * 
   */
  public async liveDhcp() {
    console.log("==========================================");
    console.log(`liveDhcp: `);
    console.log("==========================================");
    let text = `auto lo\niface lo inet loopback`;
    utils.bashWrite(`${this.distro.pathFs}/etc/network/interfaces`, text);
  }

  /**
   * eggCreateStructue
   */
  public async eggCreateStructure() {
    console.log("==========================================");
    console.log("eggs: createStructure");
    console.log("==========================================");
    if (!fs.existsSync(this.distro.pathHome)) {
      utils.exec(`mkdir -p ${this.distro.pathHome}`);
    }

    if (!fs.existsSync(this.distro.pathFs)) {
      //utils.exec(`rm -rf ${this.distro.pathFs}`);
      utils.exec(`mkdir -p ${this.distro.pathFs}`);
      utils.exec(`mkdir -p ${this.distro.pathFs}/dev`);
      utils.exec(`mkdir -p ${this.distro.pathFs}/etc`);
      utils.exec(`mkdir -p ${this.distro.pathFs}/etc/intefaces`);
      utils.exec(`mkdir -p ${this.distro.pathFs}/etc/live`);
      utils.exec(`mkdir -p ${this.distro.pathFs}/proc`);
      utils.exec(`mkdir -p ${this.distro.pathFs}/sys`);
      utils.exec(`mkdir -p ${this.distro.pathFs}/media`);
      utils.exec(`mkdir -p ${this.distro.pathFs}/run`);
      utils.exec(`mkdir -p ${this.distro.pathFs}/var`);
      utils.exec(`mkdir -p ${this.distro.pathFs}/tmp`);
    }
  }

  /**
   * system2egg
   */
  public async system2egg() {
    let cmd:string = "";
    let f=``;
    // root
    f += ` --filter="- /cdrom/*"`;
    f += ` --filter="- /dev/*"`;
    f += ` --filter="- /live"`;
    f += ` --filter="- /media/*"`;
    f += ` --filter="- /mnt/*"`;
    f += ` --filter="- /proc/*"`;
    f += ` --filter="- /sys/*"`;
    f += ` --filter="- /swapfile"`;
    f += ` --filter="- /tmp/*"`;
    f += ` --filter="- /persistence.conf"`;

    // boot
    f += ` --filter="- /boot/grub/grub.cfg"`;
    f += ` --filter="- /boot/grub/menu.lst"`;
    f += ` --filter="- /boot/grub/device.map"`;
    f += ` --filter="- /boot/*.bak"`;
    f += ` --filter="- /boot/*.old-dkms"`;
    
    // etc
    f += ` --filter="- /etc/apt/sources.list~"`;
    f += ` --filter="- /etc/blkid.tab"`;
    f += ` --filter="- /etc/blkid.tab.old"`;
    f += ` --filter="- /etc/crypttab"`;
    f += ` --filter="- /etc/fstab"`;
    f += ` --filter="- /etc/fstab.d/*"`;
    f += ` --filter="- /etc/initramfs-tools/conf.d/resume"`; // see remove-cryptroot and nocrypt.sh
    f += ` --filter="- /etc/initramfs-tools/conf.d/cryptroot"`; // see remove-cryptroot and nocrypt.sh
    f += ` --filter="- /etc/mtab"`;
    f += ` --filter="- /etc/popularity-contest.conf"`; 
    f += ` --filter="- /etc/ssh/ssh_host_*_key*"`; // Exclude ssh_host_keys. New ones will be generated upon live boot.
    f += ` --filter="- /etc/ssh/ssh_host_key*"`; // Exclude ssh_host_keys. New ones will be generated upon live boot.
    

    // lib
    f += ` --filter="- /lib/live/image"`;
    f += ` --filter="- /lib/live/mount"`;
    f += ` --filter="- /lib/live/overlay"`;
    f += ` --filter="- /lib/live/rootfs"`;
    
    f += ` --filter="- /home/*"`;
    f += ` --filter="- /root/*"`;
    f += ` --filter="- /run/*"`;

    // var
    f += ` --filter="- /var/backups/*.gz"`;
    f += ` --filter="- /var/cache/apt/archives/*.deb"`;
    f += ` --filter="- /var/cache/apt/pkgcache.bin"`;
    f += ` --filter="- /var/cache/apt/srcpkgcache.bin"`;
    f += ` --filter="- /var/cache/apt/apt-file/*"`;
    f += ` --filter="- /var/cache/debconf/*~old"`;
    f += ` --filter="- /var/lib/apt/*~"`;
    f += ` --filter="- /var/lib/apt/cdroms.list"`;
    f += ` --filter="- /var/lib/apt/lists/*"`;
    f += ` --filter="- /var/lib/aptitude/*.old"`;
    f += ` --filter="- /var/lib/dbus/machine-id"`;
    f += ` --filter="- /var/lib/dhcp/*"`;
    f += ` --filter="- /var/lib/dpkg/*~old"`;
    f += ` --filter="- /var/lib/live/config/*"`;
    f += ` --filter="- /var/log/*"`;
    f += ` --filter="- /var/mail/*"`;
    f += ` --filter="- /var/spool/mail/*"`;

    // usr
    f += ` --filter="- /usr/share/icons/*/icon-theme.cache"`;
    f += ` --filter="- /usr/lib/live/image"`;
    f += ` --filter="- /usr/lib/live/mount"`;
    f += ` --filter="- /usr/lib/live/overlay"`;
    f += ` --filter="- /usr/lib/live/rootfs"`;


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
      / ${this.distro.pathFs}`;
      console.log(`system2egg: copyng system... \n`);
      shell.exec(cmd.trim(), {
        async: false
      });
  

      console.log(`system2egg: creating home... \n`);
      shell.exec(`cp -r /etc/skel/. ${this.distro.pathFs}/home/live`, {async: false});
      shell.exec(`chown -R live:live ${this.distro.pathFs}/home/live`, {async: false});
      shell.exec(`mkdir ${this.distro.pathFs}/home/live/Desktop`, {async: false});

      console.log(`system2egg: creating initial live link... \n`);
      shell.exec(`cp /etc/penguins-eggs/live/Desktop/* ${this.distro.pathFs}/home/live/Desktop`, {async: false});
      shell.exec(`chmod +x ${this.distro.pathFs}/home/live/Desktop/*.desktop`, {async: false});
      shell.exec(`chown live:live ${this.distro.pathFs}/home/live/Desktop/*`, {async: false});
  }


  show() {
    console.log("eggs: iso parameters ");
    console.log(">>> kernelVer: " + this.distro.kernel);
    console.log(">>> netDomainName: " + this.net.domainName);
  }

  async kill() {
    console.log("==========================================");
    console.log("iso: kill ");
    console.log("==========================================");
    utils.exec(`rm -rf ${this.workDir}`);
  }



  async isoCreateStructure() {
    console.log("==========================================");
    console.log("iso: createStructure");
    console.log("==========================================");

    if (!fs.existsSync(this.distro.pathIso)) {
      utils.exec(`mkdir -p ${this.distro.pathIso}/live`);
      utils.exec(`mkdir -p ${this.distro.pathIso}/isolinux`);
      utils.exec(`mkdir -p ${this.distro.pathIso}/EFI`);
      utils.exec(`mkdir -p ${this.distro.pathIso}/boot`);
    }
  }


  async isolinuxPrepare(o: any) {
    console.log("==========================================");
    console.log("iso: isolinuxPrepare");
    console.log("==========================================");

    let isolinuxbin = `${o.isolinuxPath}isolinux.bin`;
    let vesamenu = `${o.syslinuxPath}vesamenu.c32`;

    utils.exec(
      `rsync -a ${o.syslinuxPath}chain.c32 ${this.distro.pathIso}/isolinux/`
    );
    utils.exec(
      `rsync -a ${o.syslinuxPath}ldlinux.c32 ${this.distro.pathIso}/isolinux/`
    );
    utils.exec(
      `rsync -a ${o.syslinuxPath}libcom32.c32 ${this.distro.pathIso}/isolinux/`
    );
    utils.exec(
      `rsync -a ${o.syslinuxPath}libutil.c32 ${this.distro.pathIso}/isolinux/`
    );
    utils.exec(`rsync -a ${isolinuxbin} ${this.distro.pathIso}/isolinux/`);
    utils.exec(`rsync -a ${vesamenu} ${this.distro.pathIso}/isolinux/`);
  }


  async stdMenuCfg(o: IOses){
    console.log("==========================================");
    console.log("iso: stdMenuCfg");
    console.log("==========================================");

    let file = `${this.distro.pathIso}/isolinux/stdmenu.cfg`;
    let text = `
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
  `;

  utils.bashWrite(file, text);
    
  }


  isolinuxCfg(o: IOses){
    console.log("==========================================");
    console.log("iso: isolinuxCfg");
    console.log("==========================================");

    let file = `${this.distro.pathIso}/isolinux/isolinux.cfg`;
    let text = `
# Generated by ${this.app.name} V. ${this.app.version} 
# D-I config version 2.0
# search path for the c32 support libraries (libcom32, libutil etc.)
path 
include menu.cfg
default vesamenu.c32
prompt 0
timeout 0
`;
utils.bashWrite(file, text);

  }

  async menuCfg(o: IOses) {
    let kernel = utils.kernerlVersion();

    o.append = `append initrd=/live/initrd.img boot=live `;
    o.appendSafe = `append initrd=/live/initrd.img boot=live components username=live xforcevesa nomodeset verbose`;
    o.aqs =`quit splash`

    console.log("==========================================");
    console.log("iso: menuCfg");
    console.log("==========================================");

    let file = `${this.distro.pathIso}/isolinux/menu.cfg`;
    let text = `
    INCLUDE stdmenu.cfg
    MENU title Main Menu
    DEFAULT ^${this.distro.name} 
    LABEL ${this.distro.name} (kernel ${kernel}) Italian (it)
        SAY "Booting ${this.distro.name} Italian (it)"
        linux /live/vmlinuz
        ${o.append} components locales=it_IT.UTF-8 ${o.aqs}
    
    MENU begin advanced
    MENU title ${this.distro.name} with Localisation Support
    
    LABEL Albanian (sq) (kernel ${kernel})
          SAY "Booting Albanian (sq)..."
          linux /live/vmlinuz
          ${o.append} components locales=sq_AL.UTF-8 ${o.aqs}

    LABEL Amharic (am) 
          SAY "Booting Amharic (am)..."
          linux /live/vmlinuz
          ${o.append} components locales=am_ET.UTF-8 ${o.aqs}
          
    LABEL Arabic (ar) 
          SAY "Booting Arabic (ar)..."
          linux /live/vmlinuz
          ${o.append} locales=ar_EG.UTF-8 ${o.aqs}
    
    LABEL Asturian (ast)
          SAY "Booting Asturian (ast)..."  
          linux /live/vmlinuz
          ${o.append} components locales=ast_ES.UTF-8 ${o.aqs}
    
    LABEL Basque (eu)
          SAY "Booting Basque (eu)..."
          linux /live/vmlinuz
          ${o.append} components locales=eu_ES.UTF-8 ${o.aqs}
          
    LABEL Belarusian (be)
          SAY "Booting Belarusian (be)..."
          linux /live/vmlinuz
          ${o.append} components locales=be_BY.UTF-8 ${o.aqs}
    
    LABEL Bangla (bn)
          SAY "Booting Bangla (bn)..."
          linux /live/vmlinuz
          ${o.append}components locales=bn_BD ${o.aqs}
    
    LABEL Bosnian (bs)
          SAY "Booting Bosnian (bs)..."
          linux /live/vmlinuz
          ${o.append} components locales=bs_BA.UTF-8 ${o.aqs}
    
    LABEL Bulgarian (bg)
          SAY "Booting Bulgarian (bg)..."
          linux /live/vmlinuz
          ${o.append} components locales=bg_BG.UTF-8 ${o.aqs}
        
    LABEL Tibetan (bo)
          SAY "Booting Tibetan (bo)..."
          linux /live/vmlinuz
          ${o.append} components locales=bo_IN ${o.aqs}
        
        LABEL C (C)
          SAY "Booting C (C)..."
          linux /live/vmlinuz
          ${o.append} components locales=C ${o.aqs}
        
        LABEL Catalan (ca)
          SAY "Booting Catalan (ca)..."
          linux /live/vmlinuz
          ${o.append} components locales=ca_ES.UTF-8 ${o.aqs}
        
        LABEL Chinese (Simplified) (zh_CN)
          SAY "Booting Chinese (Simplified) (zh_CN)..."
          linux /live/vmlinuz
          ${o.append} components locales=zh_CN.UTF-8 ${o.aqs}
        
        LABEL Chinese (Traditional) (zh_TW)
          SAY "Booting Chinese (Traditional) (zh_TW)..."
          linux /live/vmlinuz
          ${o.append} components locales=zh_TW.UTF-8 ${o.aqs}
        
        LABEL Croatian (hr)
          SAY "Booting Croatian (hr)..."
          linux /live/vmlinuz
          ${o.append} components locales=hr_HR.UTF-8 ${o.aqs}
        
        LABEL Czech (cs)
          SAY "Booting Czech (cs)..."
          linux /live/vmlinuz
          ${o.append} components locales=cs_CZ.UTF-8 ${o.aqs}
        
        LABEL Danish (da)
          SAY "Booting Danish (da)..."
          linux /live/vmlinuz
          ${o.append} components locales=da_DK.UTF-8 ${o.aqs}
        
        LABEL Dutch (nl)
          SAY "Booting Dutch (nl)..."
          linux /live/vmlinuz
          ${o.append} components locales=nl_NL.UTF-8 ${o.aqs}
        
        LABEL Dzongkha (dz)
          SAY "Booting Dzongkha (dz)..."
          linux /live/vmlinuz
          ${o.append} components locales=dz_BT ${o.aqs}
        
        LABEL English (en)
          SAY "Booting English (en)..."
          linux /live/vmlinuz
          ${o.append} components locales=en_US.UTF-8 ${o.aqs}
        
        LABEL Esperanto (eo)
          SAY "Booting Esperanto (eo)..."
          linux /live/vmlinuz
          ${o.append} components locales=eo.UTF-8 ${o.aqs}
        
        LABEL Estonian (et)
          SAY "Booting Estonian (et)..."
          linux /live/vmlinuz
          ${o.append} components locales=et_EE.UTF-8 ${o.aqs}
        
        LABEL Finnish (fi)
          SAY "Booting Finnish (fi)..."
          linux /live/vmlinuz
          ${o.append} components locales=fi_FI.UTF-8 ${o.aqs}
        
        LABEL French (fr)
          SAY "Booting French (fr)..."
          linux /live/vmlinuz
          ${o.append} components locales=fr_FR.UTF-8 ${o.aqs}
        
        LABEL Galician (gl)
          SAY "Booting Galician (gl)..."
          linux /live/vmlinuz
          ${o.append} components locales=gl_ES.UTF-8 ${o.aqs}
        
        LABEL Georgian (ka)
          SAY "Booting Georgian (ka)..."
          linux /live/vmlinuz
          ${o.append} components locales=ka_GE.UTF-8 ${o.aqs}
        
        LABEL German (de)
          SAY "Booting German (de)..."
          linux /live/vmlinuz
          ${o.append} components locales=de_DE.UTF-8 ${o.aqs}
        
        LABEL Greek (el)
          SAY "Booting Greek (el)..."
          linux /live/vmlinuz
          ${o.append} components locales=el_GR.UTF-8 ${o.aqs}
        
        LABEL Gujarati (gu)
          SAY "Booting Gujarati (gu)..."
          linux /live/vmlinuz
          ${o.append} components locales=gu_IN ${o.aqs}
        
        LABEL Hebrew (he)
          SAY "Booting Hebrew (he)..."
          linux /live/vmlinuz
          ${o.append} components locales=he_IL.UTF-8 ${o.aqs}
        
        LABEL Hindi (hi)
          SAY "Booting Hindi (hi)..."
          linux /live/vmlinuz
          ${o.append} components locales=hi_IN ${o.aqs}
        
        LABEL Hungarian (hu)
          SAY "Booting Hungarian (hu)..."
          linux /live/vmlinuz
          ${o.append} components locales=hu_HU.UTF-8 ${o.aqs}
        
        LABEL Icelandic (is)
          SAY "Booting Icelandic (is)..."
          linux /live/vmlinuz
          ${o.append} components locales=is_IS.UTF-8 ${o.aqs}
        
        LABEL Indonesian (id)
          SAY "Booting Indonesian (id)..."
          linux /live/vmlinuz
          ${o.append} components locales=id_ID.UTF-8 ${o.aqs}
        
        LABEL Irish (ga)
          SAY "Booting Irish (ga)..."
          linux /live/vmlinuz
          ${o.append} components locales=ga_IE.UTF-8 ${o.aqs}
        
        LABEL Italian (it)
          SAY "Booting Italian (it)..."
          linux /live/vmlinuz
          ${o.append} components locales=it_IT.UTF-8 ${o.aqs}
        
        LABEL Japanese (ja)
          SAY "Booting Japanese (ja)..."
          linux /live/vmlinuz
          ${o.append} components locales=ja_JP.UTF-8 ${o.aqs}
        
        LABEL Kazakh (kk)
          SAY "Booting Kazakh (kk)..."
          linux /live/vmlinuz
          ${o.append} components locales=kk_KZ.UTF-8 ${o.aqs}
        
        LABEL Khmer (km)
          SAY "Booting Khmer (km)..."
          linux /live/vmlinuz
          ${o.append} components locales=km_KH ${o.aqs}
        
        LABEL Kannada (kn)
          SAY "Booting Kannada (kn)..."
          linux /live/vmlinuz
          ${o.append} components locales=kn_IN ${o.aqs}
        
        LABEL Korean (ko)
          SAY "Booting Korean (ko)..."
          linux /live/vmlinuz
          ${o.append} components locales=ko_KR.UTF-8 ${o.aqs}
        
        LABEL Kurdish (ku)
          SAY "Booting Kurdish (ku)..."
          linux /live/vmlinuz
          ${o.append} components locales=ku_TR.UTF-8 ${o.aqs}
        
        LABEL Lao (lo)
          SAY "Booting Lao (lo)..."
          linux /live/vmlinuz
          ${o.append} components locales=lo_LA ${o.aqs}
        
        LABEL Latvian (lv)
          SAY "Booting Latvian (lv)..."
          linux /live/vmlinuz
          ${o.append} components locales=lv_LV.UTF-8 ${o.aqs}
        
        LABEL Lithuanian (lt)
          SAY "Booting Lithuanian (lt)..."
          linux /live/vmlinuz
          ${o.append} components locales=lt_LT.UTF-8 ${o.aqs}
        
        LABEL Malayalam (ml)
          SAY "Booting Malayalam (ml)..."
          linux /live/vmlinuz
          ${o.append} components locales=ml_IN ${o.aqs}
        
        LABEL Marathi (mr)
          SAY "Booting Marathi (mr)..."
          linux /live/vmlinuz
          ${o.append} components locales=mr_IN ${o.aqs}
        
        LABEL Macedonian (mk)
          SAY "Booting Macedonian (mk)..."
          linux /live/vmlinuz
          ${o.append} components locales=mk_MK.UTF-8 ${o.aqs}
        
        LABEL Burmese (my)
          SAY "Booting Burmese (my)..."
          linux /live/vmlinuz
          ${o.append} components locales=my_MM ${o.aqs}
        
        LABEL Nepali (ne)
          SAY "Booting Nepali (ne)..."
          linux /live/vmlinuz
          ${o.append} components locales=ne_NP ${o.aqs}
        
        LABEL Northern Sami (se_NO)
          SAY "Booting Northern Sami (se_NO)..."
          linux /live/vmlinuz
          ${o.append} components locales=se_NO ${o.aqs}
        
        LABEL Norwegian Bokmaal (nb_NO)
          SAY "Booting Norwegian Bokmaal (nb_NO)..."
          linux /live/vmlinuz
          ${o.append} components locales=nb_NO.UTF-8 ${o.aqs}
        
        LABEL Norwegian Nynorsk (nn_NO)
          SAY "Booting Norwegian Nynorsk (nn_NO)..."
          linux /live/vmlinuz
          ${o.append} components locales=nn_NO.UTF-8 ${o.aqs}
        
        LABEL Persian (fa)
          SAY "Booting Persian (fa)..."
          linux /live/vmlinuz
          ${o.append} components locales=fa_IR ${o.aqs}
        
        LABEL Polish (pl)
          SAY "Booting Polish (pl)..."
          linux /live/vmlinuz
          ${o.append} components locales=pl_PL.UTF-8 ${o.aqs}
        
        LABEL Portuguese (pt)
          SAY "Booting Portuguese (pt)..."
          linux /live/vmlinuz
          ${o.append} components locales=pt_PT.UTF-8 ${o.aqs}
        
        LABEL Portuguese (Brazil) (pt_BR)
          SAY "Booting Portuguese (Brazil) (pt_BR)..."
          linux /live/vmlinuz
          ${o.append} components locales=pt_BR.UTF-8 ${o.aqs}
        
        LABEL Punjabi (Gurmukhi) (pa)
          SAY "Booting Punjabi (Gurmukhi) (pa)..."
          linux /live/vmlinuz
          ${o.append} components locales=pa_IN ${o.aqs}
        
        LABEL Romanian (ro)
          SAY "Booting Romanian (ro)..."
          linux /live/vmlinuz
          ${o.append} components locales=ro_RO.UTF-8 ${o.aqs}
        
        LABEL Russian (ru)
          SAY "Booting Russian (ru)..."
          linux /live/vmlinuz
          ${o.append} components locales=ru_RU.UTF-8 ${o.aqs}
        
        LABEL Sinhala (si)
          SAY "Booting Sinhala (si)..."
          linux /live/vmlinuz
          ${o.append} components locales=si_LK ${o.aqs}
        
        LABEL Serbian (Cyrillic) (sr)
          SAY "Booting Serbian (Cyrillic) (sr)..."
          linux /live/vmlinuz
          ${o.append} components locales=sr_RS ${o.aqs}
        
        LABEL Slovak (sk)
          SAY "Booting Slovak (sk)..."
          linux /live/vmlinuz
          ${o.append} components locales=sk_SK.UTF-8 ${o.aqs}
        
        LABEL Slovenian (sl)
          SAY "Booting Slovenian (sl)..."
          linux /live/vmlinuz
          ${o.append} components locales=sl_SI.UTF-8 ${o.aqs}
        
        LABEL Spanish (es)
          SAY "Booting Spanish (es)..."
          linux /live/vmlinuz
          ${o.append} components locales=es_ES.UTF-8 ${o.aqs}
        
        LABEL Swedish (sv)
          SAY "Booting Swedish (sv)..."
          linux /live/vmlinuz
          ${o.append} components locales=sv_SE.UTF-8 ${o.aqs}
        
        LABEL Tagalog (tl)
          SAY "Booting Tagalog (tl)..."
          linux /live/vmlinuz
          ${o.append} components locales=tl_PH.UTF-8 ${o.aqs}
        
        LABEL Tamil (ta)
          SAY "Booting Tamil (ta)..."
          linux /live/vmlinuz
          ${o.append} components locales=ta_IN ${o.aqs}
        
        LABEL Telugu (te)
          SAY "Booting Telugu (te)..."
          linux /live/vmlinuz
          ${o.append} components locales=te_IN ${o.aqs}
        
        LABEL Tajik (tg)
          SAY "Booting Tajik (tg)..."
          linux /live/vmlinuz
          ${o.append} components locales=tg_TJ.UTF-8 ${o.aqs}
        
        LABEL Thai (th)
          SAY "Booting Thai (th)..."
          linux /live/vmlinuz
          ${o.append} components locales=th_TH.UTF-8 ${o.aqs}
        
        LABEL Turkish (tr)
          SAY "Booting Turkish (tr)..."
          linux /live/vmlinuz
          ${o.append} components locales=tr_TR.UTF-8 ${o.aqs}
        
        LABEL Uyghur (ug)
          SAY "Booting Uyghur (ug)..."
          linux /live/vmlinuz
          ${o.append} components locales=ug_CN ${o.aqs}
        
        LABEL Ukrainian (uk)
          SAY "Booting Ukrainian (uk)..."
          linux /live/vmlinuz
          ${o.append} components locales=uk_UA.UTF-8 ${o.aqs}
        
        LABEL Vietnamese (vi)
          SAY "Booting Vietnamese (vi)..."
          linux /live/vmlinuz
          ${o.append} components locales=vi_VN ${o.aqs}
        
        LABEL Welsh (cy)
          SAY "Booting Welsh (cy)..."
          linux /live/vmlinuz
          ${o.append} components locales=cy_GB.UTF-8 ${o.aqs}
        
         LABEL mainmenu 
          MENU label Back
          MENU exit
          MENU end
         
    LABEL ${this.distro.name} safe
      MENU LABEL ^${this.distro.name} safe
      kernel /live/vmlinuz
      ${o.appendSafe}`;      
    

    utils.bashWrite(file, text);
    utils.exec(`cp ${__dirname}/../../assets/penguins-eggs-3-syslinux.png ${this.distro.pathIso}/isolinux`);
  }

  /**
   * alive: rende live 
   */
  async liveKernel() {
    console.log("==========================================");
    console.log("iso: liveKernel");
    console.log("==========================================");
    utils.exec(`cp /vmlinuz ${this.distro.pathIso}/live/`);
    utils.exec(`cp /initrd.img ${this.distro.pathIso}/live/`);
  }

  /**
   * squashFs: crea in live filesystem.squashfs
   */
  async liveSquashFs() {
    console.log("==========================================");
    console.log("iso: liveSquashFs");
    console.log("==========================================");
    let option = "-comp xz";
    utils.exec(
      `mksquashfs ${this.distro.pathFs} ${this.distro.pathIso}/live/filesystem.squashfs ${option} -noappend`
    );
  }

  async makeIsoFs(o: IOses) {
    console.log("==========================================");
    console.log("iso: makeIsoFs");
    console.log("==========================================");

    let isoHybridOption = `-isohybrid-mbr ${o.isolinuxPath}isohdpfx.bin `;
    let volid = o.distroName + utils.date4file();
    let isoName = `${this.workDir}${volid}.iso`;

    utils.exec(
      `xorriso -as mkisofs -r -J -joliet-long -l -cache-inodes ${isoHybridOption} -partition_offset 16 -volid ${volid} -b isolinux/isolinux.bin -c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table -o ${isoName} ${this.distro.pathIso}`
    );
  }
}

export default Iso;
