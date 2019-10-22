/**
 * penguins-eggs: Prerequisites.ts
 * 
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

"use strict";

import shell from "shelljs";
import { IOses } from "../interfaces";
import utils from "util";

class Prerequisites {

    public async cli(): Promise<void> {
        console.log(
            ">>> eggs: Installing the prerequisites packages..."
        );
        shell.exec(`${__dirname}/../../scripts/prerequisites.sh ${check}`, {
            async: false
          });
    }

    public async calamares() {
        console.log(`>>> eggs: installing calamares...`);

        shell.exec(`${__dirname}/../../scripts/prerequisites_calamares.sh ${check}`, {
            async: false
          });
        /*
        console.log(">>> eggs: to install calamares: ");
        console.log(`sudo apt update`);
        console.log(`sudo apt install calamares`);
        */
    }

    public async sterilize() {
        console.log(`>>> eggs: removing eggs prerequisites...`);

        shell.exec(`${__dirname}/../../scripts/prerequisites_sterilize.sh ${check}`, {
            async: false
          });
        /*
          let cmd = `apt-get --yes --purge remove  \
        calamares \
        calamares-settings-debian \
        qml-module-qtquick2 \
        qml-module-qtquick-controls`;
        console.log(cmd);
        shell.exec(cmd, {async: true});
        shell.exec(`sleep 1`,{async: true});

        cmd = `apt-get --yes --purge remove  \
        squashfs-tools \
        xorriso \
        syslinux \
        isolinux \
        live-boot \
        open-infrastructure-system-config`;
        console.log(cmd);
        shell.exec(cmd, {async: true});
        shell.exec(`sleep 1`,{async: true});


        cmd = `apt-get --yes autoremove`;
        console.log(cmd);
        shell.exec(cmd, {async: true});
        shell.exec(`sleep 1`,{async: true});

        cmd = `apt-get clean`;
        console.log(cmd);
        shell.exec(cmd, {async: true});
        shell.exec(`sleep 1`,{async: true});

        cmd = `apt-get autoclean`;
        console.log(cmd);
        shell.exec(cmd, {async: true});
        shell.exec(`sleep 1`,{async: true});
        */
    }

}
export default Prerequisites;