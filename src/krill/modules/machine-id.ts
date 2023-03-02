/**
 * krill: module machine-id
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence.js'
import {exec} from '../../lib/utils.js'
import fs from 'fs'

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

  await exec(`touch ${file}`)
}
