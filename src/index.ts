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

import utils from "./lib/utils";
import Iso from "./lib/Iso";
import Egg from "./lib/Egg";
import { hatch } from "./lib/hatch";
import { IDistro, INet, IUser } from "./interfaces";

let program = require("commander").version(app.version);
let workDir = "/home/eggs/";
let distro = {} as IDistro;
let net = {} as INet;
let user = {} as IUser;
let root = {} as IUser;

distro.name = os.hostname();

net.dhcp = true;

user.fullName = "Artisan";
user.name = "artisan";
user.password = "evolution";

root.fullName = "Root";
root.name = "root";
root.password = "evolution";


if (utils.isRoot()) {
  config();
} else {
  console.log(
    `${app.name} need to run with supervisor privileges! You need to prefix it with sudo`
  );
  console.log("Examples: ");
  console.log(">>> sudo eggs spawn --distroname penguin");
  console.log(">>> sudo eggs kill");
  console.log(">>> sudo eggs hatch");
  console.log(">>> sudo eggs cuckoo");
}

bye();
// END MAIN

async function config() {
  program
    .command("spawn")
    .command("kill")
    .command("hatch");

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

async function spawn(e: any, i: any) {
  if (!await utils.isLive()) {
    console.log(
      ">>> eggs: This is a live system! The spawn command cannot be executed."
    );
  } else {
    await buildEgg(e);
    await buildIso(i);
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

async function buildEgg(e: any) {
  await e.spawn();
  await e.copy();
}

async function buildIso(i: any) {
  await i.spawn();
  await i.isolinux();
  await i.isolinuxCfg();
  await i.alive();
  await i.squashFs();
  await i.makeIso();
}

function bye() {
  console.log(
    `${app.name} V. ${app.version} (C) 2018 ${app.author} <${app.mail}>`
  );
}
