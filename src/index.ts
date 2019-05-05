#!/usr/bin/env node

/**
 * penguins-eggs: main
 * 
 * author: Piero Proietti  
 * mail: piero.proietti@gmail.com
 * 
 */

"use strict";

/**
 * babel-polyfill: va inserito per primo!
 */
import "babel-polyfill";
import pjson from "pjson";
import { IPackage } from "./interfaces";
import ip from "ip";
import os from "os";
import fs from "fs";

import Calamares from "./classes/Calamares";
import Egg from "./classes/Egg";
import Iso from "./classes/Iso";
import Oses from "./classes/Oses";
import Prerequisites from "./classes/Prerequisites";

import utils from "./lib/utils";
import { hatch } from "./lib/hatch";
import { IDistro, INet, IUser } from "./interfaces";


let app = {} as IPackage;
app.author = "Piero Proietti";
app.homepage = "https://pieroproietti.github.io/";
app.mail = "piero.proietti@gmail.com";
app.name = pjson.name as string;
app.version = pjson.version;

let program = require("commander").version(app.version);
let oses = new Oses();
let workDir = "/home/eggs/";

let distro = {} as IDistro;
distro.name = os.hostname();
distro.versionName = 'Emperor';
distro.versionNumber = utils.date4label();

let net = {} as INet;
net.dhcp = true;

let user = {} as IUser;
user.fullName = "live";
user.name = "live";
user.password = "evolution";

let root = {} as IUser;
root.fullName = "root";
root.name = "root";
root.password = "evolution";

if (utils.isRoot()) {
  start();
} else {
  usage();
}

bye();
// End main


/**
 * usage
 */
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


/**
 * start
 */
async function start() {
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
  } else {
    workDir = "/home/eggs/";
  }

  let o = oses.info();
  let e: Egg = new Egg(workDir, distro);
  let i: Iso = new Iso(app, workDir, distro);
  let c: Calamares = new Calamares(distro.name, distro.versionName, distro.versionNumber);

  let command = process.argv[2];

  if (command == "spawn") {
    spawn(e, i, c, o);
  } else if (command == "kill") {
    i.kill();
  } else if (command == "calamares") {
    calamares(c, o);
  } else if (command == "hatch") {
    startHatch();
  } else if (command == "prerequisites") {
    installPrerequisites(o);
  } else if (command == "info") {
    console.log(oses.info());
  } else {
    usage();
  }
}

/**
 * 
 * calamares
 */
function calamares(c: any, o: any): any {
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
}

/**
 * spawn(
 */
async function spawn(e: any, i: any, c: any, o: any) {

  if (!await utils.isLive()) {
    console.log(
      ">>> eggs: This is a live system! The spawn command cannot be executed."
    );
  } else {
    calamares(c, o);

    console.log("------------------------------------------");
    console.log(`Spawning the system into the egg...`);
    console.log("------------------------------------------");
    await e.createStructure();
    await i.createStructure();
    await i.isolinuxPrepare(o.isolinuxPath, o.syslinuxPath);
    await i.isolinuxCfg();
    await i.liveKernel();
    console.log("------------------------------------------");
    console.log(`Spawning the system into the egg...\nThis process can be very long, \nperhaps it's time for a coffee!`);
    console.log("------------------------------------------");
    await e.systemCopy();
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

async function installPrerequisites(o: any) {
  if (o.distroLike === "Arch") {
    Prerequisites.arch();
  } else if (o.distroLike === "Debian") {
    Prerequisites.debian();
  } else if (o.distroLike === "Ubuntu") {
    Prerequisites.debian();
  } else if (o.distroLike === "RedHat") {
    Prerequisites.redhat();
  }
}


function bye() {
  console.log(
    `${app.name} v. ${app.version} (C) 2018/2019 ${app.author} <${app.mail}>`
  );
}

