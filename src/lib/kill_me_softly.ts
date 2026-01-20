/**
 * ./src/lib/kill_me_softly.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'node:fs'

import Utils from '../classes/utils.js'
import { exec } from './utils.js'

/**
 *
 */
export default async function killMeSoftly(eggsRoot = `/home/eggs`, eggsMnt = '/home/eggs/mnt', isos = false) {
  const echo = Utils.setEcho(false)
  const liveFs = `${eggsMnt}filesystem.squashfs`

  /**
   * refuse if /home/eggs/mnt/filesystem.squashfs
   */
  if (haveBindedDirs(liveFs)) {
    Utils.warning(`You have binded dirs under ${liveFs}, kill is not possible!`)
    process.exit(1)
  }

  /**
   * if eggsMnt is mountpoint
   */
  if (Utils.isMountpoint(eggsMnt)) {
    // Just delete
    await exec(`rm -rf ${eggsMnt}efi-work`)
    await exec(`rm -rf ${eggsMnt}iso`)
    await exec(`rm -rf ${eggsMnt}memdiskDir`)
    await exec(`rm -rf ${eggsRoot}bin`)

    // Remove all ISOs if --isos
    if (isos) {
      await exec(`rm -rf ${eggsMnt}*.iso`)
    }

    // double check !haveBindedDirs
    if (!haveBindedDirs(liveFs)) {
      await exec(`rm -rf ${liveFs}`)
    }

    process.exit(0)
  }

  await exec(`rm ${eggsRoot} -rf`, echo)
}

/**
 *
 * @param path
 * @returns
 */
function haveBindedDirs(path: string): boolean {
  let retVal = false
  const dirs = ['bin', 'boot', 'etc', 'lib', 'lib32', 'lib64', 'libx32', 'opt', 'root', 'sbin', 'srv', 'usr', 'var']

  for (const dir of dirs) {
    const dirToCheck = `${path}/${dir}`
    if (fs.existsSync(dirToCheck) && Utils.isMountpoint(dirToCheck)) {
      console.log(`Warning: ${dirToCheck}, is a mountpoint!`)
      retVal = true
    }
  }

  return retVal
}
