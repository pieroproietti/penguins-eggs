/**
 * ./src/classes/ovary.d/live-create-structure.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import chalk from 'chalk'
import mustache from 'mustache'

// packages
import fs from 'node:fs'
import path from 'path'

// interfaces

// libraries
import { exec } from '../../lib/utils.js'

// classes
import Utils from './../utils.js'
import Ovary from './../ovary.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
   * Crea la struttura della workdir
   */
export async function liveCreateStructure(this: Ovary) {
    if (this.verbose) {
        console.log('Ovary: liveCreateStructure')
    }

    const nest = this.settings.config.snapshot_dir
    const dotIso = this.settings.iso_work
    const dotOverlay = this.settings.work_dir
    Utils.warning(`creating egg in ${nest}`)

    let cmd=''
    cmd = `# create nest\n`
    cmd += `mkdir -p ${nest}\n`
    cmd += `# README.md\n`
    cmd += `cp ${path.resolve(__dirname, '../../../conf/README.md')} ${nest}README.md\n`

    cmd += `# remove .overlay\n`
    cmd += `rm -rf ${dotOverlay}`
    cmd += `mkdir -p ${dotOverlay.lowerdir}\n`
    cmd += `mkdir -p ${dotOverlay.upperdir}\n`
    cmd += `mkdir -p ${dotOverlay.workdir}\n`
    cmd += `mkdir -p ${dotOverlay.merged}\n`

    cmd += `# remove dotIso\n`
    cmd += `rm -rf ${dotIso}\n`
    cmd += `mkdir -p ${dotIso}boot/grub/${Utils.uefiFormat()}\n`
    cmd += `mkdir -p ${dotIso}isolinux\n`
    cmd += `mkdir -p ${dotIso}live\n`

    cmd += `# ovarium\n`
    cmd += `rm -rf ${dotOverlay.ovarium}\n`
    cmd += `mkdir -p ${dotOverlay.ovarium}\n`

    cmd += `# Links\n`
    cmd += `rm -f ${nest}/iso\n`
    cmd += `ln -s ${dotIso} ${nest}/iso\n`
    cmd += `rm -f ${nest}/livefs\n`
    cmd += `ln -s ${dotOverlay.merged} ${nest}/livefs\n`
    tryCatch(cmd, true)
}


/**
 *
 * @param cmd
 */
async function tryCatch(cmd = '', verbose = false) {
    try {
        let echo = Utils.setEcho(verbose)

        await exec(cmd, echo)
    } catch (error) {
        console.log(`Error: ${error}`)
        await Utils.pressKeyToExit(cmd)
    }
}

