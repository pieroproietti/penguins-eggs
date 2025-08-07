/**
 * ./src/classes/ovary.d/bind-live-fs.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'
import path from 'node:path'
import os from 'os'
import Diversions from '../diversions.js'

// classes
import { exec } from '../../lib/utils.js'
import Ovary from '../ovary.js'
import Utils from '../utils.js'

// functions
import rexec from './rexec.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Esegue il bind del filesystem live e
 * crea lo script bind
 */
export async function bindLiveFs(this: Ovary) {
    if (this.verbose) {
        console.log('Ovary: bindLiveFs')
    }

    /**
     * dirs = readdirsync /
     */
    const dirs = fs.readdirSync('/')
    const startLine = '#############################################################'
    const endLine = '#\n'

    let lnkDest = ''
    let cmd = ''
    const cmds: string[] = []
    cmds.push('# NOTE: cdrom, dev, live, media, mnt, proc, run, sys and tmp', `#       need just a mkdir in ${this.settings.work_dir.merged}`)
    cmds.push(`# host: ${os.hostname()} user: ${await Utils.getPrimaryUser()}\n`)

    for (const dir of dirs) {
        cmds.push(startLine)
        let statDir = fs.lstatSync(`/${dir}`)

        if (statDir.isSymbolicLink()) {
            /**
             * Link
             */
            cmds.push(`# /${dir} is a symbolic link to /${lnkDest}`)
            lnkDest = fs.readlinkSync(`/${dir}`)
            if (fs.existsSync(`${this.settings.work_dir.merged}/${dir}`)) {
                cmds.push('# SymbolicLink exist... skip')
            } else if (fs.existsSync(lnkDest)) {
                cmds.push(`ln -s ${this.settings.work_dir.merged}/${lnkDest} ${this.settings.work_dir.merged}/${lnkDest}`)
            } else {
                cmds.push(await rexec(`cp -r /${dir} ${this.settings.work_dir.merged}`, this.verbose))
            }

        } else if (statDir.isDirectory()) {
            /**
             * Directory
             */
            cmds.push(`# /${dir} is a directory`)
            if (dir !== 'ci' && dir !== 'lost+found') {
                if (this.copied(dir)) {
                    cmds.push(`# /${dir} is copied if not exists on filesystem.squashfs`)
                    let chkDir= path.join(this.settings.config.snapshot_mnt, 'filesystem.squashfs', dir)
                    cmds.push(`if ! [ -d "${chkDir}" ]; then`)
                    cmds.push(await rexec(`   cp -a /${dir} ${this.settings.config.snapshot_mnt}filesystem.squashfs`, this.verbose))
                    cmds.push(`fi`)
                    continue

                } else if (this.mergedAndOverlay(dir)) {
                    cmds.push(`# /${dir} mergedAndOverlay (rw)\n`, '# create mountpoint lower')
                    cmds.push(await makeIfNotExist(`${this.settings.work_dir.lowerdir}/${dir}`), `# first: mount /${dir} rw in ${this.settings.work_dir.lowerdir}/${dir}`)
                    cmds.push(await rexec(`mount --bind --make-slave /${dir} ${this.settings.work_dir.lowerdir}/${dir}`, this.verbose), '# now remount it ro')
                    cmds.push(await rexec(`mount -o remount,bind,ro ${this.settings.work_dir.lowerdir}/${dir}`, this.verbose), `\n# second: create mountpoint upper, work and ${this.settings.work_dir.merged} and mount ${dir}`)
                    cmds.push(await makeIfNotExist(`${this.settings.work_dir.upperdir}/${dir}`, this.verbose))
                    cmds.push(await makeIfNotExist(`${this.settings.work_dir.workdir}/${dir}`, this.verbose))
                    cmds.push(await makeIfNotExist(`${this.settings.work_dir.merged}/${dir}`, this.verbose), `\n# thirth: mount /${dir} rw in ${this.settings.work_dir.merged}`)
                    cmds.push(await rexec(`mount -t overlay overlay -o lowerdir=${this.settings.work_dir.lowerdir}/${dir},upperdir=${this.settings.work_dir.upperdir}/${dir},workdir=${this.settings.work_dir.workdir}/${dir} ${this.settings.work_dir.merged}/${dir}`, this.verbose))

                } else if (this.merged(dir)) {
                    cmds.push(`# /${dir} merged (ro)`)
                    cmds.push(await makeIfNotExist(`${this.settings.work_dir.merged}/${dir}`, this.verbose))
                    cmds.push(await rexec(`mount --bind --make-slave /${dir} ${this.settings.work_dir.merged}/${dir}`, this.verbose))
                    cmds.push(await rexec(`mount -o remount,bind,ro ${this.settings.work_dir.merged}/${dir}`, this.verbose))

                } else {
                    cmds.push(`# /${dir} just created`)
                    cmds.push(await makeIfNotExist(`${this.settings.work_dir.merged}/${dir}`, this.verbose))
                }
            }

            /**
           * File
           */
        } else if (statDir.isFile()) {

            cmds.push(`# /${dir} is just a file`)
            if (fs.existsSync(`${this.settings.work_dir.merged}/${dir}`)) {
                cmds.push('# file exist... skip')
            } else {
                cmds.push(await rexec(`cp -p /${dir} ${this.settings.work_dir.merged}`, this.verbose))
            }
        }

        cmds.push(endLine)
    }

    // Utils.writeXs(`${this.settings.config.snapshot_dir}bind`, cmds)
    Utils.writeXs(`${this.settings.work_dir.ovarium}bind`, cmds)
}




/**
 * ubind del fs live
 * @param verbose
 */
export async function uBindLiveFs(this: Ovary) {
    if (this.verbose) {
        console.log('Ovary: uBindLiveFs')
    }

    const startLine = '#############################################################'
    const endLine = '#\n'

    const cmds: string[] = []
    cmds.push('# NOTE: home, cdrom, dev, live, media, mnt, proc, run, sys and tmp', `#       need just to be removed in ${this.settings.work_dir.merged}`)
    cmds.push(`# host: ${os.hostname()} user: ${await Utils.getPrimaryUser()}\n`)
    if (fs.existsSync(this.settings.work_dir.merged)) {
        const bindDirs = fs.readdirSync(this.settings.work_dir.merged, {
            withFileTypes: true
        })

        for (const dir of bindDirs) {
            const dirname = dir.name
            cmds.push(startLine)
            if (fs.statSync(`/${dirname}`).isDirectory()) {
                cmds.push(`\n# directory: ${dirname}`)
                if (this.copied(dirname)) {
                    cmds.push(`\n# ${dirname} was copied, do nothings`)
                    continue
                    
                } else if (this.mergedAndOverlay(dirname)) {
                    cmds.push(`\n# ${dirname} has overlay`, `\n# First, umount it from ${this.settings.config.snapshot_dir}`)
                    cmds.push(await rexec(`umount ${this.settings.work_dir.merged}/${dirname}`, this.verbose), `\n# Second, umount it from ${this.settings.work_dir.lowerdir}`)
                    cmds.push(await rexec(`umount ${this.settings.work_dir.lowerdir}/${dirname}`, this.verbose))
                } else if (this.merged(dirname)) {
                    cmds.push(await rexec(`umount ${this.settings.work_dir.merged}/${dirname}`, this.verbose))
                }

                cmds.push(`\n# remove in ${this.settings.work_dir.merged} and ${this.settings.work_dir.lowerdir}`)
                /**
                 * We can't remove the nest!!!
                 */
                const nest = this.settings.config.snapshot_dir.split('/')
                // We can't remove first level nest
                if (dirname !== nest[1]) {
                    cmds.push(await rexec(`rm -rf ${this.settings.work_dir.merged}/${dirname}`, this.verbose))
                }
            } else if (fs.statSync(`/${dirname}`).isFile()) {
                cmds.push(`\n# ${dirname} = file`)
                cmds.push(await rexec(`rm -f ${this.settings.work_dir.merged}/${dirname}`, this.verbose))
            } else if (fs.statSync(`/${dirname}`).isSymbolicLink()) {
                cmds.push(`\n# ${dirname} = symbolicLink`)
                cmds.push(await rexec(`rm -f ${this.settings.work_dir.merged}/${dirname}`, this.verbose))
            }
        }
    }

    if (this.clone) {
        cmds.push(await rexec(`umount ${this.settings.work_dir.merged}/home`, this.verbose))
    }

    // Utils.writeXs(`${this.settings.config.snapshot_dir}ubind`, cmds)
    Utils.writeXs(`${this.settings.work_dir.ovarium}ubind`, cmds)
}


/**
* Crea il path se non esiste
* @param path
*/
async function makeIfNotExist(path: string, verbose = false): Promise<string> {
    if (verbose) {
        console.log(`Ovary: makeIfNotExist(${path})`)
    }

    const echo = Utils.setEcho(verbose)
    let cmd = `# ${path} alreasy exist`
    if (!fs.existsSync(path)) {
        cmd = `mkdir ${path} -p`
        await exec(cmd, echo)
    }

    return cmd
}
