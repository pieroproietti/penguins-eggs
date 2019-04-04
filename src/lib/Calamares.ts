/*
  penguins-eggs: Calamares.ts
  author: Piero Proietti
  mail: piero.proietti@gmail.com
*/
"use strict";

const yaml = require('js-yaml');
const fs = require('fs');


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

  async settingsConf() {
    let settingsPath = '/etc/calamares/settings.cfg'
    let
      settings = {
        'modules-search': ['local', '/usr/lib/calamares/modules'],
        sequence: [
          { show: ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary'] },
          {
            exec: ['partition', 'mount', 'unpackfs', 'sources-media', 'machineid', 'fstab', 'locale',
              'keyboard', 'localecfg', 'users', 'networkcfg', 'hwclock', 'services-systemd',
              'bootloader-config', 'grubcfg', 'bootloader', 'packages', 'luksbootkeyfile',
              'plymouthcfg', 'initramfscfg', 'initramfs', 'sources-media-unmount',
              'sources-final', 'removeuser', 'umount']
          },
          { show: ['finished'] }],
        branding: 'eggs',
        'prompt-install': false,
        'dont-chroot': false
      };
    console.log("Configurazione settings.cfg");
    try {
      fs.writeFile(settingsPath, yaml.safeDump(settings), 'utf8', (err: any) => {
        if (err) console.log(err)
      })
    } catch (e) {
      console.log(e);
    }
  }

  async brandingDesc() {
    // Configurazione branding.desc
    let brandingPath = '/etc/calamares/branding/eggs/branding.desc';

    let productName = this.productName;
    let shortProductName = this.productName;
    let version = this.shortVersion + ' (' + this.versionedName +')';
    let shortVersion = this.shortVersion;
    let versionedName = this.versionedName;
    let shortVersionedName = this.versionedName;
    let bootloaderEntryName = this.productName + this.shortVersion;
    let productUrl = 'https://penguin-s-eggs.gitbook.io/project/';
    let supportUrl = 'https://github.com/pieroproietti/penguins-eggs';
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
    try {
      fs.writeFile(brandingPath, yaml.safeDump(branding), 'utf8', (err: any) => {
        if (err) console.log(err)
      })

    } catch (e) {
      console.log(e);
    }

  }

}


export default Calamares;