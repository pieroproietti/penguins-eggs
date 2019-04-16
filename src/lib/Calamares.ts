/*
  penguins-eggs: Calamares.ts
  author: Piero Proietti
  mail: piero.proietti@gmail.com
*/
"use strict";


import yaml from 'js-yaml';
import fs from 'fs';
import utils from "./utils";



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
  async settingsConf(distroType: string) {
    let settingsPath = '/etc/calamares/settings.conf'
    let settings = {};

    if (distroType === 'debian') {
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
    } else if (distroType === 'ubuntu') {
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
    fs.writeFileSync(settingsPath, `# distroType: ${distroType}\n`+ yaml.safeDump(settings), 'utf8');
  }

  unpackModule(distroType: string){
    let squashfsDebian ="/run/live/medium/live/filesystem.squashfs";
    let squashfsUbuntu ="/lib/live/mount/medium/live/filesystem.squashfs";
    let squashfsMountpoint = "";

    if (distroType.localeCompare('debian')==0){
      squashfsMountpoint = squashfsDebian;
    } else if (distroType.localeCompare('ubuntu')==0){
      squashfsMountpoint = squashfsUbuntu;
    }

    let file = `/etc/calamares/modules/unpackfs.conf`;
    let text = `---\n`;
    text += `unpack:\n`;
    text += `-   source: "${squashfsMountpoint}"\n`;
    text += `    sourcefs: "squashfs"\n`;
    text += `    unpack:\n`;
    text += `    destination: ""\n`;
    text += `# distroType: ${distroType}\n`;

    fs.writeFileSync(file, text, 'utf8');
  }
  

  async brandingDesc(distroType: string, homeUrl: string, supportUrl: string, bugReportUrl: string) {
    // Configurazione branding.desc
    let brandingPath = '/etc/calamares/branding/eggs/branding.desc';

    let productName = 'Penguin\'s eggs' + ' ' + this.productName;
    let shortProductName = this.productName;
    let version = this.shortVersion + ' (' + this.versionedName + ')';
    let shortVersion = this.shortVersion;
    let versionedName = this.versionedName;
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
    fs.writeFileSync(brandingPath, yaml.safeDump(branding), 'utf8');
  }

}


export default Calamares;