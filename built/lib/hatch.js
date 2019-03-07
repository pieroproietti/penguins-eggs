/*
  penguins-eggs: hatch.js
  author: Piero Proietti
  mail: piero.proietti@gmail.com

  https://codeburst.io/how-to-build-a-command-line-app-in-node-js-using-typescript-google-cloud-functions-and-firebase-4c13b1699a27

  */
"use strict";

var __importDefault = undefined && undefined.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shelljs_1 = __importDefault(require("shelljs"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const inquirer_1 = __importDefault(require("inquirer"));
const drivelist_1 = __importDefault(require("drivelist"));
const utils_1 = __importDefault(require("./utils"));
const filters_1 = __importDefault(require("./filters"));
async function hatch() {
    let target = "/TARGET";
    let devices = {};
    devices.root = {};
    devices.boot = {};
    devices.data = {};
    devices.swap = {};
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
    let driveList = [];
    await drivelist_1.default.list((error, drives) => {
        if (error) {
            throw error;
        }
        let aDrives = [];
        drives.forEach(drive => {
            driveList.push(drive.device);
        });
    });
    let varOptions = await getOptions(driveList);
    let options = JSON.parse(varOptions);
    // default mount /var/lib/pve
    if (options.mountType == "workstation") {
        devices.data.mountPoint = "/home";
    } else if (options.mountType == "docker") {
        devices.data.mountPoint = "/var/lib/docker";
    } else if (options.mountType == "www") {
        devices.data.mountPoint = "/var/www";
    }
    let isDiskPrepared;
    isDiskPrepared = await diskPrepare(options.installationDevice);
    let diskSize;
    diskSize = await getDiskSize(options.installationDevice);
    console.log(`hatch diskSize: ${diskSize} Byte, equal at ${Math.round(diskSize / 1024 / 1024 / 1024)} GB`);
    let isPartitionBootPrepared;
    isPartitionBootPrepared = await diskPreparePartitionBoot(options.installationDevice);
    await diskPreparePartitionLvm(options.installationDevice, Math.floor(diskSize / 1024 / 1024));
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
}
exports.hatch = hatch;
async function grubInstall(target, options) {
    console.log("grub-install");
    await execute(`chroot ${target} grub-install ${options.installationDevice}`);
    console.log("update-grub");
    await execute(`chroot ${target} update-grub`);
}
async function mkinitramfs(target) {
    console.log("mkinitramfs");
    await execute(`chroot ${target} mkinitramfs -k -o /tmp/initramfs-$(uname -r)`);
    await execute(`cp ${target}/tmp/initramfs-$(uname -r) /TARGET/boot`);
}
async function updateInitramfs(target) {
    console.log("updateInitramfs");
    await execute(`chroot ${target} update-initramfs -u`);
}
async function mount4chroot(target) {
    console.log("mount4chroot");
    await execute(`mount -o bind /dev ${target}/dev`);
    await execute(`mount -o bind /devpts ${target}/dev/pts`);
    await execute(`mount -o bind /proc ${target}/proc`);
    await execute(`mount -o bind /dev ${target}/dev`);
    await execute(`mount -o bind /sys ${target}/sys`);
    await execute(`mount -o bind /run ${target}/run`);
}
async function umount4chroot(target) {
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
async function fstab(target, devices) {
    let file = `${target}/etc/fstab`;
    let text = `
proc /proc proc defaults 0 0
${devices.root.device} ${devices.root.mountPoint} ${devices.root.fsType} relatime,errors=remount-ro 0 1
${devices.boot.device} ${devices.boot.mountPoint} ${devices.boot.fsType} relatime 0 0
${devices.data.device} ${devices.data.mountPoint} ${devices.data.fsType} relatime 0 0
${devices.swap.device} ${devices.swap.mountPoint} ${devices.swap.fsType} sw 0 0`;
    utils_1.default.bashWrite(file, text);
}
async function hostname(target, options) {
    let file = `${target}/etc/hostname`;
    let text = options.hostname;
    utils_1.default.exec(`rm ${target}/etc/hostname`);
    fs_1.default.writeFileSync(file, text);
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
        utils_1.default.bashWrite(file, text);
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
        utils_1.default.bashWrite(file, text);
    }
}
async function hosts(target, options) {
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
    utils_1.default.bashWrite(file, text);
}
async function getIsLive() {
    let result;
    result = await execute(`./scripts/is_live.sh`);
    return result;
}
async function rsync(target) {
    let cmd = "";
    cmd = `
  rsync -aq  \
  --delete-before  \
  --delete-excluded  \ ${filters_1.default} / ${target}`;
    console.log("hatching the egg...");
    shelljs_1.default.exec(cmd.trim(), {
        async: false
    });
}
async function mkfs(devices) {
    let result = true;
    await execute(`mkfs -t ${devices.root.fsType} ${devices.root.device}`);
    await execute(`mkfs -t ${devices.boot.fsType} ${devices.boot.device}`);
    await execute(`mkfs -t ${devices.data.fsType} ${devices.data.device}`);
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
    await execute(`mkdir -p ${target}${devices.data.mountPoint}`);
    await execute(`mount ${devices.data.device} ${target}${devices.data.mountPoint}`);
    await execute(`tune2fs -c 0 -i 0 ${devices.data.device}`);
    await execute(`rm -rf ${target}${devices.data.mountPoint}/lost+found`);
    return true;
}
async function tune2fs(target, devices) {
    return true;
}
async function umount4target(target, devices) {
    console.log("umount4target");
    //await execute(`umount ${devices.data.device} ${target}${devices.data.mountPoint}`);
    await execute(`umount ${devices.data.device}`);
    await execute(`umount ${devices.boot.device} ${target}/boot`);
    await execute(`umount ${devices.root.device} ${target}`);
    await execute(`rmdir ${target} -rf`);
    return true;
}
async function diskPreparePve(device) {
    await execute(`${utils_1.default.path()}/scripts/disk_prepare_pve.sh ${device}`);
    return true;
}
async function diskPreparePartitionLvm(device, sizeMb) {
    console.log(`disk_prepare_partition_lvm.sh ${device} ${sizeMb}`);
    await execute(`${utils_1.default.path()}/scripts/disk_prepare_partition_lvm.sh ${device} ${sizeMb}`);
    return true;
}
async function diskPreparePartitionBoot(device) {
    await execute(`${utils_1.default.path()}/scripts/disk_prepare_partition_boot.sh ${device}`);
    return true;
}
async function diskPrepare(device) {
    await execute(`${utils_1.default.path()}/scripts/disk_prepare.sh ${device}`);
    return true;
}
async function getDiskSize(device) {
    let response;
    let bytes;
    response = await execute(`${utils_1.default.path()}/scripts/disk_get_size.sh ${device}`);
    response = response.replace("B", "").trim();
    bytes = Number(response);
    return bytes;
}
function execute(command) {
    return new Promise(function (resolve, reject) {
        var exec = require("child_process").exec;
        exec(command, function (error, stdout, stderr) {
            resolve(stdout);
        });
    });
}
async function getOptions(driveList) {
    return new Promise(function (resolve, reject) {
        let questions = [{
            type: "input",
            name: "username",
            message: "user name: ",
            default: "artisan"
        }, {
            type: "input",
            name: "userfullname",
            message: "user full name: ",
            default: "artisan"
        }, {
            type: "password",
            name: "userpassword",
            message: "Enter a password for the user: ",
            default: "evolution"
        }, {
            type: "list",
            name: "autologin",
            message: "Did you want autolongin: ",
            choices: ["Yes", "No"],
            default: "Yes"
        }, {
            type: "password",
            name: "rootpassword",
            message: "Enter a password for root: ",
            default: "evolution"
        }, {
            type: "input",
            name: "hostname",
            message: "hostname: ",
            default: os_1.default.hostname
        }, {
            type: "input",
            name: "domain",
            message: "domain name: ",
            default: "lan"
        }, {
            type: "list",
            name: "netInterface",
            message: "Select the network interface: ",
            choices: ifaces
        }, {
            type: "list",
            name: "netAddressType",
            message: "Select the network type: ",
            choices: ["dhcp", "static"],
            default: "dhcp"
        }, {
            type: "input",
            name: "netAddress",
            message: "Insert IP address: ",
            default: "192.168.0.2",
            when: function (answers) {
                return answers.netAddressType === "static";
            }
        }, {
            type: "input",
            name: "netMask",
            message: "Insert netmask: ",
            default: "255.255.255.0",
            when: function (answers) {
                return answers.netAddressType === "static";
            }
        }, {
            type: "input",
            name: "netGateway",
            message: "Insert gateway: ",
            default: utils_1.default.netGateway(),
            when: function (answers) {
                return answers.netAddressType === "static";
            }
        }, {
            type: "input",
            name: "netDns",
            message: "Insert DNS: ",
            default: utils_1.default.netDns(),
            when: function (answers) {
                return answers.netAddressType === "static";
            }
        }, {
            type: "list",
            name: "installationDevice",
            message: "Select the installation disk: ",
            choices: driveList,
            default: driveList[0]
        }, {
            type: "list",
            name: "mountType",
            message: "Select the tipology: ",
            choices: ["workstation", "docker", "pve", "www"],
            default: "workstation"
        }, {
            type: "list",
            name: "fsType",
            message: "Select format type: ",
            choices: ["ext2", "ext3", "ext4"],
            default: "ext4"
        }];
        inquirer_1.default.prompt(questions).then(function (options) {
            resolve(JSON.stringify(options));
        });
    });
}
var ifaces = fs_1.default.readdirSync("/sys/class/net/");
//# sourceMappingURL=hatch.js.map