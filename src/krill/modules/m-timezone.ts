/**
 * krill: module setTimezone
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import { exec } from '../../lib/utils'
import fs from 'fs'

/**
 * 
 * @param this 
 */
export default async function mTimezone(this: Sequence): Promise<void> {
    if (fs.existsSync('/etc/localtime')) {
        const cmd = `chroot ${this.installTarget} unlink /etc/localtime`
        await exec(cmd, this.echo)
    }
    const cmd = `chroot ${this.installTarget} ln -sf /usr/share/zoneinfo/${this.region}/${this.zone} /etc/localtime`
    await exec(cmd, this.echo)
}
