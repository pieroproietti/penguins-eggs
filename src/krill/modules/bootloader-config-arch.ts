/**
 * penguins-eggs
 * krill modules: bootloader-config-arch.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */
import Sequence from '../krill-sequence'
import { exec } from '../../lib/utils'
import Utils from '../../classes/utils'

/**
 *
 * @param this
 */

export default async function bootloaderConfigArch(this: Sequence) {
  let cmd = ''
  if (this.efi) {
    try {
      cmd = `chroot ${this.installTarget} pacman -S grub-efi-${Utils.uefiArch()} ${this.toNull}`
      await exec(cmd, this.echo)
    } catch (error) {
      console.log(error)
      await Utils.pressKeyToExit(cmd, true)
    }
  } else {
    try {
      cmd = `chroot ${this.installTarget} pacman -S grub-pc ${this.toNull}`
      await exec(cmd, this.echo)
    } catch (error) {
      console.log(error)
      await Utils.pressKeyToExit(cmd, true)
    }
  }

  try {
    cmd = `chroot ${this.installTarget} sleep 1 ${this.toNull}`
    await exec(cmd, this.echo)
  } catch (error) {
    console.log(error)
    await Utils.pressKeyToExit(cmd, true)
  }

  try {
    cmd = `chroot ${this.installTarget} grub-install ${this.partitions.installationDevice} ${this.toNull}`
    await exec(cmd, this.echo)
  } catch (error) {
    console.log(error)
    await Utils.pressKeyToExit(cmd, true)
  }

  try {
    cmd = `chroot ${this.installTarget} grub-mkconfig -o /boot/grub/grub.cfg ${this.toNull}`
    await exec(cmd, this.echo)
  } catch (error) {
    console.log(error)
    await Utils.pressKeyToExit(cmd, true)
  }

  try {
    cmd = `chroot ${this.installTarget} sleep 1 ${this.toNull}`
    await exec(cmd, this.echo)
  } catch (error) {
    console.log(error)
    await Utils.pressKeyToExit(cmd, true)
  }
}
