/**
 * penguins-eggs: Prerequisites.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = __importDefault(require("../lib/utils"));
class Prerequisites {
    constructor(o) {
        this.o = o;
    }
    // Methods
    async install() {
        console.log(`Prerequisites: ${this.o.distroLike}`);
        if (this.o.distroLike === "Debian") {
            this.debian();
        }
        else if (this.o.distroLike === "Ubuntu") {
            this.debian();
        }
    }
    async debian() {
        console.log(">>> eggs: Installing the prerequisites packages...");
        utils_1.default.execute(`apt-get update`);
        utils_1.default.execute(`apt-get --yes install \
                            lvm2 \
                            parted \
                            squashfs-tools \
                            xorriso \
                            syslinux \
                            isolinux \
                            live-boot \
                            calamares \
                            calamares-settings-debian \
                            qml-module-qtquick2 \
                            qml-module-qtquick-controls`);
        utils_1.default.execute(`apt-get clean`);
        utils_1.default.execute(`apt-get autoclean`);
    }
}
exports.default = Prerequisites;
