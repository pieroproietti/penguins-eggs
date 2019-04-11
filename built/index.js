#!/usr/bin/env node

"use strict";

var __importDefault = undefined && undefined.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * babel-polyfill: va inserito per primo!
 */
require("babel-polyfill");
const pjson_1 = __importDefault(require("pjson"));
let app = {};
app.author = "Piero Proietti";
app.homepage = "https://pieroproietti.github.io/";
app.mail = "piero.proietti@gmail.com";
app.name = pjson_1.default.name;
app.version = pjson_1.default.version;
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const utils_1 = __importDefault(require("./lib/utils"));
const Iso_1 = __importDefault(require("./lib/Iso"));
const Egg_1 = __importDefault(require("./lib/Egg"));
const Calamares_1 = __importDefault(require("./lib/Calamares"));
const hatch_1 = require("./lib/hatch");
let program = require("commander").version(app.version);
let workDir = "/home/eggs/";
let distro = {};
let net = {};
let user = {};
let root = {};
distro.name = os_1.default.hostname();
distro.versionName = 'Emperor';
distro.versionNumber = utils_1.default.date4label();
/**
 * /etc/os-release
 * PRETTY_NAME="LMDE 3 (cindy)"
 * NAME="LMDE"
 * ID=linuxmint
 * VERSION_ID="3"
 * VERSION="3 (cindy)"
 * HOME_URL="https://www.linuxmint.com/"
 * SUPPORT_URL="https://forums.linuxmint.com/"
 * BUG_REPORT_URL="http://linuxmint-troubleshooting-guide.readthedocs.io/en/latest/"
 *
 * PRETTY_NAME="Debian GNU/Linux buster/sid"
 * NAME="Debian GNU/Linux"
 * ID=debian
 * VERSION_ID="10"
 * VERSION="10 (buster)"
 * HOME_URL="https://www.debian.org/"
 * SUPPORT_URL="https://www.debian.org/support"
 * BUG_REPORT_URL="https://bugs.debian.org/"
 *
 *
 * PRETTY_NAME="Fedora 29 (Workstation Edition)"
 * NAME=Fedora
 * ID=fedora
 * VERSION_ID=29
 * VERSION="29 (Workstation Edition)"
 * HOME_URL="https://fedoraproject.org/"
 * SUPPORT_URL="https://fedoraproject.org/wiki/Communicating_and_getting_help"
 * BUG_REPORT_URL="https://bugzilla.redhat.com/"
 */
if (fs_1.default.existsSync('/etc/debian_version')) {
    // Debian/Ubuntu
    distro.isolinux = '/usr/lib/ISOLINUX/';
    distro.syslinux = '/usr/lib/syslinux/modules/bios/';
} else {
    // Redhat
    distro.isolinux = '/usr/share/syslinux/';
    distro.syslinux = '/usr/share/syslinux/';
}
net.dhcp = true;
user.fullName = "Artisan";
user.name = "artisan";
user.password = "evolution";
root.fullName = "Root";
root.name = "root";
root.password = "evolution";
utils_1.default.pathScripts = __dirname;
if (utils_1.default.isRoot()) {
    config();
} else {
    usage();
}
bye();
// END MAIN
function usage() {
    console.log(`${app.name} need to run with supervisor privileges! You need to prefix it with sudo`);
    console.log("Usage: ");
    console.log(">>> sudo eggs spawn --distroname penguin");
    console.log(">>> sudo eggs hatch");
    console.log(">>> sudo eggs calamares");
    console.log(">>> sudo eggs kill");
}
async function config() {
    program.command("spawn").command("hatch").command("calamares").command("kill");
    program.option("-d, --distroname <distroname>");
    program.parse(process.argv);
    if (program.distroname) {
        distro.name = program.distroname;
    }
    if (await utils_1.default.isMounted("vz")) {
        workDir = "/var/lib/vz/eggs/";
    } else if (await utils_1.default.isMounted("docker")) {
        workDir = "/var/lib/docker/eggs/";
    } else if (await utils_1.default.isMounted("www")) {
        workDir = "/var/www/eggs/";
    }
    let e = new Egg_1.default(workDir, distro);
    let i = new Iso_1.default(app, workDir, distro);
    let c = new Calamares_1.default(distro.name, distro.versionName, distro.versionNumber);
    let command = process.argv[2];
    if (command == "spawn") {
        spawn(e, i, c);
    } else if (command == "kill") {
        i.kill();
        e.kill();
    } else if (command == "calamares") {
        calamares(c);
    } else if (command == "hatch") {
        startHatch();
    } else if (command == "distro") {
        utils_1.default.distroInfo();
        /**
            console.log("NAME = " + o.name);
            console.log("ID = " + o.id);
            console.log("HOME_URL = " + o.homeUrl);
            console.log("SUPPORT_URL = " + o.supportUrl);
            console.log("BUG_REPORT_URL = " + o.bugReportUrl);
            console.log("PRETTY_NAME = " + o.prettyName);
        */
    } else {
        usage();
    }
}
async function calamares(c) {
    if (c.isCalamaresInstalled()) {
        console.log("==========================================");
        console.log("eggs: calamares configuration");
        console.log("You can use the gui Installation:");
        console.log("$sudo calamares");
        console.log("or the cli installation:");
        console.log("$sudo eggs hatch");
        console.log("==========================================");
        await c.settingsConf();
        await c.brandingDesc();
    } else {
        console.log("==========================================");
        console.log("eggs: calamares-eggs is not installed!");
        console.log(">>>>Skipping calamares configuration<<<<<");
        console.log("Use the cli installation cli:");
        console.log("$sudo eggs hatch");
        console.log("==========================================");
    }
}
async function spawn(e, i, c) {
    if (!(await utils_1.default.isLive())) {
        console.log(">>> eggs: This is a live system! The spawn command cannot be executed.");
    } else {
        await calamares(c);
        console.log("Spawning the system into  the egg... \nThis process can be very long, perhaps it's time for a coffee!");
        await e.createStructure();
        await e.systemCopy();
        await i.createStructure();
        await i.isolinuxPrepare();
        await i.isolinuxCfg();
        await i.liveKernel();
        await i.liveSquashFs();
        await i.makeIsoFs();
    }
}
async function startHatch() {
    if (await utils_1.default.isLive()) {
        console.log(">>> eggs: This is an installed system! The hatch command cannot be executed.");
    } else {
        hatch_1.hatch();
    }
}
function bye() {
    console.log(`${app.name} v. ${app.version} (C) 2018/2019 ${app.author} <${app.mail}>`);
}
//# sourceMappingURL=index.js.map