#!/usr/bin/npx ts-node
"use strict";
/**
 * run with: npx ts-node
 * #!/usr/bin/npx ts-node
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const js_yaml_1 = tslib_1.__importDefault(require("js-yaml"));
startPoint();
async function startPoint() {
    const toSort = './wardrobe.d/hen/index.yml';
    const sorted = './wardrobe.d/hen/index-sorted.yml';
    if (fs_1.default.existsSync(toSort)) {
        renum(toSort, sorted);
    }
    else {
        console.log(`not found: ${toSort}`);
    }
}
async function renum(pathOrig, pathSorted) {
    const orig = js_yaml_1.default.load(fs_1.default.readFileSync(pathOrig, 'utf-8'));
    let sorted = orig;
    sorted.name = orig.name;
    sorted.description = orig.description;
    sorted.author = orig.author;
    sorted.release = orig.release;
    sorted.distroId = orig.distroId;
    sorted.codenameId = orig.codenameId;
    sorted.releaseId = orig.release;
    sorted.applyTo = orig.applyTo;
    if (orig.sequence.repositories !== undefined) {
        sorted.sequence.repositories = orig.sequence.repositories;
    }
    if (orig.sequence.repositories.sourcesList !== undefined) {
        sorted.sequence.repositories.sourcesList = orig.sequence.repositories.sourcesList;
    }
    if (orig.sequence.repositories.sourcesListD !== undefined) {
        sorted.sequence.repositories.sourcesList = orig.sequence.repositories.sourcesList;
    }
    if (orig.sequence.dependencies !== undefined) {
        if (orig.sequence.dependencies[0] !== null) {
            sorted.sequence.dependencies = orig.sequence.dependencies.sort();
        }
    }
    if (orig.sequence.packages !== undefined) {
        if (orig.sequence.packages[0] !== null) {
            sorted.sequence.packages = orig.sequence.packages.sort();
        }
    }
    if (orig.sequence.noInstallRecommends !== undefined) {
        if (orig.sequence.noInstallRecommends[0] !== null) {
            sorted.sequence.noInstallRecommends = orig.sequence.noInstallRecommends.sort();
        }
    }
    if (orig.sequence.packagesPip !== undefined) {
        if (orig.sequence.packagesPip[0] !== null) {
            sorted.sequence.packagesPip = orig.sequence.packagesPip.sort();
        }
    }
    if (orig.sequence.firmwares !== undefined) {
        if (orig.sequence.firmwares.codecs !== undefined) {
            sorted.sequence.firmwares.codecs = orig.sequence.firmwares.codecs.sort();
        }
        if (orig.sequence.firmwares.drivers_graphics_tablet !== undefined) {
            sorted.sequence.firmwares.drivers_graphics_tablet = orig.sequence.firmwares.drivers_graphics_tablet.sort();
        }
        if (orig.sequence.firmwares.drivers_network !== undefined) {
            sorted.sequence.firmwares.drivers_network = orig.sequence.firmwares.drivers_network.sort();
        }
        if (orig.sequence.firmwares.drivers_various !== undefined) {
            sorted.sequence.firmwares.drivers_various = orig.sequence.firmwares.drivers_various.sort();
        }
        if (orig.sequence.firmwares.drivers_video_amd !== undefined) {
            sorted.sequence.firmwares.drivers_video_amd = orig.sequence.firmwares.drivers_video_amd.sort();
        }
        if (orig.sequence.firmwares.drivers_video_nvidia !== undefined) {
            sorted.sequence.firmwares.drivers_video_nvidia = orig.sequence.firmwares.drivers_video_nvidia.sort();
        }
        if (orig.sequence.firmwares.drivers_wifi !== undefined) {
            sorted.sequence.firmwares.drivers_wifi = orig.sequence.firmwares.drivers_wifi.sort();
        }
        if (orig.sequence.firmwares.drivers_printer !== undefined) {
            sorted.sequence.firmwares.drivers_printer = orig.sequence.firmwares.drivers_printer.sort();
        }
    }
    sorted.sequence.debs = orig.sequence.debs;
    sorted.sequence.dirs = orig.sequence.dirs;
    sorted.sequence.hostname = orig.sequence.hostname;
    if (orig.sequence.customizations !== undefined) {
        if (orig.sequence.customizations.scripts[0] !== null) {
        }
    }
    sorted.sequence.reboot = sorted.sequence.reboot;
    console.log(js_yaml_1.default.dump(sorted));
}
