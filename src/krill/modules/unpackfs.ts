/**
 * penguins-eggs
 * krill modules: unpackfs.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import Utils from '../../classes/utils'
import {exec} from '../../lib/utils'

/**
* unpackfs
*/
export default async function unpackfs(this: Sequence): Promise<void> {
  // const cmd = `unsquashfs -d ${this.installTarget} -f ${this.distro.liveMediumPath}`
  const cmd = `unsquashfs -d ${this.installTarget} -f ${this.distro.liveMediumPath}${this.distro.squashfs}`
  const echoYes = Utils.setEcho(true)
  await exec(cmd, echoYes)
}

