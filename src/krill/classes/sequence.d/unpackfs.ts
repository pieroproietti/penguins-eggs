/**
 * ./src/krill/modules/unpackfs.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../../classes/sequence.js'
import path from 'path'

/**
 * unpackfs
 */
export default async function unpackfs(this: Sequence): Promise<void> {
  const cmd = `unsquashfs -d ${this.installTarget} -f ${path.join(this.distro.liveMediumPath, this.distro.squashfs)}, ${this.toNull}`
  const echoYes = Utils.setEcho(true)
  const echoNo = Utils.setEcho(false)
  await exec(cmd, echoNo)
}
