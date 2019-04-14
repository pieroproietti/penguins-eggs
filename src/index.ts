#!/usr/bin/env node
/*
  penguins-eggs: main

  prerequisite: apt-get install \
                lvm2 parted \
                squashfs-tools \
                xorriso \
                live-boot \
                syslinux \
                syslinux-common \
                isolinux \
                pxelinux
  author: Piero Proietti
  mail: piero.proietti@gmail.com
*/

"use strict";

/**
 * babel-polyfill: va inserito per primo!
 */

import "babel-polyfill";


import pjson from "pjson";
import { IPackage } from "./interfaces";
let app = {} as IPackage;
app.author = "Piero Proietti";
app.homepage = "https://pieroproietti.github.io/";
app.mail = "piero.proietti@gmail.com";
app.name = pjson.name as string;
app.version = pjson.version;

import ip from "ip";
import os from "os";
import  fs  from "fs";

import utils from "./lib/utils";
import Iso from "./lib/Iso";
import Egg from "./lib/Egg";

import Calamares from "./lib/Calamares";
import { hatch } from "./lib/hatch";
import { IDistro, INet, IUser } from "./interfaces";
import { exit } from "shelljs";

import Oses from "./lib/Oses";

let oses = new Oses();

let program = require("commander").version(app.version);
let workDir = "/home/eggs/";
let distro = {} as IDistro;
let net = {} as INet;
let user = {} as IUser;
let root = {} as IUser;


distro.name = os.hostname();
distro.versionName = 'Emperor';
distro.versionNumber = utils.date4label();
distro.isolinux = oses.isolinux();
distro.syslinux = oses.syslinux();

net.dhcp = true;

user.fullName = "Artisan";
user.name = "artisan";
user.password = "evolution";

root.fullName = "Root";
root.name = "root";
root.password = "evolution";

utils.pathScripts = __dirname;

if (utils.isRoot()) {
  config();
} else {
  usage();
}

bye();
// END MAIN


function usage() {
  console.log(
    `${app.name} need to run with supervisor privileges! You need to prefix it with sudo`
  );
  console.log("Usage: ");
  console.log(">>> sudo eggs spawn --distroname penguin");
  console.log(">>> sudo eggs hatch");
  console.log(">>> sudo eggs calamares");
  console.log(">>> sudo eggs info");
  console.log(">>> sudo eggs kill");
}



async function config() {
  program
    .command("spawn")
    .command("hatch")
    .command("calamares")
    .command("info")
    .command("kill");

  program.option("-d, --distroname <distroname>");

  program.parse(process.argv);
  if (program.distroname) {
    distro.name = program.distroname;
  }

  if (await utils.isMounted("vz")) {
    workDir = "/var/lib/vz/eggs/";
  } else if (await utils.isMounted("docker")) {
    workDir = "/var/lib/docker/eggs/";
  } else if (await utils.isMounted("www")) {
    workDir = "/var/www/eggs/";
  }

  let e: Egg = new Egg(workDir, distro);
  let i: Iso = new Iso(app, workDir, distro);
  let c: Calamares = new Calamares(distro.name, distro.versionName, distro.versionNumber);

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
  } else if (command == "info") {
    console.log(oses.info());
  } else {
    usage();
  }
}

async function calamares(c: any) {
  let o:any={};
  let distroType:string="unknown";

  if (c.isCalamaresInstalled()) {

    console.log("==========================================");
    console.log("eggs: calamares configuration");
    o = oses.info();
    if (o.id==='linuxmint'){
      distroType = "debian";
    } else if (o.id==='linuxmint'){
      distroType = "debian";
    } else if (o.id==='ubuntu'){
      distroType = "ubuntu";
    } else if (o.id==='fedora'){
      distroType = "fedora";
    }
    console.log(`distro type: ${distroType} id: ${o.id} name: ${o.name} prettyName: ${o.prettyName}`);

    console.log("You can use the gui Installation:");
    console.log("sudo calamares");
    console.log("or the cli installation:");
    console.log("sudo eggs hatch");
    console.log("==========================================");
    await c.settingsConf(distroType);
    await c.brandingDesc(distroType, o.homeUrl, o.supportUrl, o.bugReportUrl );
  } else {
    console.log("==========================================");
    console.log("eggs: calamares-eggs is not installed!");
    console.log(">>>>Skipping calamares configuration<<<<<");
    console.log("Use the cli installation cli:");
    console.log("$sudo eggs hatch");
    console.log("==========================================");
  }
}


async function spawn(e: any, i: any, c: any) {
  if (!await utils.isLive()) {
    console.log(
      ">>> eggs: This is a live system! The spawn command cannot be executed."
    );
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
  if (await utils.isLive()) {
    console.log(
      ">>> eggs: This is an installed system! The hatch command cannot be executed."
    );
  } else {
    hatch();

  }
}


function bye() {
  console.log(
    `${app.name} v. ${app.version} (C) 2018/2019 ${app.author} <${app.mail}>`
  );
}
