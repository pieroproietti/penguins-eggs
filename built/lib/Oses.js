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
        this.distro = {};
        this.distro.isolinux;
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
        let info;
        (function (info) {
            info[info["PRETTY_NAME"] = 0] = "PRETTY_NAME";
            info[info["NAME"] = 1] = "NAME";
            info[info["ID"] = 2] = "ID";
            info[info["HOME_URL"] = 3] = "HOME_URL";
            info[info["SUPPORT_URL"] = 4] = "SUPPORT_URL";
            info[info["BUG_REPORT_URL"] = 5] = "BUG_REPORT_URL";
        })(info || (info = {}));
        ;
        let os = new Array();
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
        read('/etc/os-release', function (data) {
            for (var temp in data) {
                if (!data[temp].search(os[info.PRETTY_NAME])) {
                    o.prettyName = data[temp].substring(os[info.PRETTY_NAME].length).replace(/"/g, "");
                }
                ;
                if (!data[temp].search(os[info.NAME])) {
                    o.name = data[temp].substring(os[info.NAME].length).replace(/"/g, "");
                }
                ;
                if (!data[temp].search(os[info.ID])) {
                    o.id = data[temp].substring(os[info.ID].length).replace(/"/g, "");
                }
                ;
                if (!data[temp].search(os[info.HOME_URL])) {
                    o.homeUrl = data[temp].substring(os[info.HOME_URL].length).replace(/"/g, "");
                }
                ;
                if (!data[temp].search(os[info.SUPPORT_URL])) {
                    o.supportUrl = data[temp].substring(os[info.SUPPORT_URL].length).replace(/"/g, "");
                }
                ;
                if (!data[temp].search(os[info.BUG_REPORT_URL])) {
                    o.bugReportUrl = data[temp].substring(os[info.BUG_REPORT_URL].length).replace(/"/g, "");
                }
                ;
            }
        });
        return o;
    }
}
exports.default = Oses;
/**
 *
 * @param file Utilizzata da info()
 */
function read(file, cb) {
    let data = fs_1.default.readFileSync(file, 'utf8');
    cb(data.toString().split('\n'));
}
//# sourceMappingURL=Oses.js.map