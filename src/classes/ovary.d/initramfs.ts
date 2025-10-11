/**
 * ./src/classes/ovary.d/initramfs.ts
 * penguins-eggs v.25.19.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import path, { resolve } from 'node:path'

// classes
import { exec } from '../../lib/utils.js'
import Ovary from '../ovary.js'
import Utils from '../utils.js'


// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)


/**
 * initramfsDebian
 */
export async function initramfsDebianLuks(this: Ovary, verbose = true) {
    Utils.warning(`creating ${this.initrd} using mkinitramfs  on (ISO)/live`)

    const src = path.join(__dirname, `../../../initramfs-crypto/initramfs-tools`)
    const dest = `/etc/initramfs-tools/`
    await exec(`cp -r ${src} ${dest}`)

    const prefix = this.settings.config.snapshot_prefix
    const log=`> ${this.settings.iso_work}${prefix}dracut.log.txt 2>&1`
    const cmd=`mkinitramfs -o ${this.settings.iso_work}live/${path.basename(this.initrd)} ${this.kernel} -v ${log}`

    console.log(cmd)
    await exec(cmd, this.echo)
}

