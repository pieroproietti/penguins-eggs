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
  program.option(
    "-d, --distroname <distroname>"
  );

  program
    // <mandatory> [optional]
    .command("create")
    .command("destroy")
    .command("show")
    .command("serve")
    .command("hatch");

  program.parse(process.argv);

  if (program.distroname) {
    distroName = program.distroname;
  }

  let e = new Egg(homeDir, distroName, userfullname, username, password);
  let n = new Netboot(homeDir, distroName, userfullname, username, password);
  let i = new Iso(homeDir, distroName, userfullname, username, password);

  let command = process.argv[2];

  if (command == "create") {
    buildEgg(e);
    buildIso(i);
  }
  if (command == "serve") {
    netbootConfigure(n);
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
    console.log("Starting http server...");
    app.listen(80);
  } else if (command == "destroy") {
    e.erase();
    n.erase();
    i.erase();
  } else if (command == "show") {
    if (program.netboot) {
      n.show();
    } else if (program.iso) {
      i.show();
    } else {
      console.log("Usage: eggs show <netboot|iso>");
    }
  } else if (command == "hatch") {
    hatch();
  } else {
    console.log(
      "Usage: eggs <show|create|install|purge|start|stop|restart|hatch>"
    );
  }
} else {
  console.log(
    `${name} need to run with supervisor privileges! You need to prefix it with sudo`
  );
  console.log("Example: ");
  console.log(">>> sudo eggs install netboot");
  console.log(">>> sudo eggs create --distroname cell");
  console.log(">>> sudo eggs hatch");
}

bye();
// END MAIN

async function buildEgg(e) {
  await e.create();
  await e.copy();
  await e.fstab();
  await e.hostname();
  await e.resolvConf();
  await e.interfaces();
  await e.hosts();
}

async function buildIso(i) {
  await i.create();
  await i.isolinux();
  await i.isolinuxCfg();
  await i.alive();
  await i.squashFs();
  await i.makeIso();
}

function netbootConfigure(n) {
  n.erase();
  n.create();
  n.vmlinuz();
  n.initramfs();
  n.pxelinux();
  //n.dnsmasq();
  //n.exports();
}

function bye() {
  console.log(
    `${name} version ${version} (C) 2017 ${author} <${mail}> site ${homepage}`
  );
}
