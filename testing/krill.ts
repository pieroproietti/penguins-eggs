
import yaml from 'js-yaml'
import fs from 'node:fs'

import Utils from '../src/classes/utils'
import {IPackages} from '../src/interfaces/i-packages'

start()

/**
 *
 */
async function start() {
  const echoYes = Utils.setEcho(true)
  const config_file = '/etc/calamares/modules/packages.conf'
  if (fs.existsSync(config_file)) {
    const packages = yaml.load(fs.readFileSync(config_file, 'utf8')) as IPackages

    console.log(packages)
    const operations = JSON.parse(JSON.stringify(packages.operations))

    console.log(operations)
    let packagesToRemove: string[] = []
    let packagesToInstall: string[] = []

    console.log('operation.lenght:' + operations.length)
    if (operations.length > 1) {
      packagesToRemove = operations[0].remove
      packagesToInstall = operations[1].try_install
    } else {
      packagesToInstall = operations[0].try_install
    }

    console.log('packageToInstall: ' + packagesToInstall)
    console.log('packageToRemove: ' + packagesToRemove)

    if (packages.backend === 'apt') {
      if (packagesToRemove.length > 0) {
        let ctr = 'chroot apt-get purge -y '
        for (const packageToRemove of packagesToRemove) {
          ctr += packageToRemove + ' '
        }

        console.log(`${ctr}`)
        console.log('apt-get autoremove -y ')
      }

      for (const packageToInstall of packagesToInstall) {
        console.log(`apt-get purge -y ${packageToInstall} `)
      }
    } else if (packages.backend === 'pacman') {
      if (packagesToRemove !== undefined) {
        let ctr = 'chroot  pacman -S '
        for (const packageToRemove of packagesToRemove) {
          ctr += packageToRemove + ' '
        }

        console.log(`${ctr}`)
      }

      if (packagesToInstall !== undefined) {
        for (const packageToInstall of packagesToInstall) {
          console.log(`pacman -S ${packageToInstall}`)
        }
      }
    }
  }
}

