/**
 * ./src/krill/modules/bootloader-config-debian.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'
import Sequence from '../sequence.js'

export default async function bootloaderConfigDebian(this: Sequence) {
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
}
