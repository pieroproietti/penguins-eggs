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
        shell.exec(`${__dirname}/../../scripts/prerequisites.sh`, {
            async: false
          });
    }

    public async calamares() {
        console.log(`>>> eggs: installing calamares...`);

        shell.exec(`${__dirname}/../../scripts/prerequisites_calamares.sh`, {
            async: false
          });
    }

    public async sterilize() {
        console.log(`>>> eggs: removing eggs prerequisites...`);
        shell.exec(`${__dirname}/../../scripts/prerequisites_sterilize.sh`, {
            async: false
          });
    }

}
export default Prerequisites;