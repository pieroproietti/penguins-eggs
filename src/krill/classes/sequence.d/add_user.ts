/**
 * ./src/krill/modules/add-user.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Utils from '../../../classes/utils.js'
import fs from 'fs'
import yaml from 'js-yaml'
import { exec } from '../../../lib/utils.js'
import Sequence from '../sequence.js'

/**
 *
 * @param this
 * @param username
 * @param password
 * @param fullusername
 * @param roomNumber
 * @param workPhone
 * @param homePhone
 */
export default async function addUser(this: Sequence, username = 'live', password = 'evolution', fullusername = '', roomNumber = '', workPhone = '', homePhone = ''): Promise<void> {

  // adduser user
  let cmd = `chroot ${this.installTarget} adduser ${username} --home /home/${username} --shell /bin/bash --disabled-password --gecos "${fullusername},${roomNumber},${workPhone},${homePhone}" ${this.toNull}`
  if (this.distro.familyId === 'archlinux') {
    cmd = `chroot ${this.installTarget} useradd --create-home --shell /bin/bash ${username} ${this.toNull}`
  } else if (this.distro.familyId === 'fedora') {
    cmd = `chroot ${this.installTarget} adduser ${username} --create-home --shell /bin/bash --comment "${fullusername},${roomNumber},${workPhone},${homePhone}" ${this.toNull}`
  } else if (this.distro.familyId === 'openmamba') {
    cmd = `chroot ${this.installTarget} useradd ${username} --create-home --shell /bin/bash --comment "${fullusername},${roomNumber},${workPhone},${homePhone}" ${this.toNull}`
  } else if (this.distro.familyId === 'opensuse') {
    cmd = `chroot ${this.installTarget} useradd ${username} --create-home --shell /bin/bash --comment "${fullusername},${roomNumber},${workPhone},${homePhone}" ${this.toNull}`
  }
  await exec(cmd, this.echo)
  
  cmd = `echo ${username}:${password} | chroot ${this.installTarget} /usr/sbin/chpasswd ${this.toNull}`
  await exec(cmd, this.echo)

  let group = 'wheel'
  if (this.distro.familyId === 'debian') {
    group = 'sudo'
  } else if (this.distro.familyId === 'openmamba') {
    group = 'sysadmin'
  } 

  cmd = `chroot ${this.installTarget} usermod -aG ${group} ${username} ${this.toNull}`
  await exec(cmd, this.echo)

  // add autologin group in archlinux
  await exec(cmd, this.echo)
  if (this.distro.familyId === 'archlinux') {
    await exec(`chroot ${this.installTarget} getent group autologin || groupadd autologin`)
    await exec(`chroot ${this.installTarget} usermod -aG autologin ${username}`)
  }

  /**
   * look to calamares/modules/users.conf for groups
   */
  let usersConf = '/etc/calamares/modules/users.conf'
  if (!fs.existsSync(usersConf)) {
    usersConf = '/etc/penguins-eggs.d/krill/modules/users.conf'
  }

  if (fs.existsSync(usersConf)) {
    interface IUserCalamares {
      defaultGroups: string[]
      doAutologin: boolean
      doReusePassword: boolean
      passwordRequirements: {
        maxLenght: number
        minLenght: number
      }
      setRootPassword: boolean
      sudoersGroup: string
      userShell: string
    }
    const o = yaml.load(fs.readFileSync(usersConf, 'utf8')) as IUserCalamares
    for (const group of o.defaultGroups) {
      const groupExists = await exec(`getent group ${group}`)
      if (groupExists.code == 0) {
        let addGroup = `chroot ${this.installTarget} usermod -aG ${group} ${username}`
        await exec(addGroup)
      }
    }
  } else {
    console.log(`cannot find: ${usersConf}!`)
    await Utils.pressKeyToExit()
  }

}
