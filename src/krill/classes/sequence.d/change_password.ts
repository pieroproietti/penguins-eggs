/**
 * ./src/krill/modules/change-password.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import { exec } from '../../../lib/utils.js'
import Sequence from '../sequence.js'

/**
 * changePassword
 * @param name
 * @param newPassword
 */
export default async function changePassword(this: Sequence, name = 'live', newPassword = 'evolution') {
  const cmd = `echo ${name}:${newPassword} | chroot ${this.installTarget} /usr/sbin/chpasswd ${this.toNull}`
  
  await exec(cmd, this.echo)
}
