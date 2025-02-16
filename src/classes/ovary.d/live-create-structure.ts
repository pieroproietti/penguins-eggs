/**
 * ./src/classes/ovary.d/live-create-structure.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
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
        this.tryCatch(cmd)
    }

    if (!fs.existsSync(this.settings.config.snapshot_dir + '/README.md')) {
        cmd = `cp ${path.resolve(__dirname, '../../conf/README.md')} ${this.settings.config.snapshot_dir}README.md`
        this.tryCatch(cmd)
    }

    // Ovarium
    if (!fs.existsSync(this.settings.work_dir.ovarium)) {
        cmd = `mkdir -p ${this.settings.work_dir.ovarium}`
        this.tryCatch(cmd)
    }

    if (!fs.existsSync(this.settings.work_dir.lowerdir)) {
        cmd = `mkdir -p ${this.settings.work_dir.lowerdir}`
        this.tryCatch(cmd)
    }

    if (!fs.existsSync(this.settings.work_dir.upperdir)) {
        cmd = `mkdir -p ${this.settings.work_dir.upperdir}`
        this.tryCatch(cmd)
    }

    if (!fs.existsSync(this.settings.work_dir.workdir)) {
        cmd = `mkdir -p ${this.settings.work_dir.workdir}`
        this.tryCatch(cmd)
    }

    if (!fs.existsSync(this.settings.work_dir.merged)) {
        cmd = `mkdir -p ${this.settings.work_dir.merged}`
        this.tryCatch(cmd)
    }

    /**
     * Creo le directory di destinazione per boot, efi, isolinux e live
     */
    if (!fs.existsSync(this.settings.iso_work)) {
        cmd = `mkdir -p ${this.settings.iso_work}boot/grub/${Utils.uefiFormat()}`
        this.tryCatch(cmd)

        cmd = `mkdir -p ${this.settings.iso_work}isolinux`
        this.tryCatch(cmd)

        cmd = `mkdir -p ${this.settings.iso_work}live`
        this.tryCatch(cmd)
    }

    // ln iso
    cmd = `ln -s ${this.settings.iso_work} ${this.settings.config.snapshot_dir}/iso`
    this.tryCatch(cmd)

    // ln livefs
    cmd = `ln -s ${this.settings.work_dir.merged} ${this.settings.config.snapshot_dir}/livefs`
    this.tryCatch(cmd)
}


/**
 *
 * @param cmd
 */
export async function tryCatch(this: Ovary, cmd = '') {
    if (this.verbose) {
        console.log('Ovary: tryCatch')
    }

    try {
        await exec(cmd, this.echo)
    } catch (error) {
        console.log(`Error: ${error}`)
        await Utils.pressKeyToExit(cmd)
    }
}
