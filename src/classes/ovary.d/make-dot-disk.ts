/**
 * ./src/classes/ovary.d/produce.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import chalk from 'chalk'
import mustache from 'mustache'

// packages
import fs, { Dirent } from 'node:fs'
import shx from 'shelljs'
import path from 'path'

// interfaces

// libraries

// classes
import Utils from './../utils.js'
import Ovary from './../ovary.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
   * makeDotDisk
   */
export function makeDotDisk(this: Ovary, info = '', mksquashfs = '', mkisofs = '') {
    if (this.verbose) {
        console.log('Ovary: makeDotDisk')
    }

    const dotDisk = this.settings.iso_work + '.disk'
    if (fs.existsSync(dotDisk)) {
        shx.rm('-rf', dotDisk)
    }

    shx.mkdir('-p', dotDisk)
    // let text = `# Created at: ${Utils.formatDate(new Date())}\n`
    // text += `# penguins_eggs v. ${Utils.getPackageVersion()}\n`
    let text = this.volid // We need for boot from ISO

    // .disk/info
    fs.writeFileSync(dotDisk + '/info', text, 'utf-8')

    // .disk/mksquashfs
    fs.writeFileSync(dotDisk + '/mksquashfs', text + mksquashfs, 'utf-8')

    // .disk/mkisofs
    fs.writeFileSync(dotDisk + '/mkisofs', text + mkisofs, 'utf-8')
}
