/**
 * ./src/krill/modules/umount.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../../classes/sequence.js'

/**
 *
 * @param mountpoint
 */
export default async function umount(this: Sequence, mountPoint = '') {
  let message = 'umount: ' + mountPoint
  if (Utils.isMountpoint(mountPoint)) {
    let cmd = `umount ${mountPoint} ${this.toNull}`
    try {
      await exec(cmd, this.echo)
      await exec('sleep 1', this.echo)
    } catch (error) {
      message += cmd + JSON.stringify(error)
      await Utils.pressKeyToExit(message, true)
    }
  }
}
