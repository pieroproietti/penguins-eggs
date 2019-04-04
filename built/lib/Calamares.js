/*
  penguins-eggs: Calamares.ts
  author: Piero Proietti
  mail: piero.proietti@gmail.com
*/
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const yaml = require('js-yaml');
const fs = require('fs');
class Calamares {
    constructor(distroName = "Penguin's eggs", versionName = "emperor", versionNumber = "0.0.1") {
        this.productName = distroName;
        this.shortVersion = versionNumber;
        this.versionedName = versionName;
    }
    async settingsConf() {
        let settingsPath = '/etc/calamares/settings.conf';
        let settings = {
            'modules-search': ['local', '/usr/lib/calamares/modules'],
            sequence: [{ show: ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary'] }, {
                exec: ['partition', 'mount', 'unpackfs', 'sources-media', 'machineid', 'fstab', 'locale', 'keyboard', 'localecfg', 'users', 'networkcfg', 'hwclock', 'services-systemd', 'bootloader-config', 'grubcfg', 'bootloader', 'packages', 'luksbootkeyfile', 'plymouthcfg', 'initramfscfg', 'initramfs', 'sources-media-unmount', 'sources-final', 'removeuser', 'umount']
            }, { show: ['finished'] }],
            branding: 'eggs',
            'prompt-install': false,
            'dont-chroot': false
        };
        console.log("Configurazione settings.conf");
        try {
            fs.writeFileSync(settingsPath, yaml.safeDump(settings), 'utf8', err => {
                if (err) console.log(err);
            });
        } catch (e) {
            console.log(e);
        }
    }
    async brandingDesc() {
        // Configurazione branding.desc
        let brandingPath = '/etc/calamares/branding/eggs/branding.desc';
        let productName = 'Penguin\'s eggs' + ' ' + this.productName;
        let shortProductName = this.productName;
        let version = this.shortVersion + ' (' + this.versionedName + ')';
        let shortVersion = this.shortVersion;
        let versionedName = this.versionedName;
        let shortVersionedName = this.versionedName;
        let bootloaderEntryName = productName;
        let productUrl = 'https://penguin-s-eggs.gitbook.io/project/';
        let supportUrl = 'https://github.com/pieroproietti/penguins-eggs';
        let releaseNotesUrl = 'https://github.com/pieroproietti/penguins-eggs';
        let productLogo = 'logo.png';
        let productIcon = 'logo.png';
        let productWelcome = 'welcome.png';
        let slideshow = 'show.qml';
        let branding = {
            componentName: 'eggs',
            welcomeStyleCalamares: true,
            strings: {
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
            images: {
                productLogo: productLogo,
                productIcon: productIcon,
                productWelcome: productWelcome
            },
            slideshow: slideshow,
            style: {
                sidebarBackground: '#2c3133',
                sidebarText: '#FFFFFF',
                sidebarTextSelect: '#4d7079'
            }
        };
        console.log("Configurazione branding.desc");
        try {
            fs.writeFileSync(brandingPath, yaml.safeDump(branding), 'utf8', err => {
                if (err) console.log(err);
            });
        } catch (e) {
            console.log(e);
        }
    }
}
exports.default = Calamares;
//# sourceMappingURL=Calamares.js.map