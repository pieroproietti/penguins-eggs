/**
 * penguins-eggs
 * krill modules: packages.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import {exec} from '../../lib/utils'
import Utils from '../../classes/utils'
import Pacman from '../../classes/pacman'
import fs from 'fs'
import yaml from 'js-yaml'
import {IPackages} from '../../interfaces/i-packages'

/**
 *
 * @param this
 */
export default async function packages(this: Sequence): Promise<void> {
  const echoYes = Utils.setEcho(true)

  let modulePath = '/etc/penguins-eggs.d/krill/'
  if (Pacman.packageIsInstalled('calamares')) {
    modulePath = '/etc/calamares/'
  }

  const config_file = `${this.installTarget}${modulePath}modules/packages.conf`
  let remove: string[] = []
  let install: string[] = []

  if (fs.existsSync(config_file)) {
    const packages = yaml.load(fs.readFileSync(config_file, 'utf-8')) as IPackages
    const operations = JSON.parse(JSON.stringify(packages.operations))

    remove = operations[0].remove
    if (operations.length > 1) {
      install = operations[1].install
    }

    if (operations !== undefined) {
      if (packages.backend === 'apt') {
        /**
                 * apt: Debian/Devuan/Ubuntu
                 */
        if (remove.length > 0) {
          let cmd = `chroot ${this.installTarget} apt-get purge -y `
          for (const elem of remove) {
            cmd += elem + ' '
          }

          await exec(`${cmd} ${this.toNull}`, this.echo)
        }

        if (install.length > 0) {
          let cmd = `chroot ${this.installTarget} apt-get install -y `
          for (const elem of install) {
            cmd += elem + ' '
          }

          await exec(`chroot ${this.installTarget} apt-get update ${this.toNull}`, this.echo)
          await exec(`${cmd} ${this.toNull}`, this.echo)
        }
      } else if (packages.backend === 'pacman') {
        /**
                 * pacman: arch/manjaro
                 */
        if (remove.length > 0) {
          let cmd = `chroot ${this.installTarget} pacman -R\n`
          for (const elem of remove) {
            cmd += elem + ' '
          }

          await exec(`${cmd} ${echoYes}`, this.echo)
        }

        if (install.length > 0) {
          for (const elem of install) {
            await exec(`chroot ${this.installTarget} pacman -S ${elem}`, echoYes)
          }
        }
      }
    }
  }
}
