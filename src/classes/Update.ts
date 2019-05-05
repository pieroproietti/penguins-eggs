/**
 * penguins-eggs: Update.ts
 * 
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

"use strict";
import utils from "../lib/utils";

class Update {
    // Properties

    // Methods
    static async go() {
        utils.exec(`npm config set unsafe-perm true`);
        utils.exec(`npm i penguins-eggs -g`);
    }
}

export default Update;