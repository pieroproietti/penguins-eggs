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

    let cmd
    if (!fs.existsSync(this.settings.config.snapshot_dir)) {
        cmd = `mkdir -p ${this.settings.config.snapshot_dir}`
        tryCatch(cmd, this.verbose)
    }

    if (!fs.existsSync(this.settings.config.snapshot_dir + '/README.md')) {
        cmd = `cp ${path.resolve(__dirname, '../../../conf/README.md')} ${this.settings.config.snapshot_dir}README.md`
        tryCatch(cmd, this.verbose)
    }

    // Ovarium
    if (!fs.existsSync(this.settings.work_dir.ovarium)) {
        cmd = `mkdir -p ${this.settings.work_dir.ovarium}`
        tryCatch(cmd, this.verbose)
    }

    if (!fs.existsSync(this.settings.work_dir.lowerdir)) {
        cmd = `mkdir -p ${this.settings.work_dir.lowerdir}`
        tryCatch(cmd, this.verbose)
    }

    if (!fs.existsSync(this.settings.work_dir.upperdir)) {
        cmd = `mkdir -p ${this.settings.work_dir.upperdir}`
        tryCatch(cmd, this.verbose)
    }

    if (!fs.existsSync(this.settings.work_dir.workdir)) {
        cmd = `mkdir -p ${this.settings.work_dir.workdir}`
        tryCatch(cmd, this.verbose)
    }

    if (!fs.existsSync(this.settings.work_dir.merged)) {
        cmd = `mkdir -p ${this.settings.work_dir.merged}`
        tryCatch(cmd, this.verbose)
    }

    /**
     * Creo le directory di destinazione per boot, efi, isolinux e live
     */
    if (!fs.existsSync(this.settings.iso_work)) {
        cmd = `mkdir -p ${this.settings.iso_work}boot/grub/${Utils.uefiFormat()}`
        tryCatch(cmd, this.verbose)

        cmd = `mkdir -p ${this.settings.iso_work}isolinux`
        tryCatch(cmd, this.verbose)

        cmd = `mkdir -p ${this.settings.iso_work}live`
        tryCatch(cmd, this.verbose)
    }

    // ln iso sempre fresco
    cmd = `ln -s ${this.settings.iso_work} ${this.settings.config.snapshot_dir}/iso`
    tryCatch(cmd, this.verbose)

    // ln livefs we MUST delete it before!
    cmd = `rm -f ${this.settings.config.snapshot_dir}/livefs`
    cmd += `ln -s ${this.settings.work_dir.merged} ${this.settings.config.snapshot_dir}/livefs`
    tryCatch(cmd, this.verbose)

    // we MUST delete /etc and /boot who are copied
    cmd = `rm -rf ${this.settings.config.snapshot_dir}/livefs/etc`
    cmd += `rm -rf ${this.settings.config.snapshot_dir}/livefs/boot`
    tryCatch(cmd, this.verbose)

}


/**
 *
 * @param cmd
 */
async function tryCatch(cmd = '', verbose = false) {
    try {
        let echo = Utils.setEcho(verbose)
        if (verbose) {
            console.log(cmd)
        }

        await exec(cmd, echo)
    } catch (error) {
        console.log(`Error: ${error}`)
        await Utils.pressKeyToExit(cmd)
    }
}

