"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryInstall = exports.remove = void 0;
/**
 *
 */
const pacman_1 = __importDefault(require("../../pacman"));
/**
 * Work only with:
 * - calamares
 * - penguins-eggs
 *
 * dependencies actually are removed by package managers
 */
function remove(distro) {
    let removePackages = ["calamares"];
    if (distro.familyId === 'archlinux') {
        removePackages.push("penguins-eggs");
    }
    if (distro.familyId === 'debian') {
        removePackages.push("eggs");
    }
    let text = '  - remove:\n';
    for (const elem of removePackages) {
        text += `    - ${elem.trim()}\n`;
    }
    return text;
}
exports.remove = remove;
/**
 *
 * @param distro
   - try_install:
      - language-pack-$LOCALE
      - hunspell-$LOCALE
      - libreoffice-help-$LOCALE

 */
function tryInstall(distro) {
    let packages = '';
    /**
     * Depending on the distro
     */
    if (distro.distroLike === 'Ubuntu') {
        packages += '    - language-pack-$LOCALE\n';
    }
    // Da localizzare se presenti
    if (pacman_1.default.packageIsInstalled('hunspell')) {
        packages += '    - hunspell-$LOCALE\n';
    }
    if (pacman_1.default.packageIsInstalled('libreoffice-base-core')) {
        packages += `    - libreoffice-l10n-$LOCALE\n`;
        packages += `    - libreoffice-help-$LOCALE\n`;
    }
    if (pacman_1.default.packageIsInstalled('firefox-esr')) {
        packages += `    - firefox-esr-$LOCALE\n`;
    }
    if (pacman_1.default.packageIsInstalled('firefox')) {
        packages += `    - firefox-$LOCALE\n`;
    }
    if (pacman_1.default.packageIsInstalled('thunderbird')) {
        packages += `    - thunderbird-locale-$LOCALE\n`;
    }
    let retVal = '';
    if (packages !== '') {
        retVal += '  - try_install:\n' + packages;
    }
    return retVal;
}
exports.tryInstall = tryInstall;
