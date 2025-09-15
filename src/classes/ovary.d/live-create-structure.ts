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

    Utils.warning(`creating egg in ${this.settings.config.snapshot_dir}`)

    let cmd=''
    cmd = `# create nest\n`
    cmd += `mkdir -p ${this.settings.config.snapshot_dir}\n`
    cmd += `# README.md\n`
    cmd += `cp ${path.resolve(__dirname, '../../../conf/README.md')} ${this.settings.config.snapshot_dir}README.md\n`
    cmd += `# ovarium\n`
    cmd += `rm -rf ${this.settings.work_dir.ovarium}\n`
    cmd += `mkdir -p ${this.settings.work_dir.ovarium}\n`
    cmd += `# lowerdir\n`
    cmd += `rm -rf ${this.settings.work_dir.lowerdir}\n`
    cmd += `mkdir -p ${this.settings.work_dir.lowerdir}\n`
    cmd += `# upperdir\n`
    cmd += `rm -rf ${this.settings.work_dir.upperdir}\n`
    cmd += `mkdir -p ${this.settings.work_dir.upperdir}\n`
    cmd += `# workdir\n`
    cmd += `rm -rf ${this.settings.work_dir.workdir}\n`
    cmd += `mkdir -p ${this.settings.work_dir.workdir}\n`
    cmd += `# merged\n`
    cmd += `rm -rf ${this.settings.work_dir.merged}\n`
    cmd += `mkdir -p ${this.settings.work_dir.merged}\n`
    cmd += `\n`
    cmd += `rm -rf ${this.settings.iso_work}boot/grub/${Utils.uefiFormat()}\n`
    cmd += `mkdir -p ${this.settings.iso_work}boot/grub/${Utils.uefiFormat()}\n`
    cmd += `\n`
    cmd += `rm -rf ${this.settings.iso_work}isolinux\n`
    cmd += `mkdir -p ${this.settings.iso_work}isolinux\n`
    cmd += `\n`
    cmd += `rm -rf ${this.settings.iso_work}live\n`
    cmd += `mkdir -p ${this.settings.iso_work}live\n`
    cmd += `\n`
    cmd += `ln -s ${this.settings.iso_work} ${this.settings.config.snapshot_dir}/iso\n`
    cmd += `\n`
    cmd += `rm ${this.settings.config.snapshot_dir}/iso\n`
    cmd += `ln -s ${this.settings.iso_work} ${this.settings.config.snapshot_dir}/iso\n`
    cmd += `\n`
    cmd += `rm -f ${this.settings.config.snapshot_dir}/livefs\n`
    cmd += `ln -s ${this.settings.work_dir.merged} ${this.settings.config.snapshot_dir}/livefs\n`
    tryCatch(cmd, this.verbose)
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

