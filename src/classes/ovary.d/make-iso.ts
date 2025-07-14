/**
 * ./src/classes/ovary.d/make-iso.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
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

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * makeIso
 * cmd: cmd 4 xorriso
 */
export async function makeIso(this: Ovary, cmd: string, scriptOnly = false) {
    // echo = { echo: true, ignore: false }
    if (this.verbose) {
        console.log('Ovary: makeIso')
    }

    Utils.writeX(`${this.settings.work_dir.ovarium}mkisofs`, cmd)

    // Create link to iso ALLWAYES
    const src = this.settings.config.snapshot_mnt + this.settings.isoFilename
    const dest = this.settings.config.snapshot_dir + this.settings.isoFilename
    await exec(`ln -s ${src} ${dest}`)

    if (!scriptOnly) {
        const test = (await exec(cmd, Utils.setEcho(true))).code
        if (test !== 0) {
            process.exit()
        }

        // Create link to iso
        const src = this.settings.config.snapshot_mnt + this.settings.isoFilename
        const dest = this.settings.config.snapshot_dir + this.settings.isoFilename
        await exec(`ln -s ${src} ${dest}`)

        // Create md5sum, sha256sum
        if (this.settings.config.make_md5sum) {
            Utils.warning('creating md5, sha256')
            await exec(`md5sum ${src} > ${dest.replace('.iso', '.md5')}`)
            await exec(`sha256sum ${src} > ${dest.replace('.iso', '.sha256')}`)
        }
    }
}
