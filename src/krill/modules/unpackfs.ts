/**
 * krill: module unpackfs
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence.js'
import Utils from '../../classes/utils.js'
import {exec} from '../../lib/utils.js'

/**
* unpackfs
*/
export default async function unpackfs(this: Sequence): Promise<void> {
  // const cmd = `unsquashfs -d ${this.installTarget} -f ${this.distro.liveMediumPath}`
  const cmd = `unsquashfs -d ${this.installTarget} -f ${this.distro.liveMediumPath}${this.distro.squashfs}`
  const echoYes = Utils.setEcho(true)
  await exec(cmd, echoYes)
}

