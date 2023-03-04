/**
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import Utils from '../../classes/utils'
import {exec} from '../../lib/utils'

/**
 *
 * @param this
 * @param name
 * @param password
 * @param fullName
 * @param roomNumber
 * @param workPhone
 * @param homePhone
 */
export default async function addUser(this: Sequence, name = 'live', password = 'evolution', fullName = '', roomNumber = '', workPhone = '', homePhone = ''): Promise<void> {
  // Debian
  let cmd = `chroot ${this.installTarget} adduser ${name} --home /home/${name} --shell /bin/bash --disabled-password --gecos "${fullName},${roomNumber},${workPhone},${homePhone}" ${this.toNull}`
  if (this.distro.familyId === 'archlinux') {
    cmd = `chroot ${this.installTarget} useradd --create-home --shell /bin/bash ${name} ${this.toNull}`
  }

  await exec(cmd, this.echo)

  cmd = `echo ${name}:${password} | chroot ${this.installTarget} chpasswd ${this.toNull}`
  //  echo ${name}:${password} | chroot ${this.installTarget} chpasswd ${this.toNull}
  await exec(cmd, this.echo)

  // Debian
  cmd = `chroot ${this.installTarget} usermod -aG sudo ${name} ${this.toNull}`
  if (this.distro.familyId === 'archlinux') {
    cmd = `chroot ${this.installTarget} usermod -aG wheel ${name}`
  }

  try {
    await exec(cmd, this.echo)
  } catch {
    await Utils.pressKeyToExit(cmd)
  }
}

