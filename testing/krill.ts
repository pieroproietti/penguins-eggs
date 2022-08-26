#!/usr/bin/pnpx ts-node

import fs from 'fs'
import yaml from 'js-yaml'
import Utils from '../src/classes/utils'
import { IPackages } from '../src/interfaces/i-packages'

start()

/**
 * 
 */
async function start() {
    let echoYes = Utils.setEcho(true)
    const config_file = `/etc/calamares/modules/packages.conf`
    if (fs.existsSync(config_file)) {
        const packages = yaml.load(fs.readFileSync(config_file, 'utf-8')) as IPackages

        console.clear()

        let operations = JSON.parse(JSON.stringify(packages.operations))

        if (operations.length === 2) {
            for (const remPack of operations[0].remove) {
                console.log('apt-get purge -y ' + remPack)
            }
            for (const addPack of operations[1].try_install) {
                console.log('apt-get install -y ' + addPack)
            }
        } else {
            for (const addPack of operations[0].try_install) {
                console.log('apt-get install -y ' + addPack)
            }
        }
    }
}

