/**
 * ./src/classes/ovary.d/produce.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

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
   * kernelCopy
   */
export async function kernelCopy(this: Ovary) {
    Utils.warning(`copying ${path.basename(this.settings.kernel_image)} on ISO/live`)

    let lackVmlinuzImage = false
    if (fs.existsSync(this.settings.kernel_image)) {
        await exec(`cp ${this.settings.kernel_image} ${this.settings.iso_work}live/`, this.echo)
    } else {
        Utils.error(`Cannot find ${this.settings.kernel_image}`)
        lackVmlinuzImage = true
    }

    if (lackVmlinuzImage) {
        Utils.warning('Try to edit /etc/penguins-eggs.d/eggs.yaml and check for')
        Utils.warning(`vmlinuz: ${this.settings.kernel_image}`)
        process.exit(1)
    }
}

