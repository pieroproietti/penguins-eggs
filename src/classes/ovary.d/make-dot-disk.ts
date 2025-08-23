/**
 * ./src/classes/ovary.d/produce.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
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
    const dotDisk = this.settings.iso_work + '.disk';
    if (fs.existsSync(dotDisk)) {
        shx.rm('-rf', dotDisk);
    }
    shx.mkdir('-p', dotDisk);

    
    /**
     * write volid .disk/info 
     * Required
     */
    let volidContent = this.settings.isoFilename
    fs.writeFileSync(path.join(dotDisk, 'info'), volidContent, 'utf-8')


    /**
     * A readme now replace the old .disk/info
     */
    let readme = ``
    readme += `# penguins_eggs\n`
    readme += `\n`
    readme += `Volinfo: ${this.volid}\n`
    readme += `Image created at: ${Utils.formatDate(new Date())} using penguins_eggs v. ${Utils.getPackageVersion()})\n`
    readme += `repo: [penguins-eggs](https://github.com/penguins-eggs)\n`
    readme += `blog: [penguins-eggs.net](https://penguins-eggs.net)\n`
    readme += `author: [Piero Proietti](mailto://piero.proietti@gmail.com)\n`
    fs.writeFileSync(path.join(dotDisk, 'README.md'), readme, 'utf-8');

    /**
     * write mksquashfs as .disk/mksquashfs
     */
    fs.writeFileSync(path.join(dotDisk, 'mksquashfs'), mksquashfs, 'utf-8');

    /**
     * write mkisofs as .disk/mkisofs
     */
    fs.writeFileSync(path.join(dotDisk, 'mkisofs'), mkisofs, 'utf-8');

    /**
     * touch uuid as file name on .disk/id
     * 
     * This is a DEBIAN standard
     */
    if (this.uuid && this.uuid.trim() !== '') {
        shx.mkdir(path.join(dotDisk, 'id'))
        shx.touch(path.join(dotDisk, 'id', this.uuid))
    }
}
