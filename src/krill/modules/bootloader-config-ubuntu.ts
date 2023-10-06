/**
 * penguins-eggs
 * krill modules: bootloader-config-ubuntu.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */
import Sequence from '../krill-sequence'
import {exec} from '../../lib/utils'
import Utils from '../../classes/utils'

/**
 *
 * @param this
 */

export default async function bootloaderConfigUbuntu(this: Sequence) {
  let cmd = ''
  try {
    cmd = `chroot ${this.installTarget} apt-get update -y ${this.toNull}`
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

  const aptInstallOptions = ' apt install -y --no-upgrade --allow-unauthenticated -o Acquire::gpgv::Options::=--ignore-time-conflict '
  if (this.efi) {
    try {
      cmd = `chroot ${this.installTarget} ${aptInstallOptions} grub-efi-${Utils.uefiArch()} --allow-unauthenticated ${this.toNull}`
      await exec(cmd, this.echo)
    } catch (error) {
      console.log(error)
      await Utils.pressKeyToExit(cmd, true)
    }
  } else {
    try {
      cmd = `chroot ${this.installTarget} ${aptInstallOptions} grub-pc ${this.toNull}`
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
    cmd = `chroot ${this.installTarget} update-grub ${this.toNull}`
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
