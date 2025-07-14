/**
 * ./src/krill/modules/packages.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import yaml from 'js-yaml'
import fs from 'node:fs'

import Pacman from '../../../classes/pacman.js'
import Utils from '../../../classes/utils.js'
import { IPackages } from '../../../interfaces/i-packages.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../../classes/sequence.js'

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

  const config_file = `${modulePath}modules/packages.conf`
  if (fs.existsSync(config_file)) {
    const packages: IPackages = yaml.load(fs.readFileSync(config_file, 'utf8')) as IPackages
    let packagesToInstall: string[] | undefined = []
    let packagesToRemove: string[] | undefined = []
    if (packages.operations !== undefined) {
      for (const operation of packages.operations) {
        if ('try_remove' in operation) {
          packagesToRemove = operation.try_remove
        }

        if ('try_install' in operation) {
          packagesToInstall = operation.try_install
        }
      }
    }

    // Alpine
    if (this.distro.familyId === 'alpine') {
      packages.backend = 'apk'
    }

    switch (packages.backend) {
      case 'apt': {
        /**
         * apt
         */
        if (packagesToRemove != undefined && packagesToRemove.length > 0) {
          let cmd = `chroot ${this.installTarget} apt-get purge -y `
          for (const elem of packagesToRemove) {
            if (Pacman.packageIsInstalled(elem)) {
              cmd += elem + ' '
            }
          }

          await exec(`${cmd} ${this.toNull}`, this.echo)
          const autoremove = `chroot ${this.installTarget} apt-get autoremove -y ${this.toNull}`
          await exec(autoremove, this.echo)
        }

        if (packagesToInstall != undefined && packagesToInstall.length > 0) {
          let cmd = `chroot ${this.installTarget} apt-get install -y `
          for (const elem of packagesToInstall) {
            cmd += elem + ' '
          }

          const update = `chroot ${this.installTarget} apt-get update ${this.toNull}`
          await exec(update, this.echo)
          await exec(`${cmd} ${this.toNull}`, this.echo)
        }

        break
      }

      case 'pacman': {
        /**
         * pacman
         */
        if (packagesToRemove != undefined && packagesToRemove.length > 0) {
          let cmd = `chroot ${this.installTarget} pacman -R\n`
          for (const elem of packagesToRemove) {
            cmd += elem + ' '
          }

          await exec(`${cmd} ${echoYes}`, this.echo)
        }

        if (packagesToInstall != undefined && packagesToInstall.length > 0) {
          for (const elem of packagesToInstall) {
            await exec(`chroot ${this.installTarget} pacman -S ${elem}`, echoYes)
          }
        }

        break
      }

      case 'apk': {
        /**
         * apk
         */
        if (packagesToRemove != undefined && packagesToRemove.length > 0) {
          let cmd = `chroot ${this.installTarget} apk del `
          for (const elem of packagesToRemove) {
            cmd += elem + ' '
          }

          await exec(`${cmd} ${this.toNull}`, this.echo)
        }

        if (packagesToInstall != undefined && packagesToInstall.length > 0) {
          let cmd = `chroot ${this.installTarget} apk add `
          for (const elem of packagesToInstall) {
            cmd += elem + ' '
          }

          await exec(`${cmd} ${this.toNull}`, this.echo)
        }

        break
      }
      // No default
    }
  }
}
