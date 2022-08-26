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
    // let echoYes = Utils.setEcho(true)
    const config_file = '/etc/calamares/modules/packages.conf' as string
    if (fs.existsSync(config_file)) {
        const packages = yaml.load(fs.readFileSync(config_file, 'utf-8')) as IPackages

        if (packages.backend === 'apt') {
            for (const packToRemove of packages.operations.remove) {
                shx.exec(`chroot ${this.installTarget} apt purge -y ${packToRemove}`)
            }
            for (const packToInstall of packages.operations.try_install) {
                shx.exec(`chroot ${this.installTarget} apt install -y ${packToInstall}`)
            }
        } else if (packages.backend === 'pacman') {
        }
    
    }

}

