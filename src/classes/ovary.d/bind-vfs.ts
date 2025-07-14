/**
 * ./src/classes/ovary.d/bind-live-fs.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import path from 'node:path'

// classes
import Ovary from '../ovary.js'
import Utils from '../utils.js'

// functions
import rexec from './rexec.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
   * bind dei virtual file system
   */
export async function bindVfs(this: Ovary) {
    if (this.verbose) {
        console.log('Ovary: bindVfs')
    }

    const cmds: string[] = []
    cmds.push(
        `mount -o bind /dev ${this.settings.work_dir.merged}/dev`,
        `mount -o bind /dev/pts ${this.settings.work_dir.merged}/dev/pts`,
        `mount -o bind /proc ${this.settings.work_dir.merged}/proc`,
        `mount -o bind /sys ${this.settings.work_dir.merged}/sys`,
        `mount -o bind /run ${this.settings.work_dir.merged}/run`
    )
    // Utils.writeXs(`${this.settings.config.snapshot_dir}bindvfs`, cmds)
    Utils.writeXs(`${this.settings.work_dir.ovarium}bindvfs`, cmds)
}


/**
 *
 * @param verbose
 */
export async function ubindVfs(this: Ovary) {
    if (this.verbose) {
        console.log('Ovary: ubindVfs')
    }

    const cmds: string[] = []
    cmds.push(`umount ${this.settings.work_dir.merged}/dev/pts`, `umount ${this.settings.work_dir.merged}/dev`, `umount ${this.settings.work_dir.merged}/proc`, `umount ${this.settings.work_dir.merged}/run`, `umount ${this.settings.work_dir.merged}/sys`)
    // Utils.writeXs(`${this.settings.config.snapshot_dir}ubindvfs`, cmds)
    Utils.writeXs(`${this.settings.work_dir.ovarium}ubindvfs`, cmds)
}
