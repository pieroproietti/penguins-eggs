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
    /**
     * squashFsMountPoint: mount point per filesystemsquash
     * da sistemare!
     */
    squashFsMountPoint(distroType) {
        let retval;
        if (distroType === 'debian') {
            retval = '/run/live/medium/live/filesystem.squashfs';
        } else if (distroType === 'ubuntu') {
            retval = '/lib/live/medium/live/filesystem.squashfs';
        } else {
            retval = '/run/live/medium/live/filesystem.squashfs';
        }
        return retval;
    }
    isolinux() {
        let retval;
        if (fs_1.default.existsSync('/etc/debian_version')) {
            // Debian
            retval = '/usr/lib/ISOLINUX/';
        } else {
            // Fedora
            retval = '/usr/share/syslinux/';
        }
        return retval;
    }
    syslinux() {
        let retval;
        if (fs_1.default.existsSync('/etc/debian_version')) {
            // Debian
            retval = '/usr/lib/syslinux/modules/bios/';
        } else {
            // Fedora
            retval = '/usr/share/syslinux/';
        }
        return retval;
    }
    info() {
        let info;
        (function (info) {
            info[info["PRETTY_NAME"] = 0] = "PRETTY_NAME";
            info[info["NAME"] = 1] = "NAME";
            info[info["VERSION_CODENAME"] = 2] = "VERSION_CODENAME";
            info[info["VERSION_ID"] = 3] = "VERSION_ID";
            info[info["ID"] = 4] = "ID";
            info[info["ID_LIKE"] = 5] = "ID_LIKE";
            info[info["HOME_URL"] = 6] = "HOME_URL";
            info[info["SUPPORT_URL"] = 7] = "SUPPORT_URL";
            info[info["BUG_REPORT_URL"] = 8] = "BUG_REPORT_URL";
        })(info || (info = {}));
        ;
        let os = new Array();
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
            "versionCodename": "",
            "versionId": "",
            "id": "",
            "idLike": "",
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
                if (!data[temp].search(os[info.VERSION_CODENAME])) {
                    o.versionCodename = data[temp].substring(os[info.VERSION_CODENAME].length).replace(/"/g, "");
                }
                ;
                if (!data[temp].search(os[info.VERSION_ID])) {
                    o.versionId = data[temp].substring(os[info.VERSION_ID].length).replace(/"/g, "");
                }
                ;
                if (!data[temp].search(os[info.ID])) {
                    o.id = data[temp].substring(os[info.ID].length).replace(/"/g, "");
                }
                ;
                if (!data[temp].search(os[info.ID_LIKE])) {
                    o.idLike = data[temp].substring(os[info.ID_LIKE].length).replace(/"/g, "");
                    if (o.idLike === '') {
                        o.idLike = o.id;
                    }
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