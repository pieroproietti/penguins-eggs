
import yaml from 'js-yaml'
import fs from 'node:fs'
import {stringify} from 'node:querystring'

import Utils from '../src/classes/utils'
import {IPackages} from '../src/interfaces/i-packages'

start()

/**
 *
 */
async function start() {
  const echoYes = Utils.setEcho(true)
  const config_file = '/etc/calamares/modules/packages.conf'

  console.clear()
  if (fs.existsSync(config_file)) {
    const packages = yaml.load(fs.readFileSync(config_file, 'utf8')) as IPackages
    console.log('YAML')
    console.log(yaml.dump(packages))

    console.log('JSON')
    console.log(JSON.stringify(packages))
    console.log()

    console.log('packages:')
    console.log(packages)
    console.log()

    const operations = JSON.parse(JSON.stringify(packages.operations))
    let remove: string[] = []
    let install: string[] = []

    remove = operations[0].remove
    if (operations.length > 1) {
      install = operations[1].install
    }

    console.log('remove')
    console.log(remove)
    console.log()

    console.log('install')
    console.log(install)
    console.log()

    if (operations !== undefined && packages.backend === 'apt' && remove.length > 0) {
      let ctr = 'chroot apt-get purge -y '
      for (const elem of remove) {
        ctr += elem + ' '
      }

      console.log(`${ctr}`)
      console.log('apt-get autoremove -y ')
    }
  }
}

