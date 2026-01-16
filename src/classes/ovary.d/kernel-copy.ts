/**
 * ./src/classes/ovary.d/produce.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
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
import Ovary from './../ovary.js'
// classes
import Utils from './../utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * kernelCopy
 */
export async function kernelCopy(this: Ovary) {
  Utils.warning(`copying ${path.basename(this.vmlinuz)} on (ISO)/live`)
  await exec(`cp ${this.vmlinuz} ${this.settings.iso_work}live/`, this.echo)
}
