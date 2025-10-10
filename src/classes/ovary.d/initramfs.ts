/**
 * ./src/classes/ovary.d/initramfs-arch.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import mustache from 'mustache'
import fs from 'fs'
import path from 'node:path'

// classes
import { exec } from '../../lib/utils.js'
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import Diversions from '../diversions.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)



/**
 * initramfsDebian
 */
export async function initramfsDebianLuks(this: Ovary, verbose = false) {
    Utils.warning(`creating ${this.initrd} using mkinitramfs on (ISO)/live`)

    let isCrypted = false

    if (fs.existsSync('/etc/crypttab')) {
        isCrypted = true
        await exec('mv /etc/crypttab /etc/crypttab.saved', this.echo)
    }
    await exec(`mkinitramfs -o ${this.settings.iso_work}live/${path.basename(this.initrd)} ${this.kernel} ${this.toNull}`, this.echo)
    if (isCrypted) {
        await exec('mv /etc/crypttab.saved /etc/crypttab', this.echo)
    }
}
