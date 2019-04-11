/**
 * Oses
 */

"use strict";
import fs from "fs";
import { IDistro} from "../interfaces";

class Oses {
    private distro = {} as IDistro;
    

    constructor (){
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

    info(): any {
        enum d { PRETTY_NAME = 0, NAME, ID, HOME_URL, SUPPORT_URL, BUG_REPORT_URL };

        let o = {
            "prettyName": "",
            "name": "",
            "id": "",
            "homeUrl": "",
            "supportUrl": "",
            "bugReportUrl": ""
        }

        let os: Array<string> = new Array();
        os[d.PRETTY_NAME] = "PRETTY_NAME=";
        os[d.NAME] = "NAME=";
        os[d.ID] = "ID=";
        os[d.HOME_URL] = "HOME_URL=";
        os[d.SUPPORT_URL] = "SUPPORT_URL=";
        os[d.BUG_REPORT_URL] = "BUG_REPORT_URL=";

        read('/etc/os-release', function (data: any) {
            for (var temp in data) {
                if (!data[temp].search(os[d.PRETTY_NAME])) {
                    o.prettyName = data[temp].substring(os[d.PRETTY_NAME].length).replace(/"/g, "");
                };

                if (!data[temp].search(os[d.NAME])) {
                    o.name = data[temp].substring(os[d.NAME].length).replace(/"/g, "");
                };

                if (!data[temp].search(os[d.ID])) {
                    o.id = data[temp].substring(os[d.ID].length).replace(/"/g, "");
                };

                if (!data[temp].search(os[d.HOME_URL])) {
                    o.homeUrl = data[temp].substring(os[d.HOME_URL].length).replace(/"/g, "");
                };

                if (!data[temp].search(os[d.SUPPORT_URL])) {
                    o.supportUrl = data[temp].substring(os[d.SUPPORT_URL].length).replace(/"/g, "");
                };

                if (!data[temp].search(os[d.BUG_REPORT_URL])) {
                    o.bugReportUrl = data[temp].substring(os[d.BUG_REPORT_URL].length).replace(/"/g, "");
                };
            }

            console.log("==========================================");
            console.log("eggs distro informations: ");
            console.log("==========================================");
            console.log("PRETTY_NAME = " + o.prettyName);
            console.log("NAME = " + o.name);
            console.log("ID = " + o.id);
            console.log("HOME_URL = " + o.homeUrl);
            console.log("SUPPORT_URL = " + o.supportUrl);
            console.log("BUG_REPORT_URL = " + o.bugReportUrl);
            console.log("==========================================");

            return o;
        });
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


