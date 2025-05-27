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
        console.log('Ovary: makeDotDisk');
    }

    const dotDisk = this.settings.iso_work + '.disk';
    if (fs.existsSync(dotDisk)) {
        shx.rm('-rf', dotDisk);
    }

    shx.mkdir('-p', dotDisk);
    let text = `# Created at: ${Utils.formatDate(new Date())}\n`;
    text += `# penguins_eggs v. ${Utils.getPackageVersion()}\n`;

    // .disk/info
    fs.writeFileSync(dotDisk + '/info', text, 'utf-8');

    // Fix: Ensure this.uuid is valid
    if (!this.uuid || this.uuid.trim() === '') {
        this.uuid = 'default_id';
    }

    // Fix: Write to .disk/id as a FILE (not directory)
    fs.writeFileSync(path.join(dotDisk, 'id'), this.uuid, 'utf-8');

    // .disk/mksquashfs
    fs.writeFileSync(dotDisk + '/mksquashfs', text + mksquashfs, 'utf-8');

    // .disk/mkisofs
    fs.writeFileSync(dotDisk + '/mkisofs', text + mkisofs, 'utf-8');
}

/*
export function makeDotDisk(this: Ovary, info = '', mksquashfs = '', mkisofs = '') {
    if (this.verbose) {
        console.log('Ovary: makeDotDisk')
    }

    const dotDisk = this.settings.iso_work + '.disk'
    if (fs.existsSync(dotDisk)) {
        shx.rm('-rf', dotDisk)
    }

    shx.mkdir('-p', dotDisk)
    let text = `# Created at: ${Utils.formatDate(new Date())}\n`
    text += `# penguins_eggs v. ${Utils.getPackageVersion()}\n`

    // .disk/info
    fs.writeFileSync(dotDisk + '/info', text, 'utf-8')

    shx.mkdir('-p', path.join(dotDisk, 'id'))
    fs.writeFileSync(path.join(dotDisk, '/id', this.uuid), this.uuid, 'utf-8')

    // .disk/mksquashfs
    fs.writeFileSync(dotDisk + '/mksquashfs', text + mksquashfs, 'utf-8')

    // .disk/mkisofs
    fs.writeFileSync(dotDisk + '/mkisofs', text + mkisofs, 'utf-8')
}
*/