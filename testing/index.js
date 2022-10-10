#!/usr/bin/pnpx ts-node
"use strict";
/**
 * run with: npx ts-node
 * #!/usr/bin/pnpx ts-node
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const utils_1 = tslib_1.__importDefault(require("../src/classes/utils"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const shelljs_1 = tslib_1.__importDefault(require("shelljs"));
const axios_1 = tslib_1.__importDefault(require("axios"));
const node_https_1 = tslib_1.__importDefault(require("node:https"));
const agent = new node_https_1.default.Agent({
    rejectUnauthorized: false
});
utils_1.default.titles('testing');
main();
// process.exit()
async function main() {
    let timezone = fs_1.default.readFileSync('/etc/timezone', 'utf8');
    let region = shelljs_1.default.exec('cut -f1 -d/ < /etc/timezone', { silent: true }).stdout.trim();
    let zone = shelljs_1.default.exec('cut -f2 -d/ < /etc/timezone', { silent: true }).stdout.trim();
    console.log('file region: ' + region);
    console.log('file zone: ' + zone);
    const url = `https://geoip.kde.org/v1/calamares`;
    try {
        const response = await axios_1.default.get(url);
        if (response.statusText === 'OK') {
            const data = JSON.stringify(response.data);
            const obj = JSON.parse(data);
            region = obj.time_zone.substring(0, obj.time_zone.indexOf('/'));
            zone = obj.time_zone.substring(obj.time_zone.indexOf('/') + 1);
        }
    }
    catch (error) {
        console.error('error: ' + error);
    }
    console.log('region: ' + region);
    console.log('zone: ' + zone);
}
