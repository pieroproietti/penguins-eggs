/*
  penguins-eggs: hatch.js
  author: Piero Proietti
  mail: piero.proietti@gmail.com

  https://codeburst.io/how-to-build-a-command-line-app-in-node-js-using-typescript-google-cloud-functions-and-firebase-4c13b1699a27

  */
"use strict";

import shell from "shelljs";
import fs from "fs";
import os from "os";
import inquirer from "inquirer";
import drivelist from "drivelist";

import utils from "./utils";
import filters from "./filters";
import { IDevice, IDevices, IDriveList } from "../interfaces";
import { description } from "pjson";

export async function hatch() {
  let target = "/TARGET";
  let devices = {} as IDevices;
  devices.root = {} as IDevice;
  devices.boot = {} as IDevice;
  devices.data = {} as IDevice;
  devices.swap = {} as IDevice;

  devices.root.device = "/dev/penguin/root";
  devices.root.fsType = "ext4";
  devices.root.mountPoint = "/";
  devices.boot.device = "/dev/sda1";
  devices.boot.fsType = "ext2";
  devices.boot.mountPoint = "/boot";
  devices.data.device = "/dev/penguin/data";
  devices.data.fsType = "ext4";
  devices.data.mountPoint = "/var/lib/vz";
  devices.swap.device = "/dev/penguin/swap";
  devices.swap.fsType = "swap";
  devices.swap.mountPoint = "none";

  let driveList: string[]=[];
  await drivelist.list(
    (error: boolean, drives: IDriveList[]) => {
      if (error) {
        throw error;
      }
      let aDrives: string[] = [];

      drives.forEach((drive) => {
        driveList.push(drive.device);
      });
   });
  

  let varOptions: any =  await getOptions(driveList);
  let options: any = JSON.parse(varOptions);

  // default mount /var/lib/pve
  if (options.mountType == "workstation") {
    devices.data.mountPoint = "/home";
  } else if (options.mountType == "docker") {
    devices.data.mountPoint = "/var/lib/docker";
  } else if (options.mountType == "www") {
    devices.data.mountPoint = "/var/www";
  }

  let isDiskPrepared: boolean;
  isDiskPrepared = await diskPrepare(options.installationDevice);

  let diskSize: number;
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
  await updateInitramfs(target); // path per problema LVM resume
  //await purge(target);
  await umount4chroot(target);
  await umount4target(target, devices);
  await rm4target();
}

async function grubInstall(target: string, options: any) {
  console.log("grub-install");
  await execute(`chroot ${target} grub-install ${options.installationDevice}`);
  console.log("update-grub");
  await execute(`chroot ${target} update-grub`);
}

async function mkinitramfs(target: string) {
  console.log("mkinitramfs");
  await execute(
    `chroot ${target} mkinitramfs -k -o /tmp/initramfs-$(uname -r)`
  );
  await execute(`cp ${target}/tmp/initramfs-$(uname -r) /TARGET/boot`);
}

async function updateInitramfs(target: string) {
  console.log("updateInitramfs");
  await execute(`chroot ${target} update-initramfs -u`);
}


async function mount4chroot(target: string) {
  console.log("mount4chroot");
  await execute(`mount -o bind /dev ${target}/dev`);
  await execute(`mount -o bind /devpts ${target}/dev/pts`);
  await execute(`mount -o bind /proc ${target}/proc`);
  await execute(`mount -o bind /dev ${target}/dev`);
  await execute(`mount -o bind /sys ${target}/sys`);
  await execute(`mount -o bind /run ${target}/run`);
}

async function umount4chroot(target: string) {
  console.log("umount4chroot");
  await execute(`umount ${target}/dev/pts`);
  await execute(`sleep 1`);
  await execute(`umount ${target}/proc`);
  await execute(`sleep 1`);
  await execute(`umount ${target}/sys`);
  await execute(`sleep 1`);
  await execute(`umount ${target}/run`);
  await execute(`sleep 1`);
  await execute(`umount ${target}/dev`);
  await execute(`sleep 1`);
}

async function fstab(target: string, devices: IDevices) {
  let file = `${target}/etc/fstab`;
  let text = `
proc /proc proc defaults 0 0
${devices.root.device} ${devices.root.mountPoint} ${devices.root.fsType} relatime,errors=remount-ro 0 1
${devices.boot.device} ${devices.boot.mountPoint} ${devices.boot.fsType} relatime 0 0
${devices.data.device} ${devices.data.mountPoint} ${devices.data.fsType} relatime 0 0
${devices.swap.device} ${devices.swap.mountPoint} ${devices.swap.fsType} sw 0 0`;

  utils.bashWrite(file, text);
}

async function hostname(target: string, options: any) {
  let file = `${target}/etc/hostname`;
  let text = options.hostname;

  utils.exec(`rm ${target}/etc/hostname`);
  fs.writeFileSync(file, text);
}

async function resolvConf(target: string, options: any) {
  if (options.netAddressType === "static") {
    let file = `${target}/etc/resolv.conf`;
    let text = `
search ${options.domain}
domain ${options.domain}
nameserver ${options.netDns}
nameserver 8.8.8.8
nameserver 8.8.4.4
`;
    utils.bashWrite(file, text);
  }
}

async function interfaces(target: string, options: any) {
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

    utils.bashWrite(file, text);
  }
}

async function hosts(target: string, options: any) {
  let file = `${target}/etc/hosts`;
  let text = `127.0.0.1 localhost localhost.localdomain`;
  if (options.netAddressType === "static") {
    text += `
${options.netAddress} ${options.hostname} ${options.hostname}.${options.domain} pvelocalhost`;
  } else {
    text += `
127.0.1.1 ${options.hostname} ${options.hostname}.${options.domain}`;
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

  utils.bashWrite(file, text);
}

async function getIsLive(): Promise<string> {
  let result;
  result = await execute(`./scripts/is_live.sh`);
  return result;
}

async function rsync(target: string): Promise<void> {
  let cmd = "";
  cmd = `
  rsync -aq  \
  --delete-before  \
  --delete-excluded  \ ${filters} / ${target}`;
  console.log("hatching the egg...");
  shell.exec(cmd.trim(), {
    async: false
  });
}

async function mkfs(devices: IDevices): Promise<boolean> {
  let result = true;
  await execute(`mkfs -t ${devices.root.fsType} ${devices.root.device}`);
  await execute(`mkfs -t ${devices.boot.fsType} ${devices.boot.device}`);
  await execute(`mkfs -t ${devices.data.fsType} ${devices.data.device}`);
  await execute(`mkswap ${devices.swap.device}`);
  return result;
}

async function mount(target: string, devices: IDevices): Promise<boolean> {
  await execute(`mkdir ${target}`);
  await execute(`mount ${devices.root.device} ${target}`);
  await execute(`tune2fs -c 0 -i 0 ${devices.root.device}`);
  await execute(`rm -rf ${target}/lost+found`);

  await execute(`mkdir ${target}/boot`);
  await execute(`mount ${devices.boot.device} ${target}/boot`);
  await execute(`tune2fs -c 0 -i 0 ${devices.boot.device}`);

  await execute(`mkdir -p ${target}${devices.data.mountPoint}`);
  await execute(
    `mount ${devices.data.device} ${target}${devices.data.mountPoint}`
  );
  await execute(`tune2fs -c 0 -i 0 ${devices.data.device}`);
  await execute(`rm -rf ${target}${devices.data.mountPoint}/lost+found`);

  return true;
}
async function tune2fs(target: string, devices: IDevices): Promise<boolean> {
  return true;
}

async function umount4target(target: string, devices: IDevices): Promise<boolean> {
  console.log("umount4target");
  //await execute(`umount ${devices.data.device} ${target}${devices.data.mountPoint}`);
  await execute(`umount ${devices.data.device}`);
  await execute(`umount ${devices.boot.device} ${target}boot`);
  await execute(`umount ${devices.root.device} ${target}`);
  await execute(`rmdir ${target} -rf`);
  return true;
}

async function rm4target(): Promise<boolean> {
  console.log("rm4target");
  await execute(`rm /TARGET -rf`);
  return true;
}

async function diskPreparePve(device: string): Promise<boolean> {
  await execute(`${utils.path()}/scripts/disk_prepare_pve.sh ${device}`);
  return true;
}

async function diskPreparePartitionLvm(device: string, sizeMb: number): Promise<boolean> {
  console.log(`disk_prepare_partition_lvm.sh ${device} ${sizeMb}`);
  await execute(
    `${utils.path()}/scripts/disk_prepare_partition_lvm.sh ${device} ${sizeMb}`
  );
  return true;
}
async function diskPreparePartitionBoot(device: string): Promise<boolean> {
  await execute(
    `${utils.path()}/scripts/disk_prepare_partition_boot.sh ${device}`
  );
  return true;
}

async function diskPrepare(device: string) {
  await execute(`${utils.path()}/scripts/disk_prepare.sh ${device}`);
  return true;
}

async function getDiskSize(device: string): Promise<number> {
  let response: string;
  let bytes: number;

  response = await execute(`${utils.path()}/scripts/disk_get_size.sh ${device}`);
  response = response.replace("B", "").trim();
  bytes = Number(response);
  return bytes;
}

function execute(command: string): Promise<string> {
  return new Promise(function (resolve, reject) {
    var exec = require("child_process").exec;
    exec(command, function (error: string, stdout: string, stderr: string) {
      resolve(stdout);
    });
  });
}

async function getOptions(driveList: string[]): Promise<any> {
  return new Promise(function (resolve, reject) {
    let questions: Array<Object> = [
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
        message: "Enter a password for the user: ",
        default: "evolution"
      },
      {
        type: "list",
        name: "autologin",
        message: "Did you want autolongin: ",
        choices: ["Yes", "No"],
        default: "Yes"
      },
      {
        type: "password",
        name: "rootpassword",
        message: "Enter a password for root: ",
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
        when: function (answers: any) {
          return answers.netAddressType === "static";
        }
      },
      {
        type: "input",
        name: "netMask",
        message: "Insert netmask: ",
        default: "255.255.255.0",
        when: function (answers: any) {
          return answers.netAddressType === "static";
        }
      },
      {
        type: "input",
        name: "netGateway",
        message: "Insert gateway: ",
        default: utils.netGateway(),
        when: function (answers: any) {
          return answers.netAddressType === "static";
        }
      },
      {
        type: "input",
        name: "netDns",
        message: "Insert DNS: ",
        default: utils.netDns(),
        when: function (answers: any) {
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
        name: "mountType",
        message: "Select the tipology: ",
        choices: ["workstation", "docker", "pve", "www"],
        default: "workstation"
      },
      {
        type: "list",
        name: "fsType",
        message: "Select format type: ",
        choices: ["ext2", "ext3", "ext4"],
        default: "ext4"
      }
    ];

    inquirer.prompt(questions).then(function (options) {
      resolve(JSON.stringify(options));
    });
  });
}

var ifaces: string[] = fs.readdirSync("/sys/class/net/");
