/**
 * penguins-eggs: hatch.js
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 * https://codeburst.io/how-to-build-a-command-line-app-in-node-js-using-typescript-google-cloud-functions-and-firebase-4c13b1699a27
 *
 */
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
    devices.swap = {};
    let driveList = [];
    await drivelist_1.default.list((error, drives) => {
        if (error) {
            throw error;
        }
        let aDrives = [];
        drives.forEach((drive) => {
            driveList.push(drive.device);
        });
    });
    let varOptions = await getOptions(driveList);
    let options = JSON.parse(varOptions);
    devices.root.device = `${options.installationDevice}1`;
    devices.root.fsType = `ext4`;
    devices.root.mountPoint = `/`;
    devices.swap.device = `${options.installationDevice}2`;
    devices.swap.fsType = `swap`;
    devices.swap.mountPoint = `none`;
    let diskSize;
    diskSize = getDiskSize(options.installationDevice);
    console.log(`diskSize: ${diskSize}`);
    let isDiskPrepared;
    isDiskPrepared = await diskPartition(options.installationDevice);
    if (isDiskPrepared) {
        await mkfs(devices);
        await mount4target(target, devices);
        await rsync(target);
        await fstab(target, devices);
        await hostname(target, options);
        await resolvConf(target, options);
        await interfaces(target, options);
        await hosts(target, options);
        await mountVFS(target);
        await mkinitramfs(target);
        await grubInstall(target, options);
        await utils_1.default.addUser(options.username, options.userpassword);
        await utils_1.default.changePassword(`root`, options.rootpassword);
        await delUserLive();
        await patchPve(target);
        await umountVFS(target);
        await umount4target(target, devices);
    }
}
exports.hatch = hatch;
/**
 * delUserLive
 */
async function delUserLive() {
    console.log("Cancellazione utente live. Da fare!\n");
}
/**
 * patchPve patch per proxypve che non crea la directory
 *          e che ricrea i codici di ssh della macchina
 * @param target
 */
async function patchPve(target) {
    // patch per apache2
    await utils_1.default.execute(`chroot ${target} mkdir /var/log/apache2`);
    await utils_1.default.execute(`chroot ${target} mkdir /var/log/pveproxy`);
    await utils_1.default.execute(`chroot ${target} touch /var/log/pveproxy/access.log`);
    await utils_1.default.execute(`chroot ${target} chown www-data:www-data /var/log/pveproxy -R`);
    await utils_1.default.execute(`chroot ${target} chmod 0664 /var/log/pveproxy/access.log`);
    await utils_1.default.execute(`chroot ${target} dpkg-reconfigure openssh-server`);
}
/**
 * grubInstall()
 * @param target
 * @param options
 */
async function grubInstall(target, options) {
    console.log("grub-install");
    await utils_1.default.execute(`chroot ${target} grub-install ${options.installationDevice}`);
    console.log("update-grub");
    await utils_1.default.execute(`chroot ${target} update-grub`);
}
/**
 * mkinitramfs()
 * @param target
 */
async function mkinitramfs(target) {
    console.log("mkinitramfs");
    /*
    await utils.execute(
      `chroot ${target} mkinitramfs -k -o /tmp/initramfs-$(uname -r)`
    );*/
    await utils_1.default.execute(`chroot ${target} live-update-initramfs -k -o /tmp/initramfs-$(uname -r)`);
    await utils_1.default.execute(`cp ${target}/tmp/initramfs-$(uname -r) /TARGET/boot`);
}
/**
 * updateInitramfs()
 * @param target
 */
async function updateInitramfs(target) {
    console.log("updateInitramfs");
    await utils_1.default.execute(`chroot ${target} update-initramfs -u`);
}
/**
 * mountVFS()
 * @param target
 */
async function mountVFS(target) {
    console.log("mount VFS");
    await utils_1.default.execute(`mount -o bind /dev ${target}/dev`);
    await utils_1.default.execute(`mount -o bind /devpts ${target}/dev/pts`);
    await utils_1.default.execute(`mount -o bind /proc ${target}/proc`);
    await utils_1.default.execute(`mount -o bind /sys ${target}/sys`);
    await utils_1.default.execute(`mount -o bind /run ${target}/run`);
}
/**
 * umountVFS()
 * @param target
 */
async function umountVFS(target) {
    console.log("umount VFS");
    await utils_1.default.execute(`umount ${target}/dev/pts`);
    await utils_1.default.execute(`sleep 1`);
    await utils_1.default.execute(`umount ${target}/dev`);
    await utils_1.default.execute(`sleep 1`);
    await utils_1.default.execute(`umount ${target}/proc`);
    await utils_1.default.execute(`sleep 1`);
    await utils_1.default.execute(`umount ${target}/sys`);
    await utils_1.default.execute(`sleep 1`);
    await utils_1.default.execute(`umount ${target}/run`);
    await utils_1.default.execute(`sleep 1`);
}
/**
 * fstab()
 * @param target
 * @param devices
 */
async function fstab(target, devices) {
    let file = `${target}/etc/fstab`;
    let text = `
proc /proc proc defaults 0 0
${devices.root.device} ${devices.root.mountPoint} ${devices.root.fsType} relatime,errors=remount-ro 0 1
${devices.swap.device} ${devices.swap.mountPoint} ${devices.swap.fsType} sw 0 0`;
    utils_1.default.bashWrite(file, text);
}
/**
 * hostname()
 * @param target
 * @param options
 */
async function hostname(target, options) {
    let file = `${target}/etc/hostname`;
    let text = options.hostname;
    utils_1.default.exec(`rm ${target}/etc/hostname`);
    fs_1.default.writeFileSync(file, text);
}
/**
 * resolvConf()
 * @param target
 * @param options
 */
async function resolvConf(target, options) {
    console.log(`tipo di resolv.con: ${options.netAddressType}`);
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
/**
 *
 * auto lo
 *
 * interfaces()
 * @param target
 * @param options
 */
async function interfaces(target, options) {
    if (options.netAddressType === "static") {
        let file = `${target}/etc/network/interfaces`;
        let text = `
auto lo
iface lo inet manual

auto ${options.netInterface}
iface ${options.netInterface} inet manual

auto vmbr0 
iface vmbr0 inet ${options.netAddressType} static
    address ${options.netAddress}
    netmask ${options.netMask}
    gateway ${options.netGateway}
    bridge-ports ${options.netInterface}
    bridge-stp off
    bridge-fd 0

auto loopback
iface loopback inet manual
    
auto manual
iface manual inet manual`;
        utils_1.default.bashWrite(file, text);
    }
}
/**
 * hosts()
 * @param target
 * @param options
 */
async function hosts(target, options) {
    let file = `${target}/etc/hosts`;
    let text = `127.0.0.1 localhost localhost.localdomain`;
    if (options.netAddressType === "static") {
        text += `
${options.netAddress} ${options.hostname} ${options.hostname}.${options.domain} pvelocalhost`;
    }
    else {
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
/**
 * rsync()
 * @param target
 */
async function rsync(target) {
    let cmd = "";
    cmd = `
  rsync -aq  \
  --progress \
  --delete-before  \
  --delete-excluded  \ ${filters_1.default} / ${target}`;
    console.log("hatching the egg...");
    shelljs_1.default.exec(cmd.trim(), {
        async: false
    });
}
async function mkfs(devices) {
    let result = true;
    // devices.root.fsType=`ext4`;
    await utils_1.default.execute(`mkfs -t ${devices.root.fsType} ${devices.root.device}`);
    await utils_1.default.execute(`mkswap ${devices.swap.device}`);
    return result;
}
async function mount4target(target, devices) {
    await utils_1.default.execute(`mkdir ${target}`);
    await utils_1.default.execute(`mount ${devices.root.device} ${target}`);
    await utils_1.default.execute(`tune2fs -c 0 -i 0 ${devices.root.device}`);
    await utils_1.default.execute(`rm -rf ${target}/lost+found`);
    return true;
}
async function tune2fs(target, devices) {
    return true;
}
async function umount4target(target, devices) {
    console.log("umount4target");
    await utils_1.default.execute(`umount ${devices.root.device} ${target}`);
    await utils_1.default.execute(`sleep 1`);
    //await utils.execute(`rm -rf ${target}/home`);
    //await utils.execute(`rm -rf ${target}/boot`);
    //await utils.execute(`rm -rf ${target}`);
    return true;
}
async function diskPartition(device) {
    await utils_1.default.execute(`parted --script ${device} mklabel msdos`);
    await utils_1.default.execute(`parted --script --align optimal ${device} mkpart primary 1MiB 95%`);
    await utils_1.default.execute(`parted --script ${device} set 1 boot on`);
    await utils_1.default.execute(`parted --script --align optimal ${device} mkpart primary 95% 100%`);
    return true;
}
async function getDiskSize(device) {
    let response;
    let bytes;
    response = await utils_1.default.execute(`parted -s ${device} unit b print free | grep Free | awk '{print $3}' | cut -d "M" -f1`);
    response = response.replace("B", "").trim();
    bytes = Number(response);
    return bytes;
}
/**
 *
 * @param driveList
 */
async function getOptions(driveList) {
    return new Promise(function (resolve, reject) {
        let questions = [
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
                default: os_1.default.hostname
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
                default: "192.168.61.100",
                when: function (answers) {
                    return answers.netAddressType === "static";
                }
            },
            {
                type: "input",
                name: "netMask",
                message: "Insert netmask: ",
                default: "255.255.255.0",
                when: function (answers) {
                    return answers.netAddressType === "static";
                }
            },
            {
                type: "input",
                name: "netGateway",
                message: "Insert gateway: ",
                default: utils_1.default.netGateway(),
                when: function (answers) {
                    return answers.netAddressType === "static";
                }
            },
            {
                type: "input",
                name: "netDns",
                message: "Insert DNS: ",
                default: utils_1.default.netDns(),
                when: function (answers) {
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
        inquirer_1.default.prompt(questions).then(function (options) {
            resolve(JSON.stringify(options));
        });
    });
}
var ifaces = fs_1.default.readdirSync("/sys/class/net/");
