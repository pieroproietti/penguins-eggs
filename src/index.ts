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
import fs from "fs";

import utils from "./lib/utils";
import Iso from "./lib/Iso";
import Egg from "./lib/Egg";

import Calamares from "./lib/Calamares";
import { hatch } from "./lib/hatch";
import { IDistro, INet, IUser } from "./interfaces";
import { exit } from "shelljs";

import Oses from "./lib/Oses";
import Prerequisites from "./lib/Prerequisites";

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

net.dhcp = true;

user.fullName = "live";
user.name = "live";
user.password = "evolution";

root.fullName = "root";
root.name = "root";
root.password = "evolution";

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
  console.log(">>> sudo eggs info");
  console.log(">>> sudo eggs hatch");
  console.log(">>> sudo eggs prerequisites");
  console.log(">>> sudo eggs calamares");
  console.log(">>> sudo eggs kill");
}



async function config() {
  program
    .command("spawn")
    .command("info")
    .command("hatch")
    .command("prerequisites")
    .command("calamares")
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
  } else if (command == "calamares") {
    calamares(c);
  } else if (command == "hatch") {
    startHatch();
  } else if (command == "prerequisites") {
    installPrerequisites();
  } else if (command == "info") {
    console.log(oses.info());
  } else {
    usage();
  }
}

function calamares(c: any): any {
  let o: any = {};

  console.log("==========================================");
  console.log("eggs: calamares configuration");
  console.log("------------------------------------------");
  o = oses.info();
  console.log(`distro: [${o.distroId}/${o.versionId}]->[${o.distroLike}/${o.versionLike}]`);
  c.create();
  c.settingsConf(o.versionLike);
  c.brandingDesc(o.versionLike, o.homeUrl, o.supportUrl, o.bugReportUrl);
  c.unpackModule(o.mountpointSquashFs);
  console.log("==========================================");
  return o;
}

async function spawn(e: any, i: any, c: any) {
  let o: any = {};

  if (!await utils.isLive()) {
    console.log(
      ">>> eggs: This is a live system! The spawn command cannot be executed."
    );
  } else {
    o = calamares(c);

    console.log("------------------------------------------");
    console.log(`Spawning the system into  the egg...\nThis process can be very long, \nperhaps it's time for a coffee!`);
    console.log("------------------------------------------");
    await e.createStructure();
    await i.createStructure();
    await i.isolinuxPrepare(o.isolinuxPath, o.syslinuxPath);
    await e.systemCopy();
    await i.isolinuxCfg();
    await i.liveKernel();
    await i.liveSquashFs();
    await i.makeIsoFs(o.isolinuxPath);
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

async function installPrerequisites() {
  let o = oses.info();
  if (o.distroLike==="Arch"){
    Prerequisites.arch();
  } else if (o.distroLike==="Debian"){
    Prerequisites.debian();
  } else if (o.distroLike==="Ubuntu"){
    Prerequisites.debian();
  } else if (o.distroLike==="RedHat"){
    Prerequisites.redhat();
  }
}


function bye() {
  console.log(
    `${app.name} v. ${app.version} (C) 2018/2019 ${app.author} <${app.mail}>`
  );
}

