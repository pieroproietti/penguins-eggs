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
import Iso from "./classes/Iso";
import Oses from "./classes/Oses";
import Prerequisites from "./classes/Prerequisites";
import Update from "./classes/Update";

import utils from "./lib/utils";
import { hatch } from "./lib/hatch";
import { IDistro, IOses, INet, IUser } from "./interfaces";
import { Netmask } from "netmask";


let app = {} as  IPackage;
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

user.name = process.env.SUDO_USER;
if (user.name==""){
  user.name = "live";
  user.fullName = "live";
  user.password = "evolution";
}

let root = {} as IUser;
root.name = "root";
root.fullName = "root";
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
  .option("-t, --testing");

  program.parse(process.argv);
  if (program.distroname) {
    distro.name = program.distroname;
  }
  if (program.branding) {
    distro.branding = program.branding;
  } else {
    distro.branding = "eggs";
  }

  /**
   *sudo npx ts-node src/index.ts produce -b deblinux  -t
   */
  console.log(`user: ${user.name}`);
  console.log(`distroname: ${distro.name}`);
  console.log(`branding: ${distro.branding}`);

  if (program.testing) {
    process.exit();
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

  let o: IOses = oses.info(distro);
  let i: Iso = new Iso(app, workDir, distro, user);
  let c: Calamares = new Calamares(distro);
  let p: Prerequisites = new Prerequisites(o);

  let command = process.argv[2];

  if (command == "produce") {
    i.produce(o, c);
  } else if (command == "spawn") {
    i.produce(o, c);
  } else if (command == "lay") {
    i.produce(o, c);
  } else if (command == "info") {
    console.log(oses.info(distro));
  } else if (command == "install") {
    startHatch();
  } else if (command == "hatch") {
    startHatch();
  } else if (command == "prerequisites") {
    console.log("Installing prerequisites...");
    p.install();
  } else if (command == "calamares") {
    c.configure(o);
  } else if (command == "update") {
    Update.go();
  } else if (command == "kill") {
    i.kill();
  } else {
    usage();
  }
}

async function startHatch() {
  if (await utils.isLive()) {
    hatch();
  } else {
    console.log(
      ">>> eggs: This is an installed system! The hatch command cannot be executed."
    );
  }
}

function bye() {
  console.log(
    `${app.name} v. ${app.version} (C) 2018/2019 ${app.author} <${app.mail}>`
  );
}

