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
// import "babel-polyfill";
import fs from "fs";
import ip from "ip";
import os from "os";
import pjson from "pjson";
import { IPackage } from "./interfaces";

import Calamares from "./classes/Calamares";
import Iso from "./classes/Iso";
import Oses from "./classes/Oses";
import Prerequisites from "./classes/Prerequisites";
import Update from "./classes/Update";

import { Netmask } from "netmask";
import { IDistro, INet, IOses, IUser } from "./interfaces";
import { hatch } from "./lib/hatch";
import utils from "./lib/utils";

const app = {} as IPackage;
app.author = "Piero Proietti";
app.homepage = "https://github.com/pieroproietti/penguins-eggs";
app.mail = "piero.proietti@gmail.com";
app.name = pjson.name as string;
app.version = pjson.version;

const program = require("commander").version(app.version);
const oses = new Oses();
let workDir = "/home/eggs/";

const distro = {} as IDistro;
distro.name = os.hostname();
distro.versionName = "Emperor";
distro.versionNumber = utils.date4label();

const net = {} as INet;
net.dhcp = true;

const user = {} as IUser;

user.name = process.env.SUDO_USER;


const root = {} as IUser;
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
    `${app.name} need to run with supervisor privileges, prefix it with sudo.`,
  );
  console.log("Usage: ");
  console.log(">>> sudo eggs produce --distroname penguin \\");
  console.log(">>>                   --branding debian \\");
  console.log(">>>                   --dry-run");
  console.log(">>> sudo eggs info");
  console.log(">>> sudo eggs install");
  console.log(">>> sudo eggs prerequisites");
  console.log(">>> sudo eggs calamares");
  console.log(">>> sudo eggs update");
  console.log(">>> sudo eggs sterilize");
  console.log(">>> sudo eggs kill");
}

/**
 * start
 */
async function start() {
  let dryRun: boolean = false;

  program
    .command("produce")
    .command("info")
    .command("install")
    .command("prerequisites")
    .command("calamares")
    .command("update")
    .command("sterilize")
    .command("kill");

  program
    .option("-d, --distroname <distroname>")
    .option("-b, --branding <branding>")
    .option("--dry-run");

  program.parse(process.argv);
  //console.log(process.argv);

  if (program.distroname) {
    distro.name = program.distroname;
  }
  if (program.branding) {
    distro.branding = program.branding;
  } else {
    distro.branding = "eggs";
  }
  if (program.dryRun) {
    dryRun = true;
  }

  workDir = "/home/eggs/";


  if (dryRun) {
    console.log(`user: ${user.name}`);
    console.log(`distroname: ${distro.name}`);
    console.log(`branding: ${distro.branding}`);
    console.log(`--dry-run: ${dryRun}`);
    process.exit();
  }

  const o: IOses = oses.info(distro);
  const i: Iso = new Iso(app, workDir, distro, user);
  const c: Calamares = new Calamares(distro);
  const p: Prerequisites = new Prerequisites();

  const command = process.argv[2];

  if (command == "produce") {
    if (isUserLive()) {
      i.produce(o, c);
    }
  } else if (command == "spawn") {
    if (isUserLive()) {
      i.produce(o, c);
    }
  } else if (command == "lay") {
    if (isUserLive()) {
      i.produce(o, c);
    }
  } else if (command == "info") {
    console.log(oses.info(distro));
  } else if (command == "install") {
    install();
  } else if (command == "hatch") {
    install();
  } else if (command == "prerequisites") {
    p.cli();
  } else if (command == "calamares") {
    c.configure(o);
    p.calamares();
  } else if (command == "update") {
    Update.go();
  } else if (command == "sterilize") {
    p.sterilize();
  } else if (command == "kill") {
    i.kill();
  } else {
    usage();
  }
}

async function install() {
  if (!await utils.isLive()) {
    console.log(
      ">>> eggs: This is an installed system! The hatch command cannot be executed.",
    );
  } else {
    hatch();
  }
}

function bye() {
  console.log(
    `${app.name} v. ${app.version} (C) 2018/2019 ${app.author} <${app.mail}>`,
  );
}

function isUserLive(): boolean {
  let retval: boolean = true;
  if (user.name != "live") {
    console.log(`${app.name} ${app.version}`);
    console.log(`ATTENZIONE: stai utilizzando l'utente ${user.name}`);
    console.log(`${app.name} è pensato per essere avviato con utente denominato "live" che faccia parte del gruppo "sudo".\n`);
    console.log(`Puoi creare l'utente live con i seguenti comandi: \n`);
    console.log(`>>> sudo adduser live`);
    console.log(`>>> sudo addgroup live sudo`);
    console.log(`Se disponi di autologin, potrebbe essere necessario impostare l'autologin a live`);
    retval = false;
  }
  return retval;
}