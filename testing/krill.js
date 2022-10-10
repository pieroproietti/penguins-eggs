#!/usr/bin/pnpx ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const js_yaml_1 = tslib_1.__importDefault(require("js-yaml"));
const utils_1 = tslib_1.__importDefault(require("../src/classes/utils"));
start();
/**
 *
 */
async function start() {
    let echoYes = utils_1.default.setEcho(true);
    const config_file = `/etc/calamares/modules/packages.conf`;
    if (fs_1.default.existsSync(config_file)) {
        const packages = js_yaml_1.default.load(fs_1.default.readFileSync(config_file, 'utf-8'));
        console.log(packages);
        let operations = JSON.parse(JSON.stringify(packages.operations));
        console.log(operations);
        let packagesToRemove = [];
        let packagesToInstall = [];
        console.log("operation.lenght:" + operations.length);
        if (operations.length > 1) {
            packagesToRemove = operations[0].remove;
            packagesToInstall = operations[1].try_install;
        }
        else {
            packagesToInstall = operations[0].try_install;
        }
        console.log("packageToInstall: " + packagesToInstall);
        console.log("packageToRemove: " + packagesToRemove);
        if (packages.backend === 'apt') {
            if (packagesToRemove.length > 0) {
                let ctr = `chroot apt-get purge -y `;
                for (const packageToRemove of packagesToRemove) {
                    ctr += packageToRemove + ' ';
                }
                console.log(`${ctr}`);
                console.log(`apt-get autoremove -y `);
            }
            for (const packageToInstall of packagesToInstall) {
                console.log(`apt-get purge -y ${packageToInstall} `);
            }
        }
        else if (packages.backend === 'pacman') {
            if (packagesToRemove !== undefined) {
                let ctr = `chroot  pacman -S `;
                for (const packageToRemove of packagesToRemove) {
                    ctr += packageToRemove + ' ';
                }
                console.log(`${ctr}`);
            }
            if (packagesToInstall !== undefined) {
                for (const packageToInstall of packagesToInstall) {
                    console.log(`pacman -S ${packageToInstall}`);
                }
            }
        }
    }
}
