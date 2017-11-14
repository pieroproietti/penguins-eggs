"use strict";

import utils from "./utils.js";
import filters from "./filters.js";
import shell from "shelljs";
import fs from "fs";
import os from "os";
const inquirer = require("inquirer");
const drivelist = require("drivelist");

export async function hatch() {
  let target = "/TARGET";
  let devices = {
    root: {
      device: "/dev/pve/root",
      fstype: "ext4",
      mountPoint: "/"
    },
    boot: {
      device: "/dev/sda1",
      fstype: "ext2",
      mountPoint: "/boot"
    },
    data: {
      device: "/dev/pve/data",
      fstype: "ext4",
      mountPoint: "/var/lib/vz"
    },
    swap: {
      device: "/dev/pve/swap",
      fstype: "swap",
      mountPoint: "none"
    }
  };

  let isLive;
  isLive = await getIsLive();

  let driveList;
  driveList = await getDrives();

  let varOptions;
  varOptions = await getOptions(driveList);
  let options = JSON.parse(varOptions);

  let isDiskPreoared;
  isDiskPreoared = await diskPrepare(options.installationDevice);

  let diskSize;
  diskSize = await getDiskSize(options.installationDevice);
  console.log(
    `hatch diskSize: ${diskSize} Byte, equal at ${Math.round(
      diskSize / 1024 / 1024 / 1024
    )} GB`
  );

  let isPartitionBootPrepared;
  isPartitionBootPrepared = await diskPreparePartitionBoot(
    options.installationDevice
  );

  await diskPreparePartitionLvm(
    options.installationDevice,
    Math.floor(diskSize / 1024 / 1024)
  );
  await diskPreparePve(options.installationDevice);

  await mkfs(devices);
  await mount(target, devices);
  await rsync(target);
  await fstab(target, devices);

  await hostname(target, options);
  await resolvConf(target, options);
  await interfaces(target, options);
  await hosts(target, options);
  await mount4chroot(target);
  await mkinitramfs(target);
  await grubInstall(target, options);
  //await purge(target);
  await umount4chroot(target);
  await umount(target, devices);
}

async function grubInstall(target, options) {
  await execute(`chroot ${target} grub-install ${options.installationDevice}`);
  await execute(`chroot ${target} update-grub`);
}

async function mkinitramfs(target) {
  await execute(
    `chroot ${target} mkinitramfs -k -o /tmp/initramfs-$(uname -r)`
  );
  await execute(`cp ${target}/tmp/initramfs-$(uname -r) /TARGET/boot`);
}

async function mount4chroot(target) {
  await execute(`mount -o bind /dev ${target}/dev`);
  await execute(`mount -o bind /devpts ${target}/dev/pts`);
  await execute(`mount -o bind /proc ${target}/proc`);
  await execute(`mount -o bind /dev ${target}/dev`);
  await execute(`mount -o bind /sys ${target}/sys`);
  await execute(`mount -o bind /run ${target}/run`);
}

async function umount4chroot(target) {
  await execute(`umount ${target}/dev/pts`);
  await execute(`sleep 1`);
  await execute(`umount ${target}/dev`);
  await execute(`sleep 1`);
  await execute(`umount ${target}/proc`);
  await execute(`sleep 1`);
  await execute(`umount ${target}/sys`);
  await execute(`sleep 1`);
  await execute(`umount ${target}/run`);
  await execute(`sleep 1`);
}

async function fstab(target, devices) {
  let file = `${target}/etc/fstab`;
  let text = `
proc /proc proc defaults 0 0
${devices.root.device} ${devices.root.mountPoint} ${devices.root
    .fstype} relatime,errors=remount-ro 0 1
${devices.boot.device} ${devices.boot.mountPoint} ${devices.boot
    .fstype} relatime 0 0
${devices.data.device} ${devices.data.mountPoint} ${devices.data
    .fstype} relatime 0 0
${devices.swap.device} ${devices.swap.mountPoint} ${devices.swap
    .fstype} sw 0 0`;

  utils.bashwrite(file, text);
}

async function hostname(target, options) {
  let file = `${target}/etc/hostname`;
  let text = options.hostname;

  utils.exec(`rm ${target}/etc/hostname`);
  fs.writeFileSync(file, text);
}

async function resolvConf(target, options) {
  if (options.netAddressType === "static") {
    let file = `${target}/etc/resolv.conf`;
    let text = `
search ${options.domain}
domain ${options.domain}
nameserver ${options.netDns}
nameserver 8.8.8.8
nameserver 8.8.4.4
`;
    utils.bashwrite(file, text);
  }
}

async function interfaces(target, options) {
  if (options.netAddressType === "static") {
    let file = `${target}/etc/network/interfaces`;
    let text = `
auto lo
iface lo inet loopback
auto ${options.netInterface}
iface ${options.netInterface} inet ${options.netAddressType}
    address ${options.netAddress}
    netmask ${options.netMask}
    gateway ${options.netGateway}
`;

    utils.bashwrite(file, text);
  }
}

async function hosts(target, options) {
  let file = `${target}/etc/hosts`;
  let text = `127.0.0.1 localhost localhost.localdomain`;
  if (options.netAddressType === "static") {
    text += `
${options.netAddress} ${options.hostname} ${options.hostname}.${options.domain} pvelocalhost`;
  } else {
    text +=`
127.0.1.1 localhost localhost.localdomain ${options.hostname} ${options.hostname}.${options.domain}`;
  }
  text += `
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

async function getIsLive() {
  let result;
  result = await execute(`./scripts/is_live.sh`);
  return result;
}

async function rsync(target) {
  let cmd="";
  cmd=`
  rsync -aq  \
  --delete-before  \
  --delete-excluded  \ ${filters} / ${target}`;
  console.log("cloning egg to system...");
  shell.exec(cmd.trim(), { async: false });
}

async function mkfs(devices) {
  let result = true;
  await execute(`mkfs -t ${devices.root.fstype} ${devices.root.device}`);
  await execute(`mkfs -t ${devices.boot.fstype} ${devices.boot.device}`);
  await execute(`mkfs -t ${devices.data.fstype} ${devices.data.device}`);
  await execute(`mkswap ${devices.swap.device}`);
  return result;
}

async function mount(target, devices) {
  await execute(`mkdir ${target}`);
  await execute(`mount ${devices.root.device} ${target}`);
  await execute(`tune2fs -c 0 -i 0 ${devices.root.device}`);
  await execute(`rm -rf ${target}/lost+found`);

  await execute(`mkdir ${target}/boot`);
  await execute(`mount ${devices.boot.device} ${target}/boot`);
  await execute(`tune2fs -c 0 -i 0 ${devices.boot.device}`);

  await execute(`mkdir -p ${target}/var/lib/vz`);
  await execute(`mount ${devices.data.device} ${target}/var/lib/vz`);
  await execute(`tune2fs -c 0 -i 0 ${devices.data.device}`);
  await execute(`rm -rf ${target}/var/lib/vz/lost+found`);

  return true;
}
async function tune2fs(target, devices) {}

async function umount(target, devices) {
  await execute(`umount ${devices.data.device} ${target}/var/lib/vz`);
  await execute(`umount ${devices.boot.device} ${target}boot`);
  await execute(`umount ${devices.root.device} ${target}`);
  await execute(`rmdir ${target} -rf`);
  return true;
}

async function diskPreparePve(device) {
  await execute(`${utils.path()}/scripts/disk_prepare_pve.sh ${device}`);
  return true;
}

async function diskPreparePartitionLvm(device, sizeMb) {
  console.log(`disk_prepare_partition_lvm.sh ${device} ${sizeMb}`);
  await execute(`${utils.path()}/scripts/disk_prepare_partition_lvm.sh ${device} ${sizeMb}`);
  return true;
}
async function diskPreparePartitionBoot(device) {
  await execute(`${utils.path()}/scripts/disk_prepare_partition_boot.sh ${device}`);
  return true;
}

async function diskPrepare(device) {
  await execute(`${utils.path()}/scripts/disk_prepare.sh ${device}`);
  return true;
}

async function getDiskSize(device) {
  let result = "";
  result = await execute(`${utils.path()}/scripts/disk_get_size.sh ${device}`);
  result = result.replace("B", "").trim();
  return result;
}

function execute(command) {
  return new Promise(function(resolve, reject) {
    var exec = require("child_process").exec;
    exec(command, function(error, stdout, stderr) {
      resolve(stdout);
    });
  });
}

function getDrives() {
  return new Promise(function(resolve, reject) {
    let aDriveList = [];
    drivelist.list((error, drives) => {
      if (error) {
        reject(error);
      }
      for (var key in drives) {
        aDriveList.push(drives[key].device);
      }
      resolve(aDriveList);
    });
  });
}

async function getOptions(driveList) {
  return new Promise(function(resolve, reject) {
    var questions = [
      {
        type: "input",
        name: "username",
        message: "user name: ",
        default: "artisan"
      },
      {
        type: "input",
        name: "userfullname",
        message: "user full name: ",
        default: "artisan"
      },
      {
        type: "password",
        name: "userpassword",
        message: "Enter a password for the user :",
        default: "evolution"
      },
      {
        type: "list",
        name: "autologin",
        message: "Did you want autolongin :",
        choices: ["Yes", "No"],
        default: "Yes"
      },
      {
        type: "password",
        name: "rootpassword",
        message: "Enter a password for root :",
        default: "evolution"
      },
      {
        type: "input",
        name: "hostname",
        message: "hostname: ",
        default: os.hostname
      },
      {
        type: "input",
        name: "domain",
        message: "domain name: ",
        default: "lan"
      },
      {
        type: "list",
        name: "netInterface",
        message: "Select the network interface: ",
        choices: ifaces
      },
      {
        type: "list",
        name: "netAddressType",
        message: "Select the network type: ",
        choices: ["dhcp", "static"],
        default: "dhcp"
      },
      {
        type: "input",
        name: "netAddress",
        message: "Insert IP address: ",
        default: "192.168.0.2",
        when: function(answers) {
          return answers.netAddressType === "static";
        }
      },
      {
        type: "input",
        name: "netMask",
        message: "Insert netmask: ",
        default: "255.255.255.0",
        when: function(answers) {
          return answers.netAddressType === "static";
        }
      },
      {
        type: "input",
        name: "netGateway",
        message: "Insert gateway: ",
        default: "192.168.0.1",
        when: function(answers) {
          return answers.netAddressType === "static";
        }
      },
      {
        type: "input",
        name: "netDns",
        message: "Insert DNS: ",
        default: "192.168.0.1",
        when: function(answers) {
          return answers.netAddressType === "static";
        }
      },
      {
        type: "list",
        name: "installationDevice",
        message: "Select the installation disk: ",
        choices: driveList,
        default: driveList[0]
      },
      {
        type: "list",
        name: "fsType",
        message: "Select format type: ",
        choices: ["ext2", "ext3", "ext4"],
        default: "ext4"
      }
    ];
    inquirer.prompt(questions).then(function(options) {
      resolve(JSON.stringify(options));
    });
  });
}

var ifaces = fs.readdirSync("/sys/class/net/");
