/**
 * ./src/krill/modules/umount.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../sequence.js'
import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'

/**
 *
 * @param mountpoint
 */
export default async function umount(this: Sequence, mountPoint = '') {
  let message = 'umount: ' + mountPoint
  if (Utils.isMountpoint(mountPoint)) {
    try {
      await exec(`umount ${mountPoint} ${this.toNull}`, this.echo)
      await exec('sleep 1', this.echo)
    } catch (error) {
      message += +mountPoint + JSON.stringify(error)
      await Utils.pressKeyToExit(message)
    }
  }
}
