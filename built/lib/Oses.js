/**
 * Oses
 */
"use strict";

var __importDefault = undefined && undefined.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
class Oses {
    constructor() {
        //empty        
    }
    isolinux() {
        let retval;
        if (fs_1.default.existsSync('/etc/debian_version')) {
            retval = '/usr/lib/ISOLINUX/';
        } else {
            retval = '/usr/share/syslinux/';
        }
        return retval;
    }
    syslinux() {
        let retval;
        if (fs_1.default.existsSync('/etc/debian_version')) {
            retval = '/usr/lib/syslinux/modules/bios/';
        } else {
            retval = '/usr/share/syslinux/';
        }
        return retval;
    }
    info() {
        let d;
        (function (d) {
            d[d["PRETTY_NAME"] = 0] = "PRETTY_NAME";
            d[d["NAME"] = 1] = "NAME";
            d[d["ID"] = 2] = "ID";
            d[d["HOME_URL"] = 3] = "HOME_URL";
            d[d["SUPPORT_URL"] = 4] = "SUPPORT_URL";
            d[d["BUG_REPORT_URL"] = 5] = "BUG_REPORT_URL";
        })(d || (d = {}));
        ;
        let o = {
            "prettyName": "",
            "name": "",
            "id": "",
            "homeUrl": "",
            "supportUrl": "",
            "bugReportUrl": ""
        };
        let os = new Array();
        os[d.PRETTY_NAME] = "PRETTY_NAME=";
        os[d.NAME] = "NAME=";
        os[d.ID] = "ID=";
        os[d.HOME_URL] = "HOME_URL=";
        os[d.SUPPORT_URL] = "SUPPORT_URL=";
        os[d.BUG_REPORT_URL] = "BUG_REPORT_URL=";
        read('/etc/os-release', function (data) {
            for (var temp in data) {
                if (!data[temp].search(os[d.PRETTY_NAME])) {
                    o.prettyName = data[temp].substring(os[d.PRETTY_NAME].length).replace(/"/g, "");
                }
                ;
                if (!data[temp].search(os[d.NAME])) {
                    o.name = data[temp].substring(os[d.NAME].length).replace(/"/g, "");
                }
                ;
                if (!data[temp].search(os[d.ID])) {
                    o.id = data[temp].substring(os[d.ID].length).replace(/"/g, "");
                }
                ;
                if (!data[temp].search(os[d.HOME_URL])) {
                    o.homeUrl = data[temp].substring(os[d.HOME_URL].length).replace(/"/g, "");
                }
                ;
                if (!data[temp].search(os[d.SUPPORT_URL])) {
                    o.supportUrl = data[temp].substring(os[d.SUPPORT_URL].length).replace(/"/g, "");
                }
                ;
                if (!data[temp].search(os[d.BUG_REPORT_URL])) {
                    o.bugReportUrl = data[temp].substring(os[d.BUG_REPORT_URL].length).replace(/"/g, "");
                }
                ;
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
exports.default = Oses;
/**
 *
 * @param file Utilizzata da info()
 */
function read(file, cb) {
    fs_1.default.readFile(file, 'utf8', function (err, data) {
        if (!err) {
            cb(data.toString().split('\n'));
        } else {
            console.log(err);
        }
    });
}
//# sourceMappingURL=Oses.js.map