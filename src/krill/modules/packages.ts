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
import Pacman from '../../classes/pacman'
import fs from 'fs'
import yaml from 'js-yaml'
import { IPackages } from '../../interfaces/i-packages'

/**
 * 
 * @param this 
 */
export default async function packages(this: Sequence): Promise<void> {
    let echoYes = Utils.setEcho(true)

    let modulePath = '/etc/penguins-eggs.d/krill/'
    if (Pacman.packageIsInstalled('calamares')) {
        modulePath = '/etc/calamares/'
    }
    const config_file = `${this.installTarget}${modulePath}modules/packages.conf`


    if (fs.existsSync(config_file)) {
        const packages = yaml.load(fs.readFileSync(config_file, 'utf-8')) as IPackages

        let operations = JSON.parse(JSON.stringify(packages.operations))
        if (operations !== undefined) {
            let packagesToRemove: string[] = []
            let packagesTryInstall: string[] = []

            if (operations.length > 1) {
                packagesToRemove = operations[0].remove
                packagesTryInstall = operations[1].try_install
            } else {
                packagesTryInstall = operations[0].try_install
            }

            if (packages.backend === 'apt') {
                if (packagesToRemove.length > 0) {
                    let cmd = `chroot ${this.installTarget} apt-get purge -y\n`
                    for (const packageToRemove of packagesToRemove) {
                        cmd += packageToRemove + ' '
                    }
                    await exec(`${cmd} ${this.toNull}`, this.echo)
                    await exec(`chroot ${this.installTarget} apt-get autoremove -y ${this.toNull}`, this.echo)
                }

                for (const packageToInstall of packagesTryInstall) {
                    await exec(`chroot ${this.installTarget} apt-get purge -y ${packageToInstall} ${this.toNull}`, this.echo)
                }

            } else if (packages.backend === 'pacman') {
                if (packagesToRemove.length > 0) {
                    let cmd = `chroot ${this.installTarget} pacman -S\n`
                    for (const packageToRemove of packagesToRemove) {
                        cmd += packageToRemove + ' '
                    }
                    await exec(`${cmd} ${echoYes}`, this.echo)
                }

                for (const packageToInstall of packagesTryInstall) {
                    await exec(`chroot ${this.installTarget} pacman -S ${packageToInstall}`, echoYes)
                }
            }
        }
    }
}

