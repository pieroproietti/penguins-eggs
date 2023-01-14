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
        const pkgs = yaml.load(fs.readFileSync(config_file, 'utf-8')) as IPackages
        if (pkgs.operations !== undefined) {
            if (pkgs.backend === 'apt') {
                /**
                 * apt: Debian/Devuan/Ubuntu
                 */
                if (pkgs.operations.remove !== undefined) {
                    let cmd = `chroot ${this.installTarget} apt-get purge -y `
                    for (const elem of pkgs.operations.remove) {
                        cmd += elem + ' '
                    }
                    await exec(`${cmd} ${this.toNull}`, this.echo)
                    Utils.pressKeyToExit(cmd)
                }

                if (pkgs.operations.try_install !== undefined) {
                    let cmd = `chroot ${this.installTarget} apt-get install -y `
                    for (const elem of pkgs.operations.try_install) {
                        cmd += elem + ' '
                    }
                    await exec(`chroot ${this.installTarget} apt-get update ${this.toNull}`, this.echo)
                    await exec(`${cmd} ${this.toNull}`, this.echo)
                    Utils.pressKeyToExit(cmd)
                }


            } else if (pkgs.backend === 'pacman') {
                /**
                 * pacman: arch/manjaro
                 */
                if (pkgs.operations.remove !== undefined) {
                    let cmd = `chroot ${this.installTarget} pacman -R\n`
                    for (const elem of pkgs.operations.remove) {
                        cmd += elem + ' '
                    }
                    await exec(`${cmd} ${echoYes}`, this.echo)
                }

                if (pkgs.operations.try_install !== undefined) {
                    for (const elem of pkgs.operations.try_install) {
                        await exec(`chroot ${this.installTarget} pacman -S ${elem}`, echoYes)
                    }
                }
            }
        }
    }
}

