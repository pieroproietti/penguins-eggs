/**
 * penguins-eggs: Calamares.ts
 * 
 * author: Piero Proietti 
 * mail: piero.proietti@gmail.com
 */

"use strict";

import yaml from 'js-yaml';
import fs from 'fs';
import utils from "../lib/utils";
import Oses from './Oses';
let oses = new Oses();



class Calamares {
  private productName: string;
  private shortVersion: string;
  private versionedName: string;

  constructor(
    distroName = "Penguin's eggs" as string,
    versionName = "emperor" as string,
    versionNumber = "0.0.1" as string,
  ) {
    this.productName = distroName;
    this.shortVersion = versionNumber;
    this.versionedName = versionName;
  }

  static install(c: any, o: any){
    console.log("==========================================");
    console.log("eggs: calamares configuration");
    console.log("------------------------------------------");
    o = oses.info();
    console.log(`distro: [${o.distroId}/${o.versionId}]->[${o.distroLike}/${o.versionLike}]`);
    c.create();
    c.settingsConf(o.versionLike);
    c.brandingDesc(o.versionLike, o.homeUrl, o.supportUrl, o.bugReportUrl);
    c.unpackModule(o.mountpointSquashFs);
    console.log("==========================================");
  }

  public isCalamaresInstalled(): boolean {
    const path = '/etc/calamares/branding/eggs/branding.desc';

    try {
      if (fs.existsSync(path)) {
        return true;
      }
    } catch (err) {
      console.error(err)
    }
  }

  /**
   * create
   */
  async create() {
    utils.exec(`mkdir -p /etc/calamares`);
    utils.exec(`mkdir -p /etc/calamares/branding`);
    utils.exec(`mkdir -p /etc/calamares/branding/eggs`);
    utils.exec(`mkdir -p /etc/calamares/modules`);

    utils.exec(`cp ${__dirname}/../../templates/commons/etc/* /etc/ -R`);
    utils.exec(`cp ${__dirname}/../../templates/debian/etc/* /etc/ -R`);


    // /usr/lib/calamares
    utils.exec(`cp ${__dirname}/../../templates/debian/usr/lib/calamares/* /usr/lib/calamares/ -R`);

    // /usr/sbin 
    utils.exec(`cp ${__dirname}/../../templates/debian/usr/sbin/* /usr/sbin`);
  }


  /**
   * settingsConf
   */
  async settingsConf(versionLike: string) {
    let settingsPath = '/etc/calamares/settings.conf'
    let settings = {};

    if (versionLike === 'buster') {
      settings = {
        'modules-search': ['local', '/usr/lib/calamares/modules'],
        sequence: [
          { show: ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary'] },
          {
            exec: ['partition', 'mount', 'unpackfs', 'sources-media', 'machineid', 'fstab', 'locale',
              'keyboard', 'localecfg', 'users', 'networkcfg', 'hwclock',
              'bootloader-config', 'grubcfg', 'bootloader', 'packages', 'luksbootkeyfile',
              'plymouthcfg', 'initramfscfg', 'initramfs', 'sources-media-unmount',
              'sources-final', 'removeuser', 'umount']
          },
          { show: ['finished'] }],
        branding: 'eggs',
        'prompt-install': false,
        'dont-chroot': false
      };
    } else {
      settings = {
        'modules-search': ['local', '/usr/lib/calamares/modules'],
        sequence: [
          { show: ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary'] },
          {
            exec: ['partition', 'mount', 'unpackfs', 'machineid', 'fstab', 'locale',
              'keyboard', 'localecfg', 'users', 'networkcfg', 'hwclock',
              'grubcfg', 'bootloader', 'packages', 'luksbootkeyfile',
              'plymouthcfg', 'initramfscfg', 'initramfs', 'removeuser', 'umount']
          },
          { show: ['finished'] }],
        branding: 'eggs',
        'prompt-install': false,
        'dont-chroot': false
      };
    }
    console.log("Configurazione settings.conf");
    fs.writeFileSync(settingsPath, `# distroType: ${versionLike}\n` + yaml.safeDump(settings), 'utf8');
  }

  unpackModule(mountpointSquashFs: string) {
    let o: any = {};
    o = oses.info();

    let file = `/etc/calamares/modules/unpackfs.conf`;
    let text = `---\n`;
    text += `unpack:\n`;
    text += `-   source: "${mountpointSquashFs}"\n`;
    text += `    sourcefs: "squashfs"\n`;
    text += `    unpack:\n`;
    text += `    destination: ""\n`;
    fs.writeFileSync(file, text, 'utf8');
  }


  async brandingDesc(versionLike: string, homeUrl: string, supportUrl: string, bugReportUrl: string) {
    // Configurazione branding.desc
    let brandingPath = '/etc/calamares/branding/eggs/branding.desc';

    let productName = 'Penguin\'s eggs' + ' ' + this.productName;
    let shortProductName = this.productName;
    let version = this.shortVersion + ' (' + this.versionedName + ')';
    let shortVersion = this.shortVersion;
    let versionedName = this.productName;
    let shortVersionedName = this.versionedName;
    let bootloaderEntryName = productName;
    let productUrl = homeUrl;
    //let supportUrl = supportUrl; 
    let releaseNotesUrl = 'https://github.com/pieroproietti/penguins-eggs';

    let productLogo = 'logo.png';
    let productIcon = 'logo.png';
    let productWelcome = 'welcome.png';

    let slideshow = 'show.qml';


    let branding =
    {
      componentName: 'eggs',
      welcomeStyleCalamares: true,
      strings:
      {
        productName: productName,
        shortProductName: shortProductName,
        version: version,
        shortVersion: shortVersion,
        versionedName: versionedName,
        shortVersionedName: shortVersionedName,
        bootloaderEntryName: bootloaderEntryName,
        productUrl: productUrl,
        supportUrl: supportUrl,
        releaseNotesUrl: releaseNotesUrl
      },
      images:
      {
        productLogo: productLogo,
        productIcon: productIcon,
        productWelcome: productWelcome
      },
      slideshow: slideshow,
      style:
      {
        sidebarBackground: '#2c3133',
        sidebarText: '#FFFFFF',
        sidebarTextSelect: '#4d7079'
      }
    };

    console.log("Configurazione branding.desc");
    fs.writeFileSync(brandingPath, `#versionLike: ${versionLike}\n` + yaml.safeDump(branding), 'utf8');
  }

}


export default Calamares;