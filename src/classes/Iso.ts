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

import filters from "../lib/filters";

import fs from "fs";
import shell from "shelljs";
import utils from "../lib/utils";
import Calamares from "./Calamares";
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
    net?: INet,
    user?: IUser,
    root?: IUser
  ) {
    this.app = {} as IPackage;
    this.distro = {} as IDistro;
    this.net = {} as INet;
    this.user = {} as IUser;
    this.root = {} as IUser;

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
      this.user.name = "artisan";
      this.user.fullName = "Artisan";
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

  async spawn(o: IOses, c: any) {

    if (!await utils.isLive()) {
      console.log(
        ">>> eggs: This is a live system! The spawn command cannot be executed."
      );
    } else {

      c.configure(o);
      console.log("------------------------------------------");
      console.log(`Spawning the system into the egg...`);
      console.log("------------------------------------------");
      await this.eggCreateStructure();
      await this.isoCreateStructure();
      await this.isolinuxPrepare(o);
      await this.isolinuxCfg(o);
      await this.liveKernel();
      console.log("------------------------------------------");
      console.log(`Spawning the system into the egg...\nThis process can be very long, \nperhaps it's time for a coffee!`);
      console.log("------------------------------------------");
      await this.eggSystemCopy();
      await this.liveSquashFs();
      await this.makeIsoFs(o);
    }
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
   * eggSystemCopy
   */
  public async eggSystemCopy() {
    let cmd = "";
    cmd = `
      rsync -aq  \
      --filter="- ${this.distro.pathHome}"  \
      --delete-before  \
      --delete-excluded  \ ${filters} / ${this.distro.pathFs}`;
    console.log("==========================================");
    console.log("eggs: systemCopy");
    console.log("==========================================");
    shell.exec(cmd.trim(), {
      async: false
    });
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
    utils.exec(`rm -rf /etc/calamares`);
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

  /**
   * 
   * @param menuTitle 
   * @param kernelAppend 
   */
  async isolinuxCfg(o: IOses) {
    console.log("==========================================");
    console.log("iso: isolinuxCfg");
    console.log("==========================================");

    let file = `${this.distro.pathIso}/isolinux/isolinux.cfg`;
    let text = `
# Generated by ${this.app.name} V. ${this.app.version} 
DEFAULT vesamenu.c32
PROMPT 0
TIMEOUT 30
${o.menuTitle}
MENU TABMSG Press TAB key to edit
MENU BACKGROUND turtle.png

LABEL ${this.distro.name}
  MENU LABEL ^${this.distro.name}
  kernel /live/vmlinuz
  ${o.append}

label ${this.distro.name} safe
  MENU LABEL ^${this.distro.name} safe
  kernel /live/vmlinuz
  ${o.appendSafe}`;
    utils.bashWrite(file, text);

    utils.exec(`cp ${__dirname}/../../assets/turtle.png ${this.distro.pathIso}/isolinux`);
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
    //let uefiOption = "";
    //"-eltorito-alt-boot -e boot/grub/efiboot.img -isohybrid-gpt-basdat -no-emul-boot";

    // let volid = `"Penguin's eggs ${this.distro.name}"`;
    //let isoName = `${this.workDir}${this.distro.name}`;
    // isoName += utils.date4file() + ".iso";

    let volid = o.distroName + utils.date4file();
    let isoName = `${this.workDir}${volid}.iso`;

    utils.exec(
      `xorriso -as mkisofs -r -J -joliet-long -l -cache-inodes ${isoHybridOption} -partition_offset 16 -volid ${volid} -b isolinux/isolinux.bin -c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table -o ${isoName} ${this.distro.pathIso}`
    );
  }
}

export default Iso;
