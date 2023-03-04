/**
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import {exec} from '../../lib/utils'
import Utils from '../../classes/utils'

/**
 *
 * @param this
 */
export default async function bootloader(this: Sequence) {
  let cmd = `chroot ${this.installTarget} grub-install ${this.partitions.installationDevice} ${this.toNull}`
  try {
    await exec(cmd, this.echo)
  } catch {
    await Utils.pressKeyToExit(cmd)
  }

  cmd = `chroot ${this.installTarget} grub-mkconfig -o /boot/grub/grub.cfg ${this.toNull}`
  try {
    await exec(cmd, this.echo)
  } catch {
    await Utils.pressKeyToExit(cmd)
  }
}
