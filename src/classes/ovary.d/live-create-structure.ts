/**
 * ./src/classes/ovary.d/live-create-structure.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import chalk from 'chalk'
import mustache from 'mustache'
// packages
import fs from 'node:fs'
import path from 'path'

// interfaces
// libraries
import { exec } from '../../lib/utils.js'
import Ovary from './../ovary.js'
// classes
import Utils from './../utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Crea la struttura della workdir
 */
export async function liveCreateStructure(this: Ovary) {
  Utils.warning(`creating live structure on ${this.nest}`)

  let cmd = ''
  cmd = `# create nest\n`
  cmd += `mkdir -p ${this.nest}\n`
  cmd += `# README.md\n`
  cmd += `cp ${path.resolve(__dirname, '../../../conf/README.md')} ${this.nest}README.md\n`

  cmd += `# cleaning iso\n`
  cmd += `rm -rf ${this.nest}iso\n`
  cmd += `mkdir -p ${this.nest}iso/live\n`
  cmd += `mkdir -p ${this.nest}iso/boot/grub/${Utils.uefiFormat()}\n`
  cmd += `mkdir -p ${this.nest}iso/isolinux\n`

  cmd += `# cleaning (nest).overlay\n`
  cmd += `umount ${this.dotLivefs}/* > /dev/null 2>&1\n`
  cmd += `umount ${this.dotOverlay.lowerdir}/* > /dev/null 2>&1\n`
  cmd += `umount ${this.dotOverlay.upperdir}/* > /dev/null 2>&1\n`
  cmd += `umount ${this.dotOverlay.workdir}/* > /dev/null 2>&1\n`
  cmd += `rm -rf ${this.nest}.overlay\n`
  cmd += `mkdir -p ${this.dotOverlay.lowerdir}\n`
  cmd += `mkdir -p ${this.dotOverlay.upperdir}\n`
  cmd += `mkdir -p ${this.dotOverlay.workdir}\n`
  cmd += `sleep 1\n`
  cmd += `# cleaning plain liveroot\n`
  cmd += `rm -rf ${this.dotLivefs}\n`
  cmd += `mkdir -p ${this.dotLivefs}\n`

  cmd += `# cleaning (nest)/bin\n`
  cmd += `rm -rf ${this.nest}bin\n`
  cmd += `mkdir -p ${this.nest}bin\n`

  cmd += `# cleaning (nest)/links\n`
  cmd += `rm -f ${this.nest}iso\n`
  cmd += `rm -f ${this.nest}livefs\n`
  tryCatch(cmd, this.verbose)
}

/**
 *
 * @param cmd
 */
async function tryCatch(cmd = '', verbose = false) {
  try {
    const echo = Utils.setEcho(verbose)
    // console.log(cmd)
    await exec(cmd, echo)
  } catch (error) {
    console.log(`Error: ${error}`)
    await Utils.pressKeyToExit(cmd)
  }
}
