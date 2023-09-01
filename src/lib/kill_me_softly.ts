'use strict'

import Utils from "../classes/utils"
import fs from 'fs'
import { exec } from "./utils"


/**
 *  
 */
export default async function killMeSoftly(eggsRoot = `/home/eggs`, eggsMnt = '/home/eggs/mnt') {
  const echo = Utils.setEcho(false)

  if (Utils.isMountpoint(eggsMnt)) {
    if (isBinded(eggsMnt + `filesystem.squashfs`)){
      Utils.warning(`You have binded dirs under ${eggsMnt}, kill is not possible!`)  
      process.exit(1)
    }

    // cancello SOLO:
    await exec (`rm -rf ${eggsMnt}efi-work`)
    await exec (`rm -rf ${eggsMnt}filesystem.squashfs`)
    await exec (`rm -rf ${eggsMnt}iso`)
    await exec (`rm -rf ${eggsMnt}memdiskDir`)
    await exec (`rm -rf ${eggsRoot}ovarium`)
    console.log(`\nJust cleaned!\nPlease, run:\nsudo umount ${eggsMnt}\nif you want to kill`)
    process.exit(0)
  }

  if (isBinded(eggsRoot)) {
    console.log(`Please, run:\nsudo umount ${eggsRoot}\nbefore to kill`)
  }
  await exec(`rm ${eggsRoot} -rf`, echo)
}

/**
 * 
 * @param path 
 * @returns 
 */
function isBinded(path: string): Boolean {
  let retVal = false
  const dirs = [
    'bin',
    'boot',
    'etc',
    'lib',
    'lib32',
    'lib64',
    'libx32',
    'opt',
    'root',
    'sbin',
    'srv',
    'usr',
    'var'
  ]

  for (const dir of dirs) {
    const dirToCheck = `${path}/${dir}`
    if (fs.existsSync(dirToCheck)) {
      if (Utils.isMountpoint(dirToCheck)) {
        console.log(`Warning: ${dirToCheck}, is a mountpoint!`)
        retVal = true
      }
    }
  }
  return retVal
}
