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
      c.configure(o)
      console.log("------------------------------------------")
      console.log(`Laying the system into the egg...`)
      console.log("------------------------------------------")
      await this.eggCreateStructure()
      await this.isoCreateStructure()
      await this.isolinuxPrepare(o)
      // await this.isoStdmenuCfg(o)
      // await this.isolinuxCfg(o)
      // await this.IsoMenuCfg(o) 
      await this.copyKernel()
      console.log("------------------------------------------")
      console.log(`Spawning the system into the egg...\nThis process can be very long, perhaps it's time for a coffee!`)
      console.log("------------------------------------------")
      await this.system2egg()
      await this.makeDhcp()
      await this.makeSquashFs()
      await this.makeIsoFs(o)
    }
  }

    /**
   * 
   */
  public async makeDhcp() {
    console.log("==========================================");
    console.log(`makeDhcp: `);
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
    f += ` --filter="- /etc/sudoers.d/live"`; // Exclude live da sudoers.d non serve se installato
    

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
      utils.exec(`mkdir -p ${this.distro.pathIso}/antiX`);
      utils.exec(`mkdir -p ${this.distro.pathIso}/EFI`);
      utils.exec(`mkdir -p ${this.distro.pathIso}/boot`);
      utils.exec(`mkdir -p ${this.distro.pathIso}/boot/isolinux`);
    }
  }


  async isolinuxPrepare(o: any) {
    console.log("==========================================");
    console.log("iso: isolinuxPrepare");
    console.log("==========================================");

    let isolinuxbin = `${o.isolinuxPath}isolinux.bin`;
    let vesamenu = `${o.syslinuxPath}vesamenu.c32`;

    utils.exec(
      `rsync -a ${o.syslinuxPath}chain.c32 ${this.distro.pathIso}/boot/isolinux/`
    );
    utils.exec(
      `rsync -a ${o.syslinuxPath}ldlinux.c32 ${this.distro.pathIso}/boot/isolinux/`
    );
    utils.exec(
      `rsync -a ${o.syslinuxPath}libcom32.c32 ${this.distro.pathIso}/boot/isolinux/`
    );
    utils.exec(
      `rsync -a ${o.syslinuxPath}libutil.c32 ${this.distro.pathIso}/boot/isolinux/`
    );
    utils.exec(`rsync -a ${isolinuxbin} ${this.distro.pathIso}/boot/isolinux/`);
    utils.exec(`rsync -a ${vesamenu} ${this.distro.pathIso}/boot/isolinux/`);
  }


  async isoStdmenuCfg(o: IOses){
    console.log("==========================================");
    console.log("iso: isoStdmenuCfg");
    console.log("==========================================");

    let file = `${this.distro.pathIso}/boot/isolinux/stdmenu.cfg`;
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

    let file = `${this.distro.pathIso}/boot/isolinux/isolinux.cfg`;
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

  async IsoMenuCfg(o: IOses) {
    let kernel = utils.kernerlVersion();

    o.append = `append initrd=/antiX/initrd.gz `;
    o.appendSafe = `append initrd=/antiX/initrd.gz verbose`;
    o.aqs =`quiet splash`

    console.log("==========================================");
    console.log("iso: IsoMenuCfg");
    console.log("==========================================");

    let file = `${this.distro.pathIso}/boot/isolinux/menu.cfg`;
    let text = `
    INCLUDE stdmenu.cfg
    MENU title Main Menu
    DEFAULT ^${this.distro.name} 
    LABEL ${this.distro.name} (kernel ${kernel}) Italian (it)
        SAY "Booting ${this.distro.name} Italian (it)"
        linux /antiX/vmlinuz
        ${o.append} ${o.aqs}
    
    MENU begin advanced
    MENU title ${this.distro.name} with Localisation Support
    
        LABEL English (en)
          SAY "Booting English (en)..."
          linux /antiX/vmlinuz
          ${o.append} components locales=it_IT.UTF-8 ${o.aqs}
              
         LABEL mainmenu 
          MENU label Back
          MENU exit
          MENU end
         
    LABEL ${this.distro.name} safe
      MENU LABEL ^${this.distro.name} safe
      kernel /antiX/vmlinuz
      ${o.append} ${o.aqs}`;


    utils.bashWrite(file, text);
    utils.exec(`cp ${__dirname}/../../assets/penguins-eggs-3-syslinux.png ${this.distro.pathIso}/boot/isolinux`);
  }

  /**
   * alive: rende live 
   */
  async copyKernel() {
    console.log("==========================================");
    console.log("iso: liveKernel");
    console.log("==========================================");
    utils.exec(`cp /vmlinuz ${this.distro.pathIso}/antiX/`);
    // Attenzione alle seguenti istruzioni solo X64 
    utils.exec(`mv ../mx/iso-template/boot/grub/grub.cfg_x64 ../mx/iso-template/boot/grub/grub.cfg`)
    utils.exec(`mv ../mx/iso-template/boot/syslinux/syslinux.cfg_x64 ../mx/iso-template/boot/syslinux/syslinux.cfg`)
    utils.exec(`mv ../mx/iso-template/boot/isolinux/isolinux.cfg_x64 ../mx/iso-template/boot/isolinux/isolinux.cfg`)
    // Fine 
    // utils.exec(`cp ../mx/template-initrd.gz ${this.distro.pathIso}/antiX/initrd.gz`) Non dovrebbe servire, anzi...
    utils.exec(`cp /initrd.img ${this.distro.pathIso}/antiX/initrd.gz`);

    utils.exec(`cp -r ../mx/iso-template/boot/ ${this.distro.pathIso}/`)

    
  }

  /**
   * squashFs: crea in live filesystem.squashfs
   */
  async makeSquashFs() {
    console.log("==========================================");
    console.log("iso: makeSquashFs");
    console.log("==========================================");
    let option = "-comp lz4";
    utils.exec(
      `mksquashfs ${this.distro.pathFs} ${this.distro.pathIso}/antiX/linuxfs ${option} -noappend`
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
      `xorriso -as mkisofs -r -J -joliet-long -l -cache-inodes ${isoHybridOption} -partition_offset 16 -volid ${volid} -b boot/isolinux/isolinux.bin -c boot/isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table -o ${isoName} ${this.distro.pathIso}`
    );
  }
}

export default Iso;

// xorriso -as mkisofs -r -J -joliet-long -l -cache-inodes -isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin  -partition_offset 16 -volid debuX_2020-01-31_0851-01 -b boot/isolinux/isolinux.bin -c boot/isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table -o /home/eggs/debuX_2020-01-31_0851-01.iso /home/eggs/debuX/iso