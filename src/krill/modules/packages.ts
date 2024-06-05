/**
 * ./src/krill/modules/packages.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import yaml from 'js-yaml'
import fs from 'node:fs'

import Pacman from '../../classes/pacman.js'
import Utils from '../../classes/utils.js'
import { IPackages } from '../../interfaces/i-packages.js'
import { exec } from '../../lib/utils.js'
import Sequence from '../sequence.js'


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
  console.log(config_file)
  if (fs.existsSync(config_file)) {
    let packages: IPackages = yaml.load(fs.readFileSync(config_file, 'utf8')) as IPackages

    let packagesToInstall: string[] | undefined = []
    let packagesToRemove: string[] | undefined = []
    for (let operation of packages.operations) {
      if ('try_remove' in operation) {
        packagesToRemove = operation.try_remove;
      }
      if ('try_install' in operation) {
        packagesToInstall = operation.try_install;
      }
    }

    
    if (packages.backend === 'apt') {
      // Debian/Devuan/Ubuntu
      if (packagesToRemove != undefined) {
        if (packagesToRemove.length > 0) {
          let cmd = `chroot ${this.installTarget} apt-get purge -y `
          for (const elem of packagesToRemove) {
            if (Pacman.packageIsInstalled(elem)) {
              cmd += elem + ' '
            }
          }
          await exec(`${cmd} ${this.toNull}`, this.echo)
          let autoremove =`chroot ${this.installTarget} apt-get autoremove -y ${this.toNull}`
          await exec(autoremove, this.echo)
          console.clear()
          console.log(cmd)
          console.log(autoremove)
          await Utils.pressKeyToExit()
        }
      }

      if (packagesToInstall != undefined) {
        if (packagesToInstall.length > 0) {
        let cmd = `chroot ${this.installTarget} apt-get install -y `
          for (const elem of packagesToInstall) {
            cmd += elem + ' '
          }
          let update = `chroot ${this.installTarget} apt-get update ${this.toNull}`
          await exec(update, this.echo)
          await exec(`${cmd} ${this.toNull}`, this.echo)
          console.clear()
          console.log(update)
          console.log(cmd)
          await Utils.pressKeyToExit()
        }
      }

    } else if (packages.backend === 'pacman') {

      // arch/manjaro
      if (packagesToRemove != undefined) {
          if (packagesToRemove.length > 0) {
          let cmd = `chroot ${this.installTarget} pacman -R\n`
          for (const elem of packagesToRemove) {
            cmd += elem + ' '
          }
          await exec(`${cmd} ${echoYes}`, this.echo)
        }
      }

      if (packagesToInstall != undefined) {
        if (packagesToInstall.length > 0) {
          for (const elem of packagesToInstall) {
            await exec(`chroot ${this.installTarget} pacman -S ${elem}`, echoYes)
          }
        }
      }
    }
  }
}

