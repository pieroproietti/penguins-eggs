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
distro.versionName = "Emperor";
distro.versionNumber = "0.0.1";
net.dhcp = true;
user.fullName = "Artisan";
user.name = "artisan";
user.password = "evolution";
root.fullName = "Root";
root.name = "root";
root.password = "evolution";
if (utils_1.default.isRoot()) {
    config();
} else {
    console.log(`${app.name} need to run with supervisor privileges! You need to prefix it with sudo`);
    console.log("Examples: ");
    console.log(">>> sudo eggs spawn --distroname penguin");
    console.log(">>> sudo eggs hatch");
    console.log(">>> sudo eggs kill");
}
bye();
// END MAIN
async function config() {
    program.command("spawn").command("hatch").command("kill");
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
    } else if (command == "hatch") {
        startHatch();
    }
}
async function spawn(e, i, c) {
    if (!(await utils_1.default.isLive())) {
        console.log(">>> eggs: This is a live system! The spawn command cannot be executed.");
    } else {
        console.log("calamares-settings-eggs");
        await c.settingsConf();
        await c.brandingDesc();
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