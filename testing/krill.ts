#!/usr/bin/pnpx ts-node

import fs from 'fs'
import yaml from 'js-yaml'
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript'

import Utils from '../src/classes/utils'
import { IPackages } from '../src/interfaces/i-packages'


start()

async function start() {
    let echoYes = Utils.setEcho(true)
    const config_file = `/etc/calamares/modules/packages.conf`
    if (fs.existsSync(config_file)) {
        const packages = yaml.load(fs.readFileSync(config_file, 'utf-8')) as IPackages

        console.log("packages")
        console.log (packages)

        let operations = Object.assign([], packages.operations)
        console.log ()
        console.log("operations")
        console.log (operations)

        console.log ()
        console.log ('operations list')
        for (const operation of operations) {
            console.log(JSON.stringify(operation))
        }

        let remove = Object.assign([], packages.operations.remove)
        console.log ()
        console.log("remove")
        console.log(remove)

        remove = Object.assign([], operations.remove)
        console.log ()
        console.log("remove")
        console.log(remove)

        let try_install = Object.assign([], packages.operations.try_install)
        console.log ()
        console.log("try_install")
        console.log(try_install)
    }
}

