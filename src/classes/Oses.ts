/**
 * penguins-eggs: Oses.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

"use strict";
import fs from "fs";
import { IDistro } from "../interfaces";

import utils from "../lib/utils";


import shell from "shelljs";

class Oses {
    info(): any {
        enum info { HOME_URL, SUPPORT_URL, BUG_REPORT_URL };

        let os: Array<string> = new Array();
        os[info.HOME_URL] = "HO ME_URL=";
        os[info.SUPPORT_URL] = "SUPPORT_URL=";
        os[info.BUG_REPORT_URL] = "BUG_REPORT_URL=";

        let o = {
            "distroId": "",
            "distroLike": "",
            "versionId": "",
            "versionLike": "",
            "isolinuxPath": "",
            "syslinuxPath": "",
            "mountpointSquashFs": "",
            "homeUrl": "",
            "supportUrl": "",
            "bugReportUrl": "",
            "append": "",
            "appendSafe": "",
            "menuTitle": ""
        };

        read(`/etc/os-release`, function (data: any) {
            for (var temp in data) {
                if (!data[temp].search(os[info.HOME_URL])) {
                    o.homeUrl = data[temp].substring(os[info.HOME_URL].length).replace(/"/g, "");
                };

                if (!data[temp].search(os[info.SUPPORT_URL])) {
                    o.supportUrl = data[temp].substring(os[info.SUPPORT_URL].length).replace(/"/g, "");
                };

                if (!data[temp].search(os[info.BUG_REPORT_URL])) {
                    o.bugReportUrl = data[temp].substring(os[info.BUG_REPORT_URL].length).replace(/"/g, "");
                };
            }
        });

        /**
         * lsb_release -c -s
         */
        o.versionId = (shell.exec('lsb_release -c -s', { silent: true }).stdout).toString().trim();
        o.isolinuxPath = "/usr/lib/ISOLINUX/";
        o.syslinuxPath = "/usr/lib/syslinux/modules/bios/";
        o.mountpointSquashFs = "/lib/live/mount/medium/live/filesystem.squashfs";
        if (o.versionId === "solydxk-9") {
            o.distroId = "SolydXK";
            o.distroLike = "Debian";
            o.versionLike = "stretch";
        } else if (o.versionId === "sana") {
            o.distroId = "Kali";
            o.distroLike = "Debian";
            o.versionLike = "jessie";
        } else if (o.versionId === "sana") {
            o.distroId = "Kali";
            o.distroLike = "Debian";
            o.versionLike = "jessie";
        } else if (o.versionId === "kali-rolling") {
            o.distroId = "Kali";
            o.distroLike = "Debian";
            o.versionLike = "jessie";
        } else if (o.versionId === "Nibiru") {
            o.distroId = "Sparky Linux";
            o.distroLike = "Debian";
            o.versionLike = "buster";
        } else if (o.versionId === "Horizon") {
            o.distroId = "MX Linux 17";
            o.distroLike = "Debian";
            o.versionLike = "stretch";
        } else if (o.versionId === "maya") {
            o.distroId = "Linux Mint";
            o.distroLike = "Ubuntu";
            o.versionLike = "precise";
        } else if (o.versionId === "qiana" || o.versionId === "rafaela" || o.versionId === "rebecca" || o.versionId === "rosa") {
            o.distroId = "Linux Mint";
            o.distroLike = "Ubuntu";
            o.versionLike = "trusty";
        } else if (o.versionId === "sarah" || o.versionId === "serena" || o.versionId === "sonya" || o.versionId === "sylvia") {
            o.distroId = "Linux Mint";
            o.distroLike = "Ubuntu";
            o.versionLike = "xenial";
        } else if (o.versionId === "tara" || o.versionId === "tessa") {
            o.distroId = "Linux Mint";
            o.distroLike = "Ubuntu";
            o.versionLike = "bionic";
            // LMDE
        } else if (o.versionId == "cindy") {
            o.distroId = "LMDE";
            o.distroLike = "Debian";
            o.versionLike = "stretch";
        } else if (o.versionId === "cindy") {
            o.distroId = "LMDE";
            o.distroLike = "Debian";
            o.versionLike = "jessie";
            // elementaryOS
        } else if (o.versionId === "luna") {
            o.distroId = "elementaryOS";
            o.distroLike = "Ubuntu";
            o.versionLike = "precise";
        } else if (o.versionId === "freya") {
            o.distroId = "elementaryOS";
            o.distroLike = "Ubuntu";
            o.versionLike = "trusty";
        } else if (o.versionId === "loki") {
            o.distroId = "elementaryOS";
            o.distroLike = "Ubuntu";
            o.versionLike = "xenial";
        } else if (o.versionId === "toutatis") {
            o.distroId = "Trisquel";
            o.distroLike = "Ubuntu";
            o.versionLike = "precise";
        } else if (o.versionId === "belenos") {
            o.distroId = "Trisquel";
            o.distroLike = "Ubuntu";
            o.versionLike = "trusty";
        } else if (o.versionId === "lugalbanda") {
            o.distroId = "Uruk GNU/Linux";
            o.distroLike = "Ubuntu";
            o.versionLike = "xenial";
        } else if (o.versionId === "anokha") {
            o.distroId = "BOSS";
            o.distroLike = "Debian";
            o.versionLike = "wheezy";
        } else if (o.versionId === "anoop") {
            o.distroId = "BOSS";
            o.distroLike = "Debian";
            o.versionLike = "jessie";
        } else if (o.versionId === "bunsen-hydrogen") {
            o.distroId = "bunsenlabs";
            o.distroLike = "Debian";
            o.versionLike = "jessie";
        } else if (o.versionId === "helium") {
            o.distroId = "bunsenlabs";
            o.distroLike = "Debian";
            o.versionLike = "stretch";
        } else if (o.versionId === "chromodoris") {
            o.distroId = "Tanglu";
            o.distroLike = "Debian";
            o.versionLike = "jessie";
        } else if (o.versionId === "greenchromodoris") {
            o.distroId = "PureOS";
            o.distroLike = "Debian";
            o.versionLike = "sid";
        } else if (o.versionId === "jessie") {
            o.distroId = "Devuan";
            o.distroLike = "Debian";
            o.versionLike = "jessie";
        } else if (o.versionId === "ascii") {
            o.distroId = "Devuan";
            o.distroLike = "Debian";
            o.versionLike = "stretch";
        } else if (o.versionId === "ceres") {
            o.distroId = "Devuan";
            o.distroLike = "Debian";
            o.versionLike = "sid";
        } else if (o.versionId === "panda") {
            o.distroId = "Deepin";
            o.distroLike = "Debian";
            o.versionLike = "sid";
        } else if (o.versionId === "unstable") {
            o.distroId = "Deepin";
            o.distroLike = "Debian";
            o.versionLike = "sid";
        } else if (o.versionId === "stable") {
            o.distroId = "Deepin";
            o.distroLike = "Debian";
            o.versionLike = "sid";
        } else if (o.versionId === "onyedi") {
            o.distroId = "Pardus";
            o.distroLike = "Debian";
            o.versionLike = "stretch";
        } else if (o.versionId === "lemur-3") {
            o.distroId = "Liquid Lemur";
            o.distroLike = "Debian";
            o.versionLike = "stretch";
        } else if (o.versionId === "mx-linux") {
            o.distroId = "Continuum";
            o.distroLike = "Debian";
            o.versionLike = "stretch";
        } else if (o.versionId === "buster") {
            o.distroId = "Debian";
            o.distroLike = "Debian";
            o.versionLike = "buster";
            o.mountpointSquashFs = "/run/live/medium/live/filesystem.squashfs";
        } else if (o.versionId === "stretch") {
            o.distroId = "Debian";
            o.distroLike = "Debian";
            o.versionLike = "stretch";
        } else if (o.versionId === "jessie") {
            o.distroId = "Debian";
            o.distroLike = "Debian";
            o.versionLike = "jessie";
        } else if (o.versionId === "wheezy") {
            o.distroId = "Debian";
            o.distroLike = "Debian";
            o.versionLike = "wheezy";
        } else if (o.versionId === "wheezy") {
            o.distroId = "Debian";
            o.distroLike = "Debian";
            o.versionLike = "wheezy";
        } else if (o.versionId === "disco") {
            o.distroId = "Ubuntu";
            o.distroLike = "Ubuntu";
            o.versionLike = "disco";
            o.mountpointSquashFs = "/run/live/medium/live/filesystem.squashfs";
        } else if (o.versionId === "cosmic") {
            o.distroId = "Ubuntu";
            o.distroLike = "Ubuntu";
            o.versionLike = "cosmic";
            o.mountpointSquashFs = "/run/live/medium/live/filesystem.squashfs";
        } else if (o.versionId === "bionic") {
            o.distroId = "Ubuntu";
            o.distroLike = "Ubuntu";
            o.versionLike = "bionic";
        } else if (o.versionId === "artful") {
            o.distroId = "Ubuntu";
            o.distroLike = "Ubuntu";
            o.versionLike = "artful";
        } else if (o.versionId === "zesty") {
            o.distroId = "Ubuntu";
            o.distroLike = "Ubuntu";
            o.versionLike = "zesty";
        } else if (o.versionId === "zesty") {
            o.distroId = "Ubuntu";
            o.distroLike = "Ubuntu";
            o.versionLike = "zesty";
        } else if (o.versionId === "yakkety") {
            o.distroId = "Ubuntu";
            o.distroLike = "Ubuntu";
            o.versionLike = "yakkety";
        } else if (o.versionId === "xenial") {
            o.distroId = "Ubuntu";
            o.distroLike = "Ubuntu";
            o.versionLike = "xenial";
        } else if (o.versionId === "wily") {
            o.distroId = "Ubuntu";
            o.distroLike = "Ubuntu";
            o.versionLike = "wily";
        } else if (o.versionId === "vivid") {
            o.distroId = "Ubuntu";
            o.distroLike = "Ubuntu";
            o.versionLike = "vivid";
        } else if (o.versionId === "utopic") {
            o.distroId = "Ubuntu";
            o.distroLike = "Ubuntu";
            o.versionLike = "utopic";
        } else if (o.versionId === "trusty") {
            o.distroId = "Ubuntu";
            o.distroLike = "Ubuntu";
            o.versionLike = "trusty";
        } else if (o.versionId === "Illyria") {
            o.distroId = "Manjaro";
            o.distroLike = "Arch";
            o.versionLike = "Illyria";
            o.syslinuxPath = "/usr/lib/syslinux/";
            o.isolinuxPath = "/usr/share/manjaro-tools/isolinux/";
        } else if (o.versionId === "TwentyNine") {
            o.distroId = "Fedora";
            o.distroLike = "RedHat";
            o.versionLike = "TwentyNine";
            o.syslinuxPath = "/usr/share/syslinux/";
            o.isolinuxPath = "/usr/share/syslinux/";
        }


        if (o.distroLike === "RedHat") {
            o.append = `append initrd=/live/initrd.img root=live:CDLABEL=${o.distroId} rd.live.image quiet`;
        } else if (o.distroLike === "Arch") {
            o.append = `append initrd=/live/initrd.img boot=live quiet splash`;
        } else if (o.distroLike === "Ubuntu") {
            o.append = `append initrd=/live/initrd.img boot=live quiet splash`;
        } else if (o.distroLike === "Debian") {
            o.append = `append initrd=/live/initrd.img boot=live quiet splash`;
            o.appendSafe =`append initrd=/live/initrd.img boot=live xforcevesa nomodeset verbose`;
        }
        o.menuTitle = `MENU TITLE Penguin's Eggs ${o.distroId}/${o.versionId} created at ${utils.date4label()}`;
        return (o);
    }
}

export default Oses;

/**
 *
 * @param file Utilizzata da info()
 */
function read(file: string, cb: any) {
    let data = fs.readFileSync(file, 'utf8');
    cb(data.toString().split('\n'))
}
