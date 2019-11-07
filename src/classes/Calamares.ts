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
import shell from "shelljs";

let oses = new Oses();

/**
 *  Calamares
 * isInstalled()
 * configure()
 * create() copia templates ed altro
 * settingsConf() // versioni
 * unpackModule()
 * brandingDesk()
 * 
 * in templates abbiamo:
 * calamares
 * + branding + eggs
 * + modules + 
 * - settings.conf
 */

/**
 * templates/branding (copiare in /etc/calamares)
 *          /distros/bionic
 *                  /buster/calamares/settings.conf (copiare in /etc/calamares)
 *                         /calamares/modules/ (copiare in /etc/calamares)
 *                  /eoan
 */


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
    if (this.isInstalled()) {
      console.log("==========================================");
      console.log("eggs: calamares configuration");
      console.log("------------------------------------------");

      o = oses.info(this.distro);
      console.log(`distro: [${o.distroId}/${o.versionId}]->[${o.distroLike}/${o.versionLike}]`);
      this.settingsConf(o.versionLike);
      this.brandingDesc(o.versionLike, o.homeUrl, o.supportUrl, o.bugReportUrl);
      this.unpackfsConf(o.mountpointSquashFs);
      this.links();
      console.log("==========================================");
    }
  }

  async isInstalled(): Promise<boolean> {
    let test: string = "1";
    let result: any;
    result = shell.exec(`${__dirname}/../../scripts/is_calamares.sh`, {
      async: false
    });
    if (result.indexOf(test) > -1) {
      return true;
    } else {
      return false;
    }
  }


  /**
   * settingsConf
   */
  async settingsConf(versionLike: string) {
    /**
    * branding è uguale per tutte
    */
    utils.exec(`cp ${__dirname}/../../templates/branding /etc/calamares -R`);


    let settingsPath = '/etc/calamares/settings.conf'
    let settings = {};

    if (versionLike === 'buster') {
      // rimosso packages (rimozione pacchetti, dopo bootloader)
      // mi manca removeuser
      utils.exec(`cp ${__dirname}/../../templates/distros/buster/* /etc/ -R`);
      settings = {
        'modules-search': ['local', '/usr/lib/calamares/modules'],
        sequence: [
          { show: ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary'] },
          { exec: ['partition', 'mount', 'unpackfs', 'machineid', 'fstab', 'locale', 'keyboard', 'localecfg', 'users', 'networkcfg', 'hwclock', 'grubcfg', 'bootloader', 'luksbootkeyfile', 'plymouthcfg', 'initramfscfg', 'initramfs', 'removeuser', 'umount'] },
          { show: ['finished'] }
        ],
        branding: this.distro.branding,
        'prompt-install': false,
        'dont-chroot': false
      };

      /**
       * UBUNTU BIONIC / LINUX MINT 19.1/2/3
       */
    } else if (versionLike === 'bionic') {
      // rimosso packages (rimozione pacchetti, dopo bootloader) aggiunto removeuser prima di umount
      utils.exec(`cp ${__dirname}/../../templates/distros/bionic/* /etc/ -R`);
      settings = {
        'modules-search': ['local',],
        sequence: [
          { show: [`welcome`, `locale`, `keyboard`, `partition`, `users`, `summary`] },
          { exec: [`partition`, `mount`, `unpackfs`, `machineid`, `fstab`, `locale`, `keyboard`, `localecfg`, `users`, `displaymanager`, `networkcfg`, `hwclock`, `services`, `initramfs`, `grubcfg`, `bootloader`, `removeuser`, `umount`] },
          { show: ['finished'] }
        ],
        branding: this.distro.branding,
        'prompt-install': true,
        'dont-chroot': false
      };

      /**
       * UBUNTU EOAN
       */
    } else if (versionLike === `eoan`) {
      // rimosso packages (rimozione pacchetti, dopo bootloader-config)
      utils.exec(`cp ${__dirname}/../../templates/distros/eoan/* /etc/ -R`);
      settings = {
        'modules-search': ['local', '/usr/lib/calamares/modules'],
        sequence: [
          { show: ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary'] },
          { exec: ['partition', 'mount', 'unpackfs', 'sources-media', 'machineid', 'fstab', 'locale', 'keyboard', 'localecfg', 'users', 'networkcfg', 'hwclock', 'grubcfg', 'bootloader', 'luksbootkeyfile', 'plymouthcfg', 'initramfscfg', 'initramfs', 'sources-media-unmount', 'sources-final', 'removeuser', 'umount'] },
          { show: ['finished'] }
        ],
        branding: this.distro.branding,
        'prompt-install': false,
        'dont-chroot': false
      };
      this.ubuntuSourcesFinal(`eoan`);
    }

    console.log("Configurazione settings.conf");
    fs.writeFileSync(settingsPath, `# distroType: ${versionLike}\n` + yaml.safeDump(settings), 'utf8');
  }


  async brandingDesc(versionLike: string, homeUrl: string, supportUrl: string, bugReportUrl: string) {
    let brandingPath = `/etc/calamares/branding/${this.distro.branding}`;

    if (!fs.existsSync(brandingPath)) {
      fs.mkdirSync(brandingPath);
    }
    // Configurazione branding.desc
    let brandingFile = `${brandingPath}/branding.desc`;

    let productName = this.distro.name;
    let shortProductName = this.distro.name;
    let version = this.distro.versionNumber + ' ( ' + this.distro.versionName + ')';
    let shortVersion = this.distro.versionNumber;
    let versionedName = this.distro.name;
    let shortVersionedName = this.distro.versionName;
    let bootloaderEntryName = productName;
    let productUrl = homeUrl;
    //let supportUrl = supportUrl; 
    let releaseNotesUrl = 'https://github.com/pieroproietti/penguins-eggs';

    let productLogo = `${this.distro.branding}-logo.png`;
    let productIcon = `${this.distro.branding}-logo.png`;
    let productWelcome = 'welcome.png';

    let slideshow = 'show.qml';


    let branding =
    {
      componentName: this.distro.branding,
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
    fs.writeFileSync(brandingFile, `#versionLike: ${versionLike}\n` + yaml.safeDump(branding), 'utf8');
  }

  /**
   * unpackfsConf
   * @param mountpointSquashFs 
   */
  unpackfsConf(mountpointSquashFs: string) {
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

  /**
   * links
   */
  async links() {
    // utils.exec(`cp ${__dirname}/../../templates/* /etc/ -R`);
    utils.exec(`rm /usr/bin/add-calamares-desktop-icon`);
    utils.exec(`rm /usr/share/applications/install-debian.desktop`);
    utils.exec(`cp ${__dirname}/../../applications/* /usr/share/applications`)
  }


  /**
   * impostazione di sources.list per Debian
   */
  async debianSourcesFinal(debianRelease: string) {
    const file = `/usr/sbin/sources-final`;
    const text: string = `\
#!/bin/sh
#
# Writes the final sources.list file
#

CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
RELEASE=${debianRelease}

cat << EOF > $CHROOT/etc/apt/sources.list
# See https://wiki.debian.org/SourcesList for more information.
deb http://deb.debian.org/debian $RELEASE main
deb-src http://deb.debian.org/debian $RELEASE main

deb http://deb.debian.org/debian $RELEASE-updates main
deb-src http://deb.debian.org/debian $RELEASE-updates main

deb http://security.debian.org/debian-security/ $RELEASE/updates main
deb-src http://security.debian.org/debian-security/ $RELEASE/updates main
EOF

exit 0`;
  fs.writeFileSync(file, text, 'utf8');
    
  }

  async ubuntuSourcesFinal(ubuntuRelease: string) {
    const file = `/usr/sbin/sources-final`;
    const text: string = `
#!/bin/sh
#
# Writes the final sources.list file
#

CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
RELEASE=${ubuntuRelease}

cat << EOF > $CHROOT/etc/apt/sources.list

# penguins-eggs made
# deb http://it.archive.ubuntu.com/ubuntu/ ${RELEASE} main restricted

# deb http://it.archive.ubuntu.com/ubuntu/ ${RELEASE}-updates main restricted
# deb http://security.ubuntu.com/ubuntu ${RELEASE}-security main restricted

# See http://help.ubuntu.com/community/UpgradeNotes for how to upgrade to
# newer versions of the distribution.
deb http://it.archive.ubuntu.com/ubuntu/ ${RELEASE} main restricted
# deb-src http://it.archive.ubuntu.com/ubuntu/ ${RELEASE} main restricted

## Major bug fix updates produced after the final release of the
## distribution.
deb http://it.archive.ubuntu.com/ubuntu/ ${RELEASE}-updates main restricted
# deb-src http://it.archive.ubuntu.com/ubuntu/ ${RELEASE}-updates main restricted

## N.B. software from this repository is ENTIRELY UNSUPPORTED by the Ubuntu
## team. Also, please note that software in universe WILL NOT receive any
## review or updates from the Ubuntu security team.
deb http://it.archive.ubuntu.com/ubuntu/ ${RELEASE} universe
# deb-src http://it.archive.ubuntu.com/ubuntu/ ${RELEASE} universe
deb http://it.archive.ubuntu.com/ubuntu/ ${RELEASE}-updates universe
# deb-src http://it.archive.ubuntu.com/ubuntu/ ${RELEASE}-updates universe

## N.B. software from this repository is ENTIRELY UNSUPPORTED by the Ubuntu 
## team, and may not be under a free licence. Please satisfy yourself as to 
## your rights to use the software. Also, please note that software in 
## multiverse WILL NOT receive any review or updates from the Ubuntu
## security team.
deb http://it.archive.ubuntu.com/ubuntu/ ${RELEASE} multiverse
# deb-src http://it.archive.ubuntu.com/ubuntu/ ${RELEASE} multiverse
deb http://it.archive.ubuntu.com/ubuntu/ ${RELEASE}-updates multiverse
# deb-src http://it.archive.ubuntu.com/ubuntu/ ${RELEASE}-updates multiverse

## N.B. software from this repository may not have been tested as
## extensively as that contained in the main release, although it includes
## newer versions of some applications which may provide useful features.
## Also, please note that software in backports WILL NOT receive any review
## or updates from the Ubuntu security team.
deb http://it.archive.ubuntu.com/ubuntu/ ${RELEASE}-backports main restricted universe multiverse
# deb-src http://it.archive.ubuntu.com/ubuntu/ ${RELEASE}-backports main restricted universe multiverse

## Uncomment the following two lines to add software from Canonical's
## 'partner' repository.
## This software is not part of Ubuntu, but is offered by Canonical and the
## respective vendors as a service to Ubuntu users.
# deb http://archive.canonical.com/ubuntu ${RELEASE} partner
# deb-src http://archive.canonical.com/ubuntu ${RELEASE} partner

deb http://security.ubuntu.com/ubuntu ${RELEASE}-security main restricted
# deb-src http://security.ubuntu.com/ubuntu ${RELEASE}-security main restricted
deb http://security.ubuntu.com/ubuntu ${RELEASE}-security universe
# deb-src http://security.ubuntu.com/ubuntu ${RELEASE}-security universe
deb http://security.ubuntu.com/ubuntu ${RELEASE}-security multiverse
# deb-src http://security.ubuntu.com/ubuntu ${RELEASE}-security multiverse


exit 0`;
  fs.writeFileSync(file, text, 'utf8');
  }
}

export default Calamares;
