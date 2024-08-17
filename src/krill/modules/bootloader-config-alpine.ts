/**
 * ./src/krill/modules/add-user.ts
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

export default async function bootloaderConfigAlpine(this: Sequence) {
  let cmd = ''
  if (this.efi) {
    try {
      cmd = `chroot ${this.installTarget} apk add grub grub-efi efibootmgr} ${this.toNull}`
      await exec(cmd, this.echo)
    } catch (error) {
      console.log(error)
      await Utils.pressKeyToExit(cmd, true)
    }
  } else {
    try {
      cmd = `chroot ${this.installTarget} apk add grub grub-bios ${this.toNull}`
      await exec(cmd, this.echo)
    } catch (error) {
      console.log(error)
      await Utils.pressKeyToExit(cmd, true)
    }
  }
}
