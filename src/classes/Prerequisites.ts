/**
 * penguins-eggs: Prerequisites.ts
 * 
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

"use strict";

import shell from "shelljs";
import { IOses } from "../interfaces";

class Prerequisites {

    public async cli(): Promise<void> {
        console.log(
            ">>> eggs: Installing the prerequisites packages..."
        );
        let cmd=`apt-get --yes install \
        lvm2 \
        parted \
        squashfs-tools \
        xorriso \
        syslinux \
        isolinux \
        live-boot \
        xterm \
        zenity \
        open-infrastructure-system-config`;
        
        shell.exec(`apt-get update`);
        console.log(cmd);
        shell.exec(cmd);


                            shell.exec(`apt-get clean`);
                            shell.exec(`apt-get autoclean`);
                        }

    public async calamares(){
        console.log(
            ">>> eggs: Installing the prerequisites calamares..."
        );
        let cmd=`apt-get --yes install \
        calamares \
        calamares-settings-debian \
        qml-module-qtquick2 \
        qml-module-qtquick-controls`;

        shell.exec(`apt-get update`);
        shell.exec(cmd);
        console.log(cmd);
        shell.exec(`apt-get clean`);
        shell.exec(`apt-get autoclean`);
    
    }

    public async sterilize(){
        console.log(`>>> eggs: removing eggs prerequisites...`);
        let cmd=`apt-get remove --purge \
        calamares \
        calamares-settings-debian \
        qml-module-qtquick2 \
        qml-module-qtquick-controls`;
        shell.exec(cmd);
        console.log(cmd);

        cmd=`apt-get remove --purge \
        squashfs-tools \
        xorriso \
        syslinux \
        isolinux \
        live-boot \
        open-infrastructure-system-config`;
        shell.exec(cmd);
        console.log(cmd);


        cmd=`apt-get autoremove`;
        shell.exec(cmd);
        console.log(cmd);

    }

}
export default Prerequisites;