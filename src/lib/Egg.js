/*
  Egg.js V. 0.3.0
*/

"use strict";
import os from "os";
import fs from "fs";
import shell from "shelljs";
import utils from "./utils.js";
import filters from "./filters.js";

class Egg {
  constructor(
    homeDir,
    distroName,
    clientUserFullName,
    clientUserName,
    clientPassword
  ) {
    this.distroName = distroName;
    this.homeDir = homeDir;
    this.fsDir = homeDir + `${distroName}/fs`;
    this.clientUserFullName = clientUserFullName;
    this.clientUserName = clientUserName;
    this.clientPassword = clientPassword;
    this.clientIpAddress = "127.0.1.1";

    this.kernelVer = utils.kernerlVersion();
    this.netDeviceName = utils.netDeviceName();
    this.netDomainName = "lan";
    this.netDns = utils.netDns();
  }

  async kill() {
    console.log("==========================================");
    console.log("eggs kill");
    console.log("==========================================");
    utils.exec(`rm -rf ${this.homeDir}`);
  }

  // Check or create a nest
  async spawn() {
    console.log("==========================================");
    console.log("eggs spawn");
    console.log("==========================================");
    if (!fs.existsSync(this.homeDir)) {
      utils.exec(`mkdir -p ${this.homeDir}`);
      //utils.exec(`ln -s ${this.homeDir} /srv/penguins-eggs`);
    }

    if (fs.existsSync(this.fsDir)) {
      // Remove and create /var ed /etc
      utils.exec(`rm -rf ${this.fsDir}/var`);
      utils.exec(`mkdir -p ${this.fsDir}/var`);
      utils.exec(`rm -rf ${this.fsDir}/etc`);
      utils.exec(`mkdir -p ${this.fsDir}/etc/live`);
    } else {
      utils.exec(`mkdir -p ${this.fsDir}`);
      utils.exec(`mkdir -p ${this.fsDir}/dev`);
      utils.exec(`mkdir -p ${this.fsDir}/etc`);
      utils.exec(`mkdir -p ${this.fsDir}/etc/intefaces`);
      utils.exec(`mkdir -p ${this.fsDir}/etc/live`);
      utils.exec(`mkdir -p ${this.fsDir}/proc`);
      utils.exec(`mkdir -p ${this.fsDir}/sys`);
      utils.exec(`mkdir -p ${this.fsDir}/media`);
      utils.exec(`mkdir -p ${this.fsDir}/run`);
      utils.exec(`mkdir -p ${this.fsDir}/var`);
      utils.exec(`mkdir -p ${this.fsDir}/tmp`);
    }
  }

  async copy() {
    let cmd="";
    cmd=`
    rsync -aq  \
    --filter="- ${this.homeDir}"  \
    --delete-before  \
    --delete-excluded  \ ${filters} / ${this.fsDir}`;
    console.log("spawning the system to egg...");
    console.log(cms.trim());
    shell.exec(cmd.trim(), { async: false });
  }

  async fstab() {
    let file = `${this.fsDir}/etc/fstab`;
    let text = `
#proc /proc proc defaults 0 0
/dev/nfs / nfs defaults 1 1
`;
    utils.bashwrite(file, text);
  }

  async hostname() {
    utils.hostname(this.fsDir, this.distroName);
  }

  async resolvConf() {
    let file = `${this.fsDir}/etc/resolv.conf`;
    let text = `
search ${this.netDomainName}
nameserver ${this.netDns}
nameserver 8.8.8.8
nameserver 8.8.4.4
`;

    utils.bashwrite(file, text);
  }

  async interfaces() {
    let file = `${this.fsDir}/etc/network/interfaces`;
    let text = `
auto lo
iface lo inet loopback
iface this.netDeviceName inet manual
`;

    utils.bashwrite(file, text);
  }

  async hosts() {
    let file = `${this.fsDir}/etc/hosts`;
    let text = `
127.0.0.1 localhost.localdomain localhost
${this.clientIpAddress} ${this.distroName}.${this.netDomainName} ${
      this.distroName
    }
# The following lines are desirable for IPv6 capable hosts
::1     ip6-localhost ip6-loopback
fe00::0 ip6-localnet
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
ff02::3 ip6-allhosts
`;

    utils.bashwrite(file, text);
  }
}

export default Egg;
