/**
 * penguins-eggs: Calamares.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_yaml_1 = __importDefault(require("js-yaml"));
const fs_1 = __importDefault(require("fs"));
const utils_1 = __importDefault(require("../lib/utils"));
const Oses_1 = __importDefault(require("./Oses"));
let oses = new Oses_1.default();
class Calamares {
    constructor(distro) {
        this.distro = distro;
    }
    /**
     * configure calamares-settings-eggs
     * @param c
     * @param o
     */
    configure(o) {
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
    isCalamaresInstalled() {
        const path = '/etc/calamares/branding/eggs/branding.desc';
        try {
            if (fs_1.default.existsSync(path)) {
                return true;
            }
        }
        catch (err) {
            console.error(err);
        }
    }
    /**
     * create
     */
    async create() {
        utils_1.default.exec(`cp ${__dirname}/../../templates/* /etc/ -R`);
        utils_1.default.exec(`rm /usr/bin/add-calamares-desktop-icon`);
        utils_1.default.exec(`rm /usr/share/applications/install-debian.desktop`);
        utils_1.default.exec(`cp ${__dirname}/../../applications/* /usr/share/applications`);
    }
    /**
     * settingsConf
     */
    async settingsConf(versionLike) {
        let settingsPath = '/etc/calamares/settings.conf';
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
                    { show: ['finished'] }
                ],
                branding: this.distro.branding,
                'prompt-install': false,
                'dont-chroot': false
            };
        }
        else {
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
                    { show: ['finished'] }
                ],
                branding: this.distro.branding,
                'prompt-install': false,
                'dont-chroot': false
            };
        }
        console.log("Configurazione settings.conf");
        fs_1.default.writeFileSync(settingsPath, `# distroType: ${versionLike}\n` + js_yaml_1.default.safeDump(settings), 'utf8');
    }
    unpackModule(mountpointSquashFs) {
        let o = {};
        o = oses.info(this.distro);
        let file = `/etc/calamares/modules/unpackfs.conf`;
        let text = `---\n`;
        text += `unpack:\n`;
        text += `-   source: "${mountpointSquashFs}"\n`;
        text += `    sourcefs: "squashfs"\n`;
        text += `    unpack:\n`;
        text += `    destination: ""\n`;
        fs_1.default.writeFileSync(file, text, 'utf8');
    }
    async brandingDesc(versionLike, homeUrl, supportUrl, bugReportUrl) {
        let brandingPath = `/etc/calamares/branding/${this.distro.branding}`;
        if (!fs_1.default.existsSync(brandingPath)) {
            fs_1.default.mkdirSync(brandingPath);
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
        let branding = {
            componentName: this.distro.branding,
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
        fs_1.default.writeFileSync(brandingFile, `#versionLike: ${versionLike}\n` + js_yaml_1.default.safeDump(branding), 'utf8');
    }
}
exports.default = Calamares;
