/**
 * ./src/krill/modules/bootloader.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import { up } from 'inquirer/lib/utils/readline.js'
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
  await exec(cmd, this.echo)


  /**
    * grub-mkconfig
    */
  cmd = `chroot ${this.installTarget} ${grubName}-mkconfig -o /boot/${grubName}/grub.cfg ${this.toNull}`
  await exec(cmd, this.echo)


  /**
   * this is a need for almalinux/rocky mostly
   */
  if (this.distro.familyId === 'fedora') {
    /**
     * clean grub2 entries
     */
    const entriesPath = `/boot/loader/entries/`
    cmd = `chroot ${this.installTarget} rm ${entriesPath}*`
    await exec(cmd, this.echo)

    /**
     * renew grub2 entries
     */
    cmd = `chroot ${this.installTarget} kernel-install add $(uname -r) /boot/vmlinuz-$(uname -r)`
    await exec(cmd, this.echo)

    /**
     * grub2: edit entries
     */
    const rootUUID = Utils.uuid(this.devices.root.name)
    const resumeUUID = Utils.uuid(this.devices.swap.name)
    const machineId = fs.readFileSync(path.join(this.installTarget, '/etc/machine-id'), 'utf-8').trim()
    await renameEntries(entriesPath, machineId)
    await updateEntries(entriesPath, rootUUID, resumeUUID, this.installTarget )
  }

}

/**
 * 
 * @param rootUUID 
 * @param resumeUUID 
 */
async function updateEntries(entriesPath: string, rootUUID: string, resumeUUID: string, installTarget: string ) {
  const files: string[] = fs.readdirSync(entriesPath)
  if (files.length > 0) {
    for (const file of files) {
      const filePath = path.join(entriesPath, file)
      let source = fs.readFileSync(filePath, 'utf8')
      let lines = source.split('\n')
      let content = ''
      for (let line of lines) {

        /**
         * REPLACE root=UUID=
         */
        if (line.includes('root=UUID=')) {
          const at = line.indexOf('root=UUID=')
          const start = line.substring(0, at + 10)
          const stop = line.substring(at + 10 + 36)
          line = start + rootUUID + stop
        }

        /**
         * REPLACE resume=UUID=
         */
        if (line.includes('resume=UUID=')) {
          const at = line.indexOf('resume=UUID=')
          const start = line.substring(0, at + 12)
          const stop = line.substring(at + 12 + 36)
          line = start + resumeUUID + stop
        }

        content += line + '\n'
      }
      fs.writeFileSync(filePath, content, 'utf-8')
      console.log("")
      console.log("")
      console.log(content)
      console.log("")
      console.log(`copying to: /${file}`)
      fs.writeFileSync(`${installTarget}/${file}`, content, 'utf-8')
    }
  }
}


/**
 * 
 * @param machineId 
 */
async function renameEntries(entriesPath: string, machineId: string) {
  const files: string[] = fs.readdirSync(entriesPath)
  if (files.length > 0) {
    for (const file of files) {
      if (file.length > 32) {
        const oldEntry = path.join(entriesPath, file)
        let current = file.substring(32)
        current = machineId + current
        const newEntry = path.join(entriesPath, current)
        const cmd = `mv ${oldEntry} ${newEntry}`
        await exec(cmd)
      }
    }
  }
}

