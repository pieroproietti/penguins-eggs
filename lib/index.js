#!/usr/bin/env node
/**
 * penguins-eggs: main
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const pjson_1 = __importDefault(require("pjson"));
const Calamares_1 = __importDefault(require("./classes/Calamares"));
const Iso_1 = __importDefault(require("./classes/Iso"));
const Oses_1 = __importDefault(require("./classes/Oses"));
const Prerequisites_1 = __importDefault(require("./classes/Prerequisites"));
const Update_1 = __importDefault(require("./classes/Update"));
const hatch_1 = require("./lib/hatch");
const utils_1 = __importDefault(require("./lib/utils"));
const app = {};
app.author = "Piero Proietti";
app.homepage = "https://github.com/pieroproietti/penguins-eggs";
app.mail = "piero.proietti@gmail.com";
app.name = pjson_1.default.name;
app.version = pjson_1.default.version;
const program = require("commander").version(app.version);
const oses = new Oses_1.default();
let workDir = "/home/eggs/";
const distro = {};
distro.name = os_1.default.hostname();
distro.versionName = "Emperor";
distro.versionNumber = utils_1.default.date4label();
const net = {};
net.dhcp = true;
const user = {};
user.name = process.env.SUDO_USER;
if (user.name == "") {
    user.name = "live";
    user.fullName = "live";
    user.password = "evolution";
}
const root = {};
root.name = "root";
root.fullName = "root";
root.password = "evolution";
if (utils_1.default.isRoot()) {
    start();
}
else {
    usage();
}
bye();
// End main
/**
 * usage
 */
function usage() {
    console.log(`${app.name} need to run with supervisor privileges! Prefix it with sudo`);
    console.log("Usage: ");
    console.log(">>> sudo eggs produce --distroname penguin --branding debian");
    console.log(">>> sudo eggs info");
    console.log(">>> sudo eggs install");
    console.log(">>> sudo eggs prerequisites");
    console.log(">>> sudo eggs calamares");
    console.log(">>> sudo eggs update");
    console.log(">>> sudo eggs kill");
}
/**
 * start
 */
async function start() {
    let force = false;
    let testing = false;
    program
        .command("produce")
        .command("info")
        .command("install")
        .command("prerequisites")
        .command("calamares")
        .command("update")
        .command("kill")
        .command("user");
    program
        .option("-d, --distroname <distroname>")
        .option("-b, --branding <branding>")
        .option("-f, --force")
        .option("-t, --testing");
    program.parse(process.argv);
    console.log(process.argv);
    if (program.distroname) {
        distro.name = program.distroname;
    }
    if (program.branding) {
        distro.branding = program.branding;
    }
    else {
        distro.branding = "eggs";
    }
    if (program.force) {
        force = true;
    }
    if (program.testing) {
        testing = true;
    }
    workDir = "/home/eggs/";
    console.log(`user: ${user.name}`);
    console.log(`distroname: ${distro.name}`);
    console.log(`branding: ${distro.branding}`);
    console.log(`force: ${force}`);
    console.log(`testing: ${testing}`);
    if (testing) {
        process.exit();
    }
    const o = oses.info(distro);
    const i = new Iso_1.default(app, workDir, distro, user);
    const c = new Calamares_1.default(distro);
    const p = new Prerequisites_1.default(o);
    const command = process.argv[2];
    if (command == "produce") {
        i.produce(o, c);
    }
    else if (command == "spawn") {
        i.produce(o, c);
    }
    else if (command == "lay") {
        i.produce(o, c);
    }
    else if (command == "info") {
        console.log(oses.info(distro));
    }
    else if (command == "install") {
        install(force);
    }
    else if (command == "hatch") {
        install(force);
    }
    else if (command == "prerequisites") {
        p.install();
    }
    else if (command == "calamares") {
        c.configure(o);
    }
    else if (command == "update") {
        Update_1.default.go();
    }
    else if (command == "kill") {
        i.kill();
    }
    else {
        usage();
    }
}
async function install(force = false) {
    if (force) {
        hatch_1.hatch();
    }
    else if (!await utils_1.default.isLive()) {
        console.log(">>> eggs: This is an installed system! The hatch command cannot be executed.");
    }
    else {
        hatch_1.hatch();
    }
}
function bye() {
    console.log(`${app.name} v. ${app.version} (C) 2018/2019 ${app.author} <${app.mail}>`);
}
