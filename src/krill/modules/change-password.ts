/**
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import {exec} from '../../lib/utils'

/**
   * changePassword
   * @param name
   * @param newPassword
   */
export default async function changePassword(this: Sequence, name = 'live', newPassword = 'evolution') {
  const cmd = `echo ${name}:${newPassword} | chroot ${this.installTarget} chpasswd ${this.toNull}`
  await exec(cmd, this.echo)
}
