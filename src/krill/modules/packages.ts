/**
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import { exec } from '../../lib/utils'
import Utils from '../../classes/utils'
import shx from 'shelljs'
import fs from 'fs'
import yaml from 'js-yaml'

import { IPackages } from '../../interfaces/i-packages'

/**
 * 
 * @param this 
 */
export default async function packages(this: Sequence): Promise<void> {
    let echoYes = Utils.setEcho(true)
    const config_file = `${this.installTarget}/etc/calamares/modules/packages.conf`
    if (fs.existsSync(config_file)) {
        const packages = yaml.load(fs.readFileSync(config_file, 'utf-8')) as IPackages
        let operations = packages.operations
        let remove = packages.operations.remove
        let try_install = packages.operations.try_install
        
        console.log(packages)
        console.log("operations: " + operations)
        console.log("remove: " + remove)
        console.log("try_install: " + try_install)
        /*
        {
            backend: 'apt',
            operations: [ { remove: [Array] }, { try_install: [Array] } ]
            }
            operations: [object Object],[object Object]
            remove: undefined
            try_install: undefined
        */
        await Utils.pressKeyToExit()

        if (packages.backend === 'apt') {
            for (const packToRemove of remove) {
                let cmd =`chroot ${this.installTarget} apt purge -y ${packToRemove}`
                await exec (cmd, echoYes)
                await Utils.pressKeyToExit(cmd)
            }
            for (const packToInstall of try_install) {
                let cmd =`chroot ${this.installTarget} apt install -y ${packToInstall}`
                await exec(cmd, echoYes)
                await Utils.pressKeyToExit(cmd)
            }
            await Utils.pressKeyToExit('end packages')
        } else if (packages.backend === 'pacman') {
        }
    
    }

}

