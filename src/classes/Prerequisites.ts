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

    public async prerequisitesCli(): Promise<void> {
        console.log(
            ">>> eggs: Installing the prerequisites packages..."
        );
        shell.exec(`apt-get update`);
        shell.exec(`apt-get --yes install \
                            lvm2 \
                            parted \
                            squashfs-tools \
                            xorriso \
                            syslinux \
                            isolinux \
                            live-boot \
                            open-infrastructure-system-config`);
                            //live-config`);


                            shell.exec(`apt-get clean`);
                            shell.exec(`apt-get autoclean`);
                        }

    public async prerequisitesCalamares(){
        console.log(
            ">>> eggs: Installing the prerequisites calamares..."
        );

        shell.exec(`apt-get update`);
        shell.exec(`apt-get --yes install \
        calamares \
        calamares-settings-debian \
        qml-module-qtquick2 \
        qml-module-qtquick-controls`);
        shell.exec(`apt-get clean`);
        shell.exec(`apt-get autoclean`);
    
    }

}
export default Prerequisites;