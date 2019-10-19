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
        let cmd=`apt --yes install \
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
        
        shell.exec(`apt update`);
        console.log(cmd);
        shell.exec(cmd);

        shell.exec(`apt clean`);
        shell.exec(`apt autoclean`);
                        }

    public async calamares(){
        console.log(
            ">>> eggs: Installing the prerequisites calamares..."
        );
        let cmd=`apt --yes install \
        calamares \
        calamares-settings-debian \
        qml-module-qtquick2 \
        qml-module-qtquick-controls`;

        shell.exec(`apt update`);
        shell.exec(cmd);
        console.log(cmd);
        shell.exec(`apt clean`);
        shell.exec(`apt autoclean`);
    
    }

    public async sterilize(){
        console.log(`>>> eggs: removing eggs prerequisites...`);
        let cmd=`apt --yes remove --purge \
        calamares \
        calamares-settings-debian \
        qml-module-qtquick2 \
        qml-module-qtquick-controls`;
        shell.exec(cmd);
        console.log(cmd);

        cmd=`apt --yes --purge remove  \
        squashfs-tools \
        xorriso \
        syslinux \
        isolinux \
        live-boot \
        open-infrastructure-system-config`;
        shell.exec(cmd);
        console.log(cmd);


        cmd=`apt --yes autoremove`;
        shell.exec(cmd);
        console.log(cmd);

    }

}
export default Prerequisites;