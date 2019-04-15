/*
  penguins-eggs: Calamares.ts
  author: Piero Proietti
  mail: piero.proietti@gmail.com
*/
"use strict";

var __importDefault = undefined && undefined.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_yaml_1 = __importDefault(require("js-yaml"));
const fs_1 = __importDefault(require("fs"));
const utils_1 = __importDefault(require("./utils"));
class Calamares {
    constructor(distroName = "Penguin's eggs", versionName = "emperor", versionNumber = "0.0.1") {
        this.productName = distroName;
        this.shortVersion = versionNumber;
        this.versionedName = versionName;
    }
    isCalamaresInstalled() {
        const path = '/etc/calamares/branding/eggs/branding.desc';
        try {
            if (fs_1.default.existsSync(path)) {
                return true;
            }
        } catch (err) {
            console.error(err);
        }
    }
    /**
     * create
     */
    async create() {
        utils_1.default.exec(`mkdir -p /etc/calamares`);
        utils_1.default.exec(`mkdir -p /etc/calamares/branding`);
        utils_1.default.exec(`mkdir -p /etc/calamares/branding/eggs`);
        utils_1.default.exec(`mkdir -p /etc/calamares/modules`);
        utils_1.default.exec(`cp ${__dirname}/../../templates/commons/etc/* /etc/ -R`);
        utils_1.default.exec(`cp ${__dirname}/../../templates/debian/etc/* /etc/ -R`);
        // /usr/lib/calamares
        utils_1.default.exec(`cp ${__dirname}/../../templates/debian/usr/lib/calamares/* /usr/lib/calamares/ -R`);
        // /usr/sbin 
        utils_1.default.exec(`cp ${__dirname}/../../templates/debian/usr/sbin/* /usr/sbin`);
    }
    /**
     * settingsConf
     */
    async settingsConf(distroType) {
        let settingsPath = '/etc/calamares/settings.conf';
        let settings = {};
        if (distroType === 'debian') {
            settings = {
                'modules-search': ['local', '/usr/lib/calamares/modules'],
                sequence: [{ show: ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary'] }, {
                    exec: ['partition', 'mount', 'unpackfs', 'sources-media', 'machineid', 'fstab', 'locale', 'keyboard', 'localecfg', 'users', 'networkcfg', 'hwclock', 'services-systemd', 'bootloader-config', 'grubcfg', 'bootloader', 'packages', 'luksbootkeyfile', 'plymouthcfg', 'initramfscfg', 'initramfs', 'sources-media-unmount', 'sources-final', 'removeuser', 'umount']
                }, { show: ['finished'] }],
                branding: 'eggs',
                'prompt-install': false,
                'dont-chroot': false
            };
        } else if (distroType === 'ubuntu') {
            settings = {
                'modules-search': ['local', '/usr/lib/calamares/modules'],
                sequence: [{ show: ['welcome', 'locale', 'keyboard', 'partition', 'users', 'summary'] }, {
                    exec: ['partition', 'mount', 'unpackfs', 'machineid', 'fstab', 'locale', 'keyboard', 'localecfg', 'users', 'networkcfg', 'hwclock', 'services-systemd', 'grubcfg', 'bootloader', 'packages', 'luksbootkeyfile', 'plymouthcfg', 'initramfscfg', 'initramfs', 'removeuser', 'umount']
                }, { show: ['finished'] }],
                branding: 'eggs',
                'prompt-install': false,
                'dont-chroot': false
            };
        }
        console.log("Configurazione settings.conf");
        fs_1.default.writeFileSync(settingsPath, js_yaml_1.default.safeDump(settings), 'utf8');
    }
    unpackModule(distroType) {
        let squashfsDebian = "/run/live/medium/live/filesystem.squashfs";
        let squashfsUbuntu = "/lib/live/medium/live/filesystem.squashfs";
        let squashfsMountpoint = "";
        if (distroType === "debian") {
            squashfsMountpoint = squashfsDebian;
        } else if (distroType === "debian") {
            squashfsMountpoint = squashfsUbuntu;
        } else {
            squashfsMountpoint = squashfsDebian;
        }
        let file = `/etc/calamares/modules/unpackfs.conf`;
        let text = `---`;
        text += `unpack:`;
        text += `-   source: "${squashfsMountpoint}"`;
        text += `        sourcefs: "squashfs"`;
        text += `        unpack:`;
        text += `             destination: ""`;
        utils_1.default.bashWrite(file, text);
    }
    async brandingDesc(distroType, homeUrl, supportUrl, bugReportUrl) {
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
            fs_1.default.writeFileSync(brandingPath, js_yaml_1.default.safeDump(branding), 'utf8');
            /*
            , (err: any) => {
              if (err) console.log(err)
            })
            */
        } catch (e) {
            console.log(e);
        }
    }
}
exports.default = Calamares;
//# sourceMappingURL=Calamares.js.map