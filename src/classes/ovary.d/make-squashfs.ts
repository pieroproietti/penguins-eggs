/**
 * ./src/classes/ovary.d/make-squashfs.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'
import path from 'node:path'
import shx from 'shelljs'
import Diversions from '../diversions.js'

// classes
import { exec } from '../../lib/utils.js'
import Ovary from '../ovary.js'
import Utils from '../utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * squashFs: crea in live filesystem.squashfs
 */
export async function makeSquashfs(this: Ovary, scriptOnly = false, includeRootHome = false): Promise<string> {
    if (this.verbose) {
        console.log('Ovary: makeSquashfs')
    }

    /**
     * exclude all the accurence of cryptdisks in rc0.d, etc
     */
    const fexcludes = [
        '/boot/efi/EFI',
        '/boot/loader/entries/',
        '/etc/fstab',
        '/var/lib/containers/',
        '/var/lib/docker/',
        '/etc/mtab',
        '/etc/udev/rules.d/70-persistent-cd.rules',
        '/etc/udev/rules.d/70-persistent-net.rules',
    ]

    for (const i in fexcludes) {
        this.addExclusion(fexcludes[i])
    }

    /**
     * Non sò che fa, ma sicuro non serve per archlinux
     */
    if (this.familyId === 'debian') {
        const rcd = ['rc0.d', 'rc1.d', 'rc2.d', 'rc3.d', 'rc4.d', 'rc5.d', 'rc6.d', 'rcS.d']
        let files: string[]
        // escludo per ci
        for (const i in rcd) {
            if (fs.existsSync(`${this.settings.work_dir.merged}/etc/${rcd[i]}`)) {
                files = fs.readdirSync(`${this.settings.work_dir.merged}/etc/${rcd[i]}`)
                for (const n in files) {
                    if (files[n].includes('cryptdisks')) {
                        this.addExclusion(`/etc/${rcd[i]}${files[n]}`)
                    }
                }
            }
        }
    }

    /**
     * secure
     */
    if (!includeRootHome) {
        this.addExclusion(`root/*`)
        this.addExclusion(`root/.*`)
    }

    this.addExclusion(this.settings.config.snapshot_dir /* .absolutePath() */)

    if (fs.existsSync(`${this.settings.iso_work}/live/filesystem.squashfs`)) {
        fs.unlinkSync(`${this.settings.iso_work}/live/filesystem.squashfs`)
    }

    const compression = `-comp ${this.settings.config.compression}`

    /**
     * limit: patch per Raspberry
     */
    const limit = ''
    if (Utils.uefiArch() === 'arm64') {
        // limit = ' -processors 2 -mem 1024M'
    }

    /**
     * mksquashfs
     *
     * SYNTAX: mksquashfs source1 source2 ...
     * FILESYSTEM [OPTIONS]
     * [-ef exclude.list]
     * [-e list of exclude dirs/files]
     */
    let sfsName = "filesystem.squashfs"
    let cmd = `mksquashfs ${this.settings.work_dir.merged} ${this.settings.iso_work}live/${sfsName} ${compression} ${limit} -no-xattrs -wildcards -ef ${this.settings.config.snapshot_excludes} ${this.settings.session_excludes}`

    cmd = cmd.replaceAll(/\s\s+/g, ' ')

    Utils.writeX(`${this.settings.work_dir.ovarium}mksquashfs`, cmd)
    if (!scriptOnly) {
        Utils.warning('creating filesystem.squashfs on (ISO)/live')
        // Utils.warning(`compression: ` + compression)
        const test = (await exec(cmd, Utils.setEcho(true))).code
        if (test !== 0) {
            process.exit()
        }
    }

    return cmd
}


/**
 * Add or remove exclusion
 * @param add {boolean} true = add, false remove
 * @param exclusion {string} path to add/remove
 */
export function addExclusion(this: Ovary, exclusion: string): void {
    if (this.verbose) {
        console.log(`add exclusion: ${exclusion}`)
    }

    if (exclusion.startsWith('/')) {
        exclusion = exclusion.slice(1) // remove / initial Non compatible with rsync
    }
    this.settings.session_excludes += this.settings.session_excludes === '' ? `-e '${exclusion}' ` : ` '${exclusion}' `

}
