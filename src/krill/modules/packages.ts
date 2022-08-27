/**
 * krill: module packages (use /etc/calamares/modules/packages.conf)
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import { exec } from '../../lib/utils'
import Utils from '../../classes/utils'
import fs from 'fs'
import yaml from 'js-yaml'

import { IPackages } from '../../interfaces/i-packages'
import { string } from '@oclif/core/lib/flags'

/**
 * 
 * @param this 
 */
export default async function packages(this: Sequence): Promise<void> {
    let echoYes = Utils.setEcho(true)
    const config_file = `${this.installTarget}/etc/calamares/modules/packages.conf`
    if (fs.existsSync(config_file)) {
        const packages = yaml.load(fs.readFileSync(config_file, 'utf-8')) as IPackages

        let operations = JSON.parse(JSON.stringify(packages.operations))
        let packagesToRemove: string[] = []
        let packagesToInstall: string[] = []

        if (operations.length > 1) {
            packagesToRemove = operations[0].remove
            packagesToInstall = operations[1].install
        } else {
            packagesToInstall = operations[0].install
        }

        if (packages.backend === 'apt') {
            if (packagesToRemove.length > 0) {
                let ctr = `chroot ${this.installTarget} apt-get purge -y `
                for (const packageToRemove of packagesToRemove) {
                    ctr += packageToRemove + ' '
                }
                await exec(`${ctr} ${this.toNull}`, this.echo)
                await exec(`chroot ${this.installTarget} apt-get autoremove -y ${this.toNull}`, this.echo)
            }

            for (const packageToInstall of packagesToInstall) {
                await exec(`chroot ${this.installTarget} apt-get purge -y ${packageToInstall} ${this.toNull}`, this.echo)
            }

        } else if (packages.backend === 'pacman') {
            if (packagesToRemove.length > 0) {
                let ctr = `chroot ${this.installTarget} pacman -S `
                for (const packageToRemove of packagesToRemove) {
                    ctr += packageToRemove + ' '
                }
                await exec(`${ctr} ${echoYes}`, this.echo)
            }

            for (const packageToInstall of packagesToInstall) {
                await exec(`chroot ${this.installTarget} pacman -S ${packageToInstall}`, echoYes)
            }
        }
    }
}

