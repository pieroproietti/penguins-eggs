/**
 * ./src/classes/ovary.d/initrd-arch.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import chalk from 'chalk'
// packages
import path from 'node:path'

// classes
import { exec } from '../../lib/utils.js'
import Utils from '../utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 *
 * @param cmd
 * @param echo
 */
export default async function rexec(cmd: string, verbose = false): Promise<string> {
  if (verbose) {
    console.log(`Ovary: rexec(${cmd})`)
  }

  const echo = Utils.setEcho(verbose)

  /**
   * skip umount errors
   */
  const check = await exec(cmd, echo)
  if (!cmd.startsWith('umount') && check.code !== 0) {
    console.log(`eggs >>> error on command: ` + chalk.cyan(cmd) + ', code: ' + chalk.cyan(check.code))
  }

  return cmd
}
