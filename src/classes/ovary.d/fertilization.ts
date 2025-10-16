/**
 * ./src/classes/xorriso-command.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */


// packages
import path from 'node:path'

// classes
import Ovary from '../ovary.js'
import Settings from '../settings.js'
import Utils from '../utils.js'
import Distro from '../distro.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)
/**
 * @returns {boolean} success
 */
export async function fertilization(this: Ovary, snapshot_prefix = '', snapshot_basename = '', theme = '', compression = '', nointeratctive = false): Promise<boolean> {

    // familyId, distroId from Distro
    const distro = new Distro()
    this.familyId = distro.familyId
    this.distroId = distro.distroId
    this.distroLike = distro.distroLike
    this.distroLliveMediumPath = distro.liveMediumPath

    this.settings = new Settings()

    if (await this.settings.load()) {
        await this.settings.loadRemix(this.theme)
        this.volid = Utils.getVolid(this.settings.remix.name)

        this.uuid = Utils.uuidGen()

        //this.familyId = this.settings.distro.familyId
        this.nest = this.settings.config.snapshot_mnt

        if (snapshot_prefix !== '') {
            this.settings.config.snapshot_prefix = snapshot_prefix
        }

        if (snapshot_basename !== '') {
            this.settings.config.snapshot_basename = snapshot_basename
        }

        if (theme !== '') {
            this.theme = theme
        }

        if (compression !== '') {
            this.settings.config.compression = compression
        }

        if (!nointeratctive) {
            return true
        }

        this.settings.listFreeSpace()
        if (await Utils.customConfirm('Select yes to continue...')) {
            return true
        }
    }

    return false
}
