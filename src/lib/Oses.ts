/**
 * Oses
 */

"use strict";
import fs from "fs";
import { IDistro } from "../interfaces";
import { stringify } from "querystring";
import { TIMEOUT } from "dns";

class Oses {
    private distro = {} as IDistro;


    constructor() {
        this.distro.isolinux
        //empty        
    }

    isolinux(): String {
        let retval: String;

        if (fs.existsSync('/etc/debian_version')) {
            retval = '/usr/lib/ISOLINUX/';
        } else {
            retval = '/usr/share/syslinux/';
        }
        return retval;
    }

    syslinux(): String {
        let retval: String;
        if (fs.existsSync('/etc/debian_version')) {
            retval = '/usr/lib/syslinux/modules/bios/';
        } else {
            retval = '/usr/share/syslinux/';
        }
        return retval;
    }

    async info(): Promise<any> {
        enum info { PRETTY_NAME = 0, NAME, ID, HOME_URL, SUPPORT_URL, BUG_REPORT_URL };
        let os: Array<string> = new Array();
        os[info.PRETTY_NAME] = "PRETTY_NAME=";
        os[info.NAME] = "NAME=";
        os[info.ID] = "ID=";
        os[info.HOME_URL] = "HOME_URL=";
        os[info.SUPPORT_URL] = "SUPPORT_URL=";
        os[info.BUG_REPORT_URL] = "BUG_REPORT_URL=";
        let o = {
            "prettyName": "",
            "name": "",
            "id": "",
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

                if (!data[temp].search(os[info.ID])) {
                    o.id = data[temp].substring(os[info.ID].length).replace(/"/g, "");
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
                //console.log("inside function:");
                //console.log(o);
            }
            return (o);
        });

        console.log("Outside read")
        console.log(o);
        return (o);
    }
}

export default Oses;

/**
 * 
 * @param file Utilizzata da info()
 */
function read(file: string, cb: any) {
    fs.readFile(file, 'utf8', function (err, data) {
        if (!err) {
            cb(data.toString().split('\n'))
        } else {
            console.log(err)
        }
    });
}


