/**
 * ./src/classes/ovary.d/initramfs.ts
 * penguins-eggs v.25.19.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import path from 'node:path'

// classes
import { exec } from '../../lib/utils.js'
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import shx from 'shelljs'


// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)


/**
 * initramfsDebian
 */
export async function initramfsDebianLuks(this: Ovary, verbose = false) {
    Utils.warning(`creating ${this.initrd} using mkinitramfs on (ISO)/live`)

    // create /etc/initramfs-tools/scripts/init-premount/unlock
    await unlock(true)
    await exec(`mkinitramfs -o ${this.settings.iso_work}live/${path.basename(this.initrd)} ${this.kernel} ${this.toNull}`, this.echo)
    await unlock(false)
}

/**
 * 
 * @param add 
 */
async function unlock(add = false) {
    const dest = '/etc/initramfs-tools/scripts/init-premount/unlock'
    if (add) {
        shx.cp(path.resolve(__dirname, '../../../scripts/unlock'), dest)
    } else {
        shx.rm(dest)
    }
}
