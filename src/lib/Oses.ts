/**
 * Oses
 */

"use strict";
import fs from "fs";
import { IDistro } from "../interfaces";


class Oses {
    private distro = {} as IDistro;

    constructor() {
        this.distro.isolinux
        //empty        
    }

    /**
     * squashFsMountPoint: mount point per filesystemsquash
     * da sistemare! 
     */
    squashFsMountPoint(distroType: string): string {
        let retval: string;
        if (distroType==='debian') {
            retval = '/run/live/medium/live/filesystem.squashfs';
        } else if (distroType==='ubuntu') {
            retval = '/lib/live/medium/live/filesystem.squashfs';
        } else {
            retval = '/run/live/medium/live/filesystem.squashfs';
        }
        return retval;
    }

    isolinux(): string {
        let retval: string;

        if (fs.existsSync('/etc/debian_version')) {
            // Debian
            retval = '/usr/lib/ISOLINUX/';
        } else {
            // Fedora
            retval = '/usr/share/syslinux/';
        }
        return retval;
    }

    syslinux(): string {
        let retval: string;
        if (fs.existsSync('/etc/debian_version')) {
            // Debian
            retval = '/usr/lib/syslinux/modules/bios/';
        } else {
            // Fedora
            retval = '/usr/share/syslinux/';
        }
        return retval;
    }

    info(): any {
        enum info { PRETTY_NAME = 0, NAME, VERSION_CODENAME, VERSION_ID, ID, ID_LIKE, HOME_URL, SUPPORT_URL, BUG_REPORT_URL };
        let os: Array<string> = new Array();
        os[info.PRETTY_NAME] = "PRETTY_NAME=";
        os[info.NAME] = "NAME=";
        os[info.VERSION_CODENAME] = "VERSION_CODENAME=";
        os[info.VERSION_ID] = "VERSION_ID=";
        os[info.ID] = "ID=";
        os[info.ID_LIKE] = "ID_LIKE=";
        os[info.HOME_URL] = "HOME_URL=";
        os[info.SUPPORT_URL] = "SUPPORT_URL=";
        os[info.BUG_REPORT_URL] = "BUG_REPORT_URL=";
        let o = {
            "prettyName": "",
            "name": "",
            "versionCodename" : "",
            "versionId": "",
            "id": "",
            "idLike": "",
            "homeUrl": "",
            "supportUrl": "",
            "bugReportUrl": ""
        };

        read('/etc/os-release', function (data: any) {
            for (var temp in data) {
                if (!data[temp].search(os[info.PRETTY_NAME])) {
                    o.prettyName = data[temp].substring(os[info.PRETTY_NAME].length).replace(/"/g, "");
                };

                if (!data[temp].search(os[info.NAME])) {
                    o.name = data[temp].substring(os[info.NAME].length).replace(/"/g, "");
                };

                if (!data[temp].search(os[info.VERSION_CODENAME])) {
                    o.versionCodename = data[temp].substring(os[info.VERSION_CODENAME].length).replace(/"/g, "");
                };

                if (!data[temp].search(os[info.VERSION_ID])) {
                    o.versionId = data[temp].substring(os[info.VERSION_ID].length).replace(/"/g, "");
                };

                if (!data[temp].search(os[info.ID])) {
                    o.id = data[temp].substring(os[info.ID].length).replace(/"/g, "");
                };

                if (!data[temp].search(os[info.ID_LIKE])) {
                    o.idLike = data[temp].substring(os[info.ID_LIKE].length).replace(/"/g, "");
                    if (o.idLike===''){
                        o.idLike=o.id;
                    }
                };

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
