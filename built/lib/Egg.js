/*
  penguins-eggs: Eggs.js
  author: Piero Proietti
  mail: piero.proietti@gmail.com
*/
"use strict";

var __importDefault = undefined && undefined.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const shelljs_1 = __importDefault(require("shelljs"));
const utils_1 = __importDefault(require("./utils"));
const filters_1 = __importDefault(require("./filters"));
class Egg {
    constructor(workDir, distro, net, user, root) {
        this.distro = {};
        this.net = {};
        this.user = {};
        this.root = {};
        if (workDir == undefined) {
            this.workDir = "/var/lib/vz/eggs/";
        } else {
            this.workDir = workDir;
        }
        if (distro == undefined) {
            this.distro.name = 'penguin';
        } else {
            this.distro.name = distro.name;
        }
        this.distro.kernel = utils_1.default.kernerlVersion();
        this.distro.pathHome = workDir + `${this.distro.name}`;
        this.distro.pathFs = this.distro.pathHome + `/fs`;
        this.distro.pathIso = this.distro.pathHome + `/iso`;
        if (net == undefined) {
            this.net.dhcp = false;
            this.net.address = "192.168.61.100";
            this.net.netmask = "255.255.255.0";
            this.net.gateway = "192.168.61.1";
        } else {
            this.net.dhcp = net.dhcp;
            this.net.address = net.address;
            this.net.netmask = net.netmask;
            this.net.gateway = net.gateway;
        }
        this.net.name = utils_1.default.netDeviceName();
        this.net.domainName = "lan";
        this.net.dnsAddress = utils_1.default.netDns();
        if (user == undefined) {
            this.user.name = "artisan";
            this.user.fullName = "Artisan";
            this.user.password = "evolution";
        } else {
            this.user.name = user.name;
            this.user.fullName = user.fullName;
            this.user.password = user.password;
        }
        if (root == undefined) {
            this.root.name = "root";
            this.root.fullName = "root";
            this.root.password = "evolution";
        } else {
            this.root.name = user.name;
            this.root.fullName = user.fullName;
            this.root.password = user.password;
        }
    }
    async kill() {
        console.log("==========================================");
        console.log("eggs kill");
        console.log("==========================================");
        utils_1.default.exec(`rm -rf ${this.distro.pathHome}`);
    }
    // Check or create a nest
    async spawn() {
        console.log("==========================================");
        console.log("eggs spawn");
        console.log("==========================================");
        if (!fs_1.default.existsSync(this.distro.pathHome)) {
            utils_1.default.exec(`mkdir -p ${this.distro.pathHome}`);
            //utils.exec(`ln -s ${this.distro.pathHome} /srv/penguins-eggs`);
        }
        if (fs_1.default.existsSync(this.distro.pathFs)) {
            // Remove and create /var ed /etc
            utils_1.default.exec(`rm -rf ${this.distro.pathFs}/var`);
            utils_1.default.exec(`mkdir -p ${this.distro.pathFs}/var`);
            utils_1.default.exec(`rm -rf ${this.distro.pathFs}/etc`);
            utils_1.default.exec(`mkdir -p ${this.distro.pathFs}/etc/live`);
        } else {
            utils_1.default.exec(`mkdir -p ${this.distro.pathFs}`);
            utils_1.default.exec(`mkdir -p ${this.distro.pathFs}/dev`);
            utils_1.default.exec(`mkdir -p ${this.distro.pathFs}/etc`);
            utils_1.default.exec(`mkdir -p ${this.distro.pathFs}/etc/intefaces`);
            utils_1.default.exec(`mkdir -p ${this.distro.pathFs}/etc/live`);
            utils_1.default.exec(`mkdir -p ${this.distro.pathFs}/proc`);
            utils_1.default.exec(`mkdir -p ${this.distro.pathFs}/sys`);
            utils_1.default.exec(`mkdir -p ${this.distro.pathFs}/media`);
            utils_1.default.exec(`mkdir -p ${this.distro.pathFs}/run`);
            utils_1.default.exec(`mkdir -p ${this.distro.pathFs}/var`);
            utils_1.default.exec(`mkdir -p ${this.distro.pathFs}/tmp`);
        }
    }
    async copy() {
        let cmd = "";
        cmd = `
    rsync -aq  \
    --filter="- ${this.distro.pathHome}"  \
    --delete-before  \
    --delete-excluded  \ ${filters_1.default} / ${this.distro.pathFs}`;
        console.log("spawning the system to egg...");
        //console.log(cmd.trim());
        shelljs_1.default.exec(cmd.trim(), {
            async: false
        });
    }
    async fstab() {
        let file = `${this.distro.pathFs}/etc/fstab`;
        let text = `
#proc /proc proc defaults 0 0
/dev/nfs / nfs defaults 1 1
`;
        utils_1.default.bashWrite(file, text);
    }
    async hostname() {
        utils_1.default.hostname(this.distro.pathFs, this.distro.name);
    }
    async resolvConf() {
        let file = `${this.distro.pathFs}/etc/resolv.conf`;
        let text = `
search ${this.net.domainName}
nameserver ${this.net.dnsAddress}
nameserver 8.8.8.8
nameserver 8.8.4.4
`;
        utils_1.default.bashWrite(file, text);
    }
    async interfaces() {
        let file = `${this.distro.pathFs}/etc/network/interfaces`;
        let text = `
auto lo
iface lo inet loopback
iface ${this.net.name} inet manual
`;
        utils_1.default.bashWrite(file, text);
    }
    async hosts() {
        let file = `${this.distro.pathFs}/etc/hosts`;
        let text = `
127.0.0.1 localhost.localdomain localhost
${this.net.address} ${this.distro.name}.${this.net.domainName} ${this.distro.name}
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
}
exports.default = Egg;
//# sourceMappingURL=Egg.js.map