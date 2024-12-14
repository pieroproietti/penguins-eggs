/**
 * ./src/krill/modules/bootloader.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Diversion from '../../classes/diversions.js'
import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'
import Sequence from '../sequence.js'
import fs from 'node:fs'
import path from 'node:path'

/**
 *
 * @param this
 */
export default async function bootloader(this: Sequence) {

  /**
   * grub-install: added --force per fedora family
   */
  let grubName = Diversion.grubName(this.distro.familyId)
  let grubForce = Diversion.grubForce(this.distro.familyId)
  let cmd = `chroot ${this.installTarget} ${grubName}-install ${this.partitions.installationDevice} ${grubForce} ${this.toNull}`
  try {
    await exec(cmd, this.echo)
  } catch (error) {
    await showError(cmd, error)
  }

  /**
   * grub-mkconfig
   */
  cmd = `chroot ${this.installTarget} ${grubName}-mkconfig -o /boot/${grubName}/grub.cfg ${this.toNull}`
  try {
    await exec(cmd, this.echo)
  } catch (error) {
    await showError(cmd, error)
  }

  /**
   * update-grub
   */
  cmd=`chroot ${this.installTarget} update-grub`
  try {
    await exec(cmd, this.echo)
  } catch (error) {
    await showError(cmd, error)
  }
}

/**
 * 
 * @param cmd 
 * @param error 
 */
async function showError(cmd: string, error: any) {
  console.log('error:', error)
  console.log(cmd)
  await Utils.pressKeyToExit(cmd, true)
}
