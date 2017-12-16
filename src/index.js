/*
  penguins-eggs:
  depend on: lvm2 parted squashfs-tools xorriso live-boot syslinux syslinux-common isolinux pxelinux
*/
"use strict";

// import { install } from "source-map-support";
// install

import { version, name, author, mail, homepage } from "../package.json";
import { hatch } from "./lib/hatch.js";
import ip from "ip";
import os from "os";
import Egg from "./lib/Egg.js";
import Netboot from "./lib/Netboot.js";
import Iso from "./lib/Iso.js";
import dhcpd from "./lib/dhcpd.js";
import tftpd from "./lib/tftpd.js";
import utils from "./lib/utils.js";

let program = require("commander").version(version);
const homeDir = "/var/lib/vz/penguins-eggs/";
let distroName = os.hostname;
let userfullname = "artisan";
let username = "artisan";
let password = "evolution";

if (utils.isRoot()) {
  program
    .command("spawn")
    .command("kill")
    .command("hatch")
    .command("cuckoo");

  program.option("-d, --distroname <distroname>");

  program.parse(process.argv);
  if (program.distroname) {
    distroName = program.distroname;
  }

  let e = new Egg(homeDir, distroName, userfullname, username, password);
  let n = new Netboot(homeDir, distroName, userfullname, username, password);
  let i = new Iso(homeDir, distroName, userfullname, username, password);

  let command = process.argv[2];

  if (command == "spawn") {
    spawn(e, i);
  }
  if (command == "cuckoo") {
    cuckoo(n);
  } else if (command == "kill") {
    e.kill();
    n.kill();
    i.kill();
  } else if (command == "hatch") {
    startHatch();
  }
} else {
  console.log(
    `${name} need to run with supervisor privileges! You need to prefix it with sudo`
  );
  console.log("Examples: ");
  console.log(">>> sudo eggs spawn --distroname penguin");
  console.log(">>> sudo eggs kill");
  console.log(">>> sudo eggs hatch");
  console.log(">>> sudo eggs cuckoo");
}

bye();
// END MAIN

async function spawn(e, i) {
  if (await utils.IsLive()) {
    console.log(
      ">>> eggs: This is a live system! The spawn command cannot be executed..."
    );
  } else {
    await buildEgg(e);
    await buildIso(i);
  }
}

async function startHatch() {
  if (!await utils.IsLive()) {
    console.log(
      ">>> eggs: This is an installed system! The hatch command cannot be executed..."
    );
  } else {
    hatch();
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

async function cuckoo(n) {
  await n.kill();
  await n.spawn();
  await n.vmlinuz();
  await n.initramfs();
  await n.pxelinux();

  var express = require("express");
  var serveStatic = require("serve-static");
  var http = require("http");
  var host = "10.0.0.1"; //ip.address();
  var netmask = "255.255.255.0"; //utils.netNetmask();
  var oSubnet = ip.subnet(host, netmask);
  var subnet = oSubnet.networkAddress + "/" + oSubnet.subnetMaskLength;
  var pxeRoot = `${homeDir}${distroName}/pxe`;

  utils.exec(`route add -host 255.255.255.255 dev ens19`);
  tftpd.start(host, pxeRoot);

  let range = ["10.0.0.2", oSubnet.lastAddress];
  dhcpd.start(host, netmask, oSubnet.broadcastAddress, range);

  var app = express();
  app.use(serveStatic(pxeRoot));
  console.log("Starting http...");
  app.listen(80);
  //n.dnsmasq();
  //n.exports();
}

function bye() {
  console.log(
    `${name} version ${version} (C) 2017 ${author} <${mail}> site ${homepage}`
  );
}
