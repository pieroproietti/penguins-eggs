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
        console.log("eggs kill: rm -rf ${this.distro.pathHome}");
        console.log("==========================================");
        utils_1.default.exec(`rm -rf ${this.distro.pathHome}`);
    }
    // Check or create a nest
    async createStructure() {
        console.log("==========================================");
        console.log("eggs: createStructure");
        console.log("==========================================");
        if (!fs_1.default.existsSync(this.distro.pathHome)) {
            utils_1.default.exec(`mkdir -p ${this.distro.pathHome}`);
            //utils.exec(`ln -s ${this.distro.pathHome} /srv/penguins-eggs`);
        }
        if (!fs_1.default.existsSync(this.distro.pathFs)) {
            //utils.exec(`rm -rf ${this.distro.pathFs}`);
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
    async systemCopy() {
        let cmd = "";
        cmd = `
    rsync -aq  \
    --filter="- ${this.distro.pathHome}"  \
    --delete-before  \
    --delete-excluded  \ ${filters_1.default} / ${this.distro.pathFs}`;
        console.log("==========================================");
        console.log("eggs: systemCopy");
        console.log("==========================================");
        // console.log(cmd.trim());
        shelljs_1.default.exec(cmd.trim(), {
            async: false
        });
    }
}
exports.default = Egg;
//# sourceMappingURL=Egg.js.map