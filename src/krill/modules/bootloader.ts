/**
 * ./src/krill/modules/bootloader.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'
import Sequence from '../sequence.js'

/**
 *
 * @param this
 */
export default async function bootloader(this: Sequence) {
  let grubInstall='grub-install'
  if (this.distro.familyId === 'fedora' || this.distro.familyId === 'opensuse') {
    grubInstall='grub2-install'
  }
  let cmd = `chroot ${this.installTarget} ${grubInstall} ${this.partitions.installationDevice} ${this.toNull}`
  try {
    await exec(cmd, this.echo)
  } catch {
    await Utils.pressKeyToExit(cmd)
  }

  cmd = `chroot ${this.installTarget} grub-mkconfig -o /boot/grub/grub.cfg ${this.toNull}`
  if (this.distro.familyId === 'fedora' || this.distro.familyId === 'opensuse' ) {
    cmd = `chroot ${this.installTarget} grub2-mkconfig -o /boot/grub2/grub.cfg ${this.toNull}`
  }
  try {
    await exec(cmd, this.echo)
  } catch {
    await Utils.pressKeyToExit(cmd)
  }
}
