/**
 * penguins-eggs: Calamares.ts
 * 
 * author: Piero Proietti 
 * mail: piero.proietti@gmail.com
 */

"use strict";

import yaml from 'js-yaml';
import fs from 'fs';
import { IDistro } from "../interfaces";
import utils from "../lib/utils";
import Oses from './Oses';
let oses = new Oses();



class Calamares {
  private distro: IDistro;
  constructor(distro: IDistro) {
    this.distro = distro;
  }

  /**
   * configure calamares-settings-eggs
   * @param c 
   * @param o 
   */
  public configure(o: any) {
    console.log("==========================================");
    console.log("eggs: calamares configuration");
    console.log("------------------------------------------");

    o = oses.info(this.distro);
    console.log(`distro: [${o.distroId}/${o.versionId}]->[${o.distroLike}/${o.versionLike}]`);
    this.create();
    this.settingsConf(o.versionLike);
    this.brandingDesc(o.versionLike, o.homeUrl, o.supportUrl, o.bugReportUrl);
    this.unpackModule(o.mountpointSquashFs);
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
    /**
     * Tutte le modifiche seguenti, vengono effettuate
     * onde poter utilizzare il pacchetto 
     * calamares-settings-debian in luogo della versione
     * iniziale, dove questo pacchetto veniva "emulato"
     * da eggs. Ad oggi non sò quale sia la soluzione
     * migliore, forse la completa emulazione...  
     * */

//    utils.exec(`mkdir -p /etc/calamares`);
//    utils.exec(`mkdir -p /etc/calamares/branding`);
//    utils.exec(`mkdir -p /etc/calamares/branding/eggs`);
//    utils.exec(`mkdir -p /etc/calamares/modules`);


utils.exec(`cp ${__dirname}/../../templates/* /etc/ -R`);
/**
 * vado a rimuovere add-calamares-desktop-icon e install-debian.desktop
 */
utils.exec(`rm /usr/bin/add-calamares-desktop-icon`);
utils.exec(`rm /usr/share/applications/install-debian.desktop`);

// Copio i file desktop in applications
utils.exec(`cp ${__dirname}/../../applications/* /usr/share/applications`)
utils.exec(`cp ${__dirname}/../../assets/eggs.png /usr/share/icons`)
//utils.exec(`cp ${__dirname}/../../assets/2xsession.png /usr/share/icons`)


//utils.exec(`cp ${__dirname}/../../templates/commons/etc/* /etc/ -R`);
//    utils.exec(`cp ${__dirname}/../../templates/debian/etc/* /etc/ -R`);


    // /usr/lib/calamares
//    utils.exec(`cp ${__dirname}/../../templates/debian/usr/lib/calamares/* /usr/lib/calamares/ -R`);

    // /usr/sbin 
//    utils.exec(`cp ${__dirname}/../../templates/debian/usr/sbin/* /usr/sbin`);
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
              'plymouthcfg', 'initramfscfg', 'initramfs', 'displaymanager', 
              'sources-media-unmount', 'sources-final', 'removeuser', 'umount']
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
    o = oses.info(this.distro);

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

    let productName = 'Penguin\'s eggs' + ' ' + this.distro.name;
    let shortProductName = this.distro.name;
    let version = this.distro.versionNumber + ' ( ' + this.distro.versionName + ')';
    let shortVersion = this.distro.versionNumber;
    let versionedName = this.distro.name;
    let shortVersionedName = this.distro.versionName;
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