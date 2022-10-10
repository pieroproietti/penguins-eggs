#!/usr/bin/pnpx ts-node
"use strict";
/**
 * run with: pnpx ts-node
 * #!/usr/bin/npx ts-node
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const utils_1 = tslib_1.__importDefault(require("../src/classes/utils"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const ini_1 = tslib_1.__importDefault(require("ini"));
startPoint();
async function startPoint() {
    utils_1.default.titles('test');
    const dirConf = '/etc/lightdm/';
    let confs = fs_1.default.readdirSync(dirConf);
    for (const conf of confs) {
        if (conf === 'lightdm.conf') {
            console.log('\nconf: ' + conf);
            let fc = dirConf + conf;
            console.log(fs_1.default.readFileSync(fc, 'utf-8'));
            let config = ini_1.default.parse(fs_1.default.readFileSync(fc, 'utf-8'));
            console.log("autologin-user: " + config["Seat:*"]["autologin-user"]);
        }
    }
}
