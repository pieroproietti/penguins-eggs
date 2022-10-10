#!/usr/bin/npx ts-node
"use strict";
/**
 * run with: npx ts-node
 * #!/usr/bin/npx ts-node
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const utils_1 = require("../src/lib/utils");
const utils_2 = tslib_1.__importDefault(require("../src/classes/utils"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const js_yaml_1 = tslib_1.__importDefault(require("js-yaml"));
startPoint();
async function startPoint() {
    utils_2.default.titles('order');
    await makeInstalled();
    await makeOrder();
    const sections = await getSections();
    /**
     * per ogni sezione. creaiamo uan lista
     *     drivers_printer:
     * - autoconf
     */
    for (const section of sections) {
        console.log(section + ':');
        getPackages(section);
    }
}
/**
 *
  */
async function getPackages(section) {
    let wifs = [];
    const content = fs_1.default.readFileSync('./testing/ordinati.yml', 'utf8');
    wifs = js_yaml_1.default.load(content);
    for (const wif of wifs) {
        if (wif.section === section) {
            console.log(`- ${wif.name}`);
        }
    }
}
/**
 *
 */
async function makeInstalled() {
    let wifs = [];
    const installeds = [];
    const oInstalleds = await (0, utils_1.exec)('apt list --installed', { echo: false, ignore: false, capture: true });
    if (oInstalleds.code === 0) {
        const elements = oInstalleds.data.split(`\n`);
        for (const elem of elements) {
            if (!elem.includes('Listing...')) {
                if (elem !== '') {
                    const pacchetto = elem.substring(0, elem.indexOf(`/`));
                    const section = await getSection(pacchetto);
                    const wif = { name: pacchetto, section: section };
                    wifs.push(wif);
                }
            }
        }
    }
    else {
        console.log('error');
    }
    fs_1.default.writeFileSync('./testing/installed.yml', js_yaml_1.default.dump(wifs));
}
/**
 *
 */
async function getSection(pacchetto) {
    let section = '';
    try {
        const result = await (0, utils_1.exec)(`apt-cache show ${pacchetto}|grep Section:`, { echo: false, ignore: false, capture: true });
        if (result.code === 0) {
            section = result.data.substring(result.data.indexOf(':') + 2).replace(/(\r\n|\n|\r)/gm, '');
        }
    }
    catch (e) {
        console.log(e);
    }
    return section;
}
/**
*
*/
async function getSections() {
    let wifs = [];
    /**
     * Ora abbiamo wifs ordinati per section
     * creiamo la array sections
     */
    const content = fs_1.default.readFileSync('./testing/ordinati.yml', 'utf8');
    wifs = js_yaml_1.default.load(content);
    const sections = [];
    let currentSection = '';
    for (const wif of wifs) {
        if (currentSection !== wif.section) {
            sections.push(wif.section);
            currentSection = wif.section;
        }
    }
    return sections;
}
/**
*
*/
async function makeOrder() {
    let wifs = [];
    let ordinati = [];
    const content = fs_1.default.readFileSync('./testing/installed.yml', 'utf8');
    wifs = js_yaml_1.default.load(content);
    ordinati = wifs.sort((a, b) => a.section.localeCompare(b.section));
    fs_1.default.writeFileSync('./testing/ordinati.yml', js_yaml_1.default.dump(ordinati));
}
