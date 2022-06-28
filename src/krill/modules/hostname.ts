/**
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import { exec } from '../../lib/utils'

/**
 * hostname
 */
export default async function hostname(this: Sequence) : Promise <void> {
    await exec(`echo ${this.installTarget + '/etc/hostname'} > ${this.users.hostname} `, this.echo)
}
