/**
 * ./src/classes/ovary.d/users-remove.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import mustache from 'mustache'

// packages
import path from 'node:path'

// backup

// interfaces

// libraries
import { exec } from '../../lib/utils.js'
import rexec from './rexec.js'

// classes
import Ovary from './../ovary.js'
import Diversions from './../diversions.js'


// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

//async cleanUsersAccounts() {
export async function usersRemove(this: Ovary) {
    if (this.verbose) {
        console.log('Ovary: cleanUsersAccounts')
    }

    /**
     * delete all user in chroot
     */
    const cmds: string[] = []
    const cmd = `chroot ${this.settings.work_dir.merged} getent passwd {1000..60000} |awk -F: '{print $1}'`
    const result = await exec(cmd, {
        capture: true,
        echo: this.verbose,
        ignore: false
    })
    const users: string[] = result.data.split('\n')

    let deluser = Diversions.deluser(this.familyId)
    for (let i = 0; i < users.length - 1; i++) {
        cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} ${deluser} ${users[i]}`, this.verbose))
    }
}
