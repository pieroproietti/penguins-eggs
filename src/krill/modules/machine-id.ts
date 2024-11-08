/**
 * penguins-eggs
 * krill modules: machine-id.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */


import fs from 'node:fs'

import { exec } from '../../lib/utils.js'
import Sequence from '../sequence.js'
import Utils from '../../classes/utils.js'

/**
 * On Ubuntu
 * /etc/machine-id must exist to be re-created
 * https://unix.stackexchange.com/questions/402999/is-it-ok-to-change-etc-machine-id
 */
export default async function machineId(this: Sequence): Promise<void> {
  // We delete the machine-id file to force its recreation
  const file = `${this.installTarget}/etc/machine-id`
  if (fs.existsSync(file)) {
    await exec(`rm ${file} ${this.toNull}`, this.echo)
  }

  /**
   * machine/id always new now
   */
  if (Utils.isSystemd()) {
    await exec(`chroot ${this.installTarget} systemd-machine-id-setup`)
  } else {
    await exec(`dbus-uuidgen --ensure=${this.installTarget}/var/lib/dbus/machine-id ${this.toNull}`)
    await exec(`cp ${this.installTarget}/var/lib/dbus/machine-id ${this.installTarget}/etc/machine-id`)
  }

  /*
  // On Alpine, we need to create the machine-id file
  if (this.distro.familyId === 'alpine') {
    await exec(`dbus-uuidgen --ensure=${this.installTarget}/var/lib/dbus/machine-id ${this.toNull}`)
    await exec(`cp ${this.installTarget}/var/lib/dbus/machine-id ${this.installTarget}/etc/machine-id`) 
  } else {
    await exec(`touch ${file} ${this.toNull}`)
  }
  */
}
