/**
 * ./src/krill/modules/m-timezone.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import fs from 'node:fs'

import { exec } from '../../lib/utils.js'
import Sequence from '../sequence.js'

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
