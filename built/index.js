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
const hatch_1 = require("./lib/hatch");
let program = require("commander").version(app.version);
let workDir = "/var/lib/vz/eggs/";
let distro = {};
let net = {};
let user = {};
let root = {};
distro.name = os_1.default.hostname();
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
    console.log(">>> sudo eggs kill");
    console.log(">>> sudo eggs hatch");
    console.log(">>> sudo eggs cuckoo");
}
bye();
// END MAIN
async function config() {
    program.command("spawn").command("kill").command("hatch");
    program.option("-d, --distroname <distroname>");
    program.parse(process.argv);
    if (program.distroname) {
        distro.name = program.distroname;
    }
    if (await utils_1.default.isMounted("home")) {
        workDir = "/home/eggs/";
    } else if (await utils_1.default.isMounted("docker")) {
        workDir = "/var/lib/docker/eggs/";
    } else if (await utils_1.default.isMounted("www")) {
        workDir = "/var/www/eggs/";
    }
    let e = new Egg_1.default(workDir, distro);
    let i = new Iso_1.default(app, workDir, distro);
    let command = process.argv[2];
    if (command == "spawn") {
        spawn(e, i);
    }
    if (command == "kill") {
        e.kill();
        i.kill();
    } else if (command == "hatch") {
        startHatch();
    }
}
async function spawn(e, i) {
    if (!(await utils_1.default.isLive())) {
        console.log(">>> eggs: This is a live system! The spawn command cannot be executed.");
    } else {
        await buildEgg(e);
        await buildIso(i);
    }
}
async function startHatch() {
    if (await utils_1.default.isLive()) {
        console.log(">>> eggs: This is an installed system! The hatch command cannot be executed.");
    } else {
        hatch_1.hatch();
    }
}
async function buildEgg(e) {
    await e.spawn();
    await e.copy();
    await e.fstab();
    await e.hostname();
    await e.resolvConf();
    await e.interfaces();
    await e.hosts();
}
async function buildIso(i) {
    await i.spawn();
    await i.isolinux();
    await i.isolinuxCfg();
    await i.alive();
    await i.squashFs();
    await i.makeIso();
}
function bye() {
    console.log(`${app.name} V. ${app.version} (C) 2018 ${app.author} <${app.mail}>`);
}
//# sourceMappingURL=index.js.map