/**
 * penguins-eggs
 * krill modules: machine-id.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import fs from 'node:fs'

import Distro from '../../classes/distro.js'
import { exec } from '../../lib/utils.js'
import Sequence from '../sequence.js'

/**
 * On Ubuntu
 * /etc/machine-id must exist to be re-created
 * https://unix.stackexchange.com/questions/402999/is-it-ok-to-change-etc-machine-id
 */
export default async function machineId(this: Sequence): Promise<void> {
  const file = `${this.installTarget}/etc/machine-id`
  if (fs.existsSync(file)) {
    await exec(`rm ${file}`, this.echo)
  }

  const distro = new Distro()
  if (distro.familyId === "alpine") {
    await exec(`dbus-uuidgen > ${this.installTarget}/var/lib/dbus/machine-id`)
    await exec(`cp ${this.installTarget}/var/lib/dbus/machine-id ${this.installTarget}/etc/machine-id`)
  } else {
    await exec(`touch ${file}`)
  }
}

