/* eslint-disable no-console */
/**
 * penguins-eggs: Calamares.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import yaml = require('js-yaml')
import fs = require('fs')
import {IDistro, IOses} from '../interfaces'
import Utils from './utils'

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
  distro: IDistro

  oses: IOses

  constructor(distro: IDistro, oses: IOses) {
    this.distro = distro
    this.oses = oses
  }

  /**
   * configure calamares-settings-eggs
   */
  public configure() {
    if (this.isInstalled()) {
      console.log('==========================================')
      console.log('eggs: calamares configuration')
      console.log('------------------------------------------')

      console.log(`distro: [${this.oses.distroId}/${this.oses.versionId}]->[${this.oses.distroLike}/${this.oses.versionLike}]`)
      this.settingsConf(this.oses.versionLike)
      this.brandingDesc(this.oses.versionLike, this.oses.homeUrl, this.oses.supportUrl, this.oses.bugReportUrl)
      this.unpackfsConf(this.oses.mountpointSquashFs)
      this.links()
      console.log('==========================================')
    }
  }

  async isInstalled(): Promise<boolean> {
    return Utils.packageIsInstalled('calamares')
  }

  /**
   * settingsConf
   */
  async settingsConf(versionLike: string) {
    /**
    * branding è uguale per tutte
    */
    Utils.shxExec(`cp ${__dirname}/../../templates/branding /etc/calamares -R`)

    const settingsPath = '/etc/calamares/settings.conf'
    let settings = {}

    if (versionLike === 'buster') {
      // rimosso packages (rimozione pacchetti, dopo bootloader)
      // mi manca removeuser
      Utils.shxExec(`cp ${__dirname}/../../templates/distros/buster/* /etc/ -R`)
      settings = {
        'modules-search': ['local', '/usr/lib/calamares/modules'],
        sequence: [
          {show: ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary']},
          {exec: ['partition', 'mount', 'unpackfs', 'machineid', 'fstab', 'locale', 'keyboard', 'localecfg', 'users', 'displaymanager', 'networkcfg', 'hwclock', 'grubcfg', 'bootloader', 'luksbootkeyfile', 'plymouthcfg', 'initramfscfg', 'initramfs', 'removeuser', 'umount']},
          {show: ['finished']},
        ],
        branding: this.distro.branding,
        'prompt-install': false,
        'dont-chroot': false,
      }

      /**
       * UBUNTU BIONIC / LINUX MINT 19.1/2/3
       */
    } else if (versionLike === 'bionic') {
      // rimosso packages (rimozione pacchetti, dopo bootloader) aggiunto removeuser prima di umount
      Utils.shxExec(`cp ${__dirname}/../../templates/distros/bionic/* /etc/ -R`)
      settings = {
        'modules-search': ['local'],
        sequence: [
          {show: ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary']},
          {exec: ['partition', 'mount', 'unpackfs', 'machineid', 'fstab', 'locale', 'keyboard', 'localecfg', 'users', 'displaymanager', 'networkcfg', 'hwclock', 'services', 'initramfs', 'grubcfg', 'bootloader', 'removeuser', 'umount']},
          {show: ['finished']},
        ],
        branding: this.distro.branding,
        'prompt-install': true,
        'dont-chroot': false,
      }

      /**
       * UBUNTU EOAN
       */
    } else if (versionLike === 'eoan') {
      // rimosso packages (rimozione pacchetti, dopo bootloader-config)
      Utils.shxExec(`cp ${__dirname}/../../templates/distros/eoan/* /etc/ -R`)
      settings = {
        'modules-search': ['local', '/usr/lib/calamares/modules'],
        sequence: [
          {show: ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary']},
          {exec: ['partition', 'mount', 'unpackfs', 'sources-media', 'machineid', 'fstab', 'locale', 'keyboard', 'localecfg', 'users', 'networkcfg', 'hwclock', 'grubcfg', 'bootloader', 'luksbootkeyfile', 'plymouthcfg', 'initramfscfg', 'initramfs', 'sources-media-unmount', 'sources-final', 'removeuser', 'umount']},
          {show: ['finished']},
        ],
        branding: this.distro.branding,
        'prompt-install': false,
        'dont-chroot': false,
      }
      this.ubuntuSourcesFinal('eoan')
    }

    console.log('Configurazione settings.conf')
    fs.writeFileSync(settingsPath, `# distroType: ${versionLike}\n` + yaml.safeDump(settings), 'utf8')
  }

  async brandingDesc(versionLike: string, homeUrl: string, supportUrl: string, bugReportUrl: string) {
    const brandingPath = `/etc/calamares/branding/${this.distro.branding}`

    if (!fs.existsSync(brandingPath)) {
      fs.mkdirSync(brandingPath)
    }
    // Configurazione branding.desc
    const brandingFile = `${brandingPath}/branding.desc`

    const productName = this.distro.name
    const shortProductName = this.distro.name
    const version = this.distro.versionNumber + ' ( ' + this.distro.versionName + ')'
    const shortVersion = this.distro.versionNumber
    const versionedName = this.distro.name
    const shortVersionedName = this.distro.versionName
    const bootloaderEntryName = productName
    const productUrl = homeUrl
    // let supportUrl = supportUrl;
    const releaseNotesUrl = 'https://github.com/pieroproietti/penguins-eggs'

    const productLogo = `${this.distro.branding}-logo.png`
    const productIcon = `${this.distro.branding}-logo.png`
    const productWelcome = 'welcome.png'

    const slideshow = 'show.qml'

    const branding =
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
        releaseNotesUrl: releaseNotesUrl,
      },
      images:
      {
        productLogo: productLogo,
        productIcon: productIcon,
        productWelcome: productWelcome,
      },
      slideshow: slideshow,
      style:
      {
        sidebarBackground: '#2c3133',
        sidebarText: '#FFFFFF',
        sidebarTextSelect: '#4d7079',
      },
    }

    console.log('Configurazione branding.desc')
    fs.writeFileSync(brandingFile, `#versionLike: ${versionLike}\n` + yaml.safeDump(branding), 'utf8')
  }

  /**
   * unpackfsConf
   * @param mountpointSquashFs
   */
  unpackfsConf(mountpointSquashFs: string) {
    const file = '/etc/calamares/modules/unpackfs.conf'
    let text = '---\n'
    text += 'unpack:\n'
    text += `-   source: "${mountpointSquashFs}"\n`
    text += '    sourcefs: "squashfs"\n'
    text += '    unpack:\n'
    text += '    destination: ""\n'
    fs.writeFileSync(file, text, 'utf8')
  }

  /**
   * links
   */
  async links() {
    // Utils.shxExec(`cp ${__dirname}/../../templates/* /etc/ -R`);
    Utils.shxExec('rm /usr/bin/add-calamares-desktop-icon')
    Utils.shxExec('rm /usr/share/applications/install-debian.desktop')
    Utils.shxExec(`cp ${__dirname}/../../applications/* /usr/share/applications`)
  }

  /**
   * impostazione di sources.list per Debian
   */
  async debianSourcesFinal(debianRelease: string) {
    const file = '/usr/sbin/sources-final'
    const text = `\
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

exit 0`
    fs.writeFileSync(file, text, 'utf8')
  }

  async ubuntuSourcesFinal(ubuntuRelease: string) {
    const file = '/usr/sbin/sources-final'
    const text = `
#!/bin/sh
#
# Writes the final sources.list file
#

CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
RELEASE=${ubuntuRelease}

cat << EOF > $CHROOT/etc/apt/sources.list

# penguins-eggs made
# deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE main restricted

# deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE-updates main restricted
# deb http://security.ubuntu.com/ubuntu $RELEASE-security main restricted

# See http://help.ubuntu.com/community/UpgradeNotes for how to upgrade to
# newer versions of the distribution.
deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE main restricted
# deb-src http://it.archive.ubuntu.com/ubuntu/ $RELEASE main restricted

## Major bug fix updates produced after the final release of the
## distribution.
deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE-updates main restricted
# deb-src http://it.archive.ubuntu.com/ubuntu/ $RELEASE-updates main restricted

## N.B. software from this repository is ENTIRELY UNSUPPORTED by the Ubuntu
## team. Also, please note that software in universe WILL NOT receive any
## review or updates from the Ubuntu security team.
deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE universe
# deb-src http://it.archive.ubuntu.com/ubuntu/ $RELEASE universe
deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE-updates universe
# deb-src http://it.archive.ubuntu.com/ubuntu/ $RELEASE-updates universe

## N.B. software from this repository is ENTIRELY UNSUPPORTED by the Ubuntu 
## team, and may not be under a free licence. Please satisfy yourself as to 
## your rights to use the software. Also, please note that software in 
## multiverse WILL NOT receive any review or updates from the Ubuntu
## security team.
deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE multiverse
# deb-src http://it.archive.ubuntu.com/ubuntu/ $RELEASE multiverse
deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE-updates multiverse
# deb-src http://it.archive.ubuntu.com/ubuntu/ $RELEASE-updates multiverse

## N.B. software from this repository may not have been tested as
## extensively as that contained in the main release, although it includes
## newer versions of some applications which may provide useful features.
## Also, please note that software in backports WILL NOT receive any review
## or updates from the Ubuntu security team.
deb http://it.archive.ubuntu.com/ubuntu/ $RELEASE-backports main restricted universe multiverse
# deb-src http://it.archive.ubuntu.com/ubuntu/ $RELEASE-backports main restricted universe multiverse

## Uncomment the following two lines to add software from Canonical's
## 'partner' repository.
## This software is not part of Ubuntu, but is offered by Canonical and the
## respective vendors as a service to Ubuntu users.
# deb http://archive.canonical.com/ubuntu $RELEASE partner
# deb-src http://archive.canonical.com/ubuntu $RELEASE partner

deb http://security.ubuntu.com/ubuntu $RELEASE-security main restricted
# deb-src http://security.ubuntu.com/ubuntu $RELEASE-security main restricted
deb http://security.ubuntu.com/ubuntu $RELEASE-security universe
# deb-src http://security.ubuntu.com/ubuntu $RELEASE-security universe
deb http://security.ubuntu.com/ubuntu $RELEASE-security multiverse
# deb-src http://security.ubuntu.com/ubuntu $RELEASE-security multiverse
EOF

exit 0`
    fs.writeFileSync(file, text, 'utf8')
  }
}

export default Calamares
