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


        if (packages.backend === 'apt') {
            let operations = JSON.parse(JSON.stringify(packages.operations))
            if (operations.length === 2) {
                for (const remPack of operations[0].remove) {
                    await exec(`chroot ${this.installTarget} apt-get purge -y ${remPack}`, echoYes)
                }
                for (const addPack of operations[1].try_install) {
                    await exec(`chroot ${this.installTarget} apt-get install -y ${addPack}`, this.echo)
                }
            } else {
                for (const addPack of operations[0].try_install) {
                    await exec(`chroot ${this.installTarget} apt-get install -y ${addPack}`, this.echo)
                }
            }
        } else if (packages.backend === 'pacman') {
        }

    }

}

