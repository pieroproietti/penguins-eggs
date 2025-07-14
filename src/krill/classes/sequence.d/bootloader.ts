/**
 * ./src/krill/modules/bootloader.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import { up } from 'inquirer/lib/utils/readline.js'
import Diversion from '../../../classes/diversions.js'
import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../../classes/sequence.js'
import fs from 'node:fs'
import path from 'node:path'

/**
 *
 * @param this
 */
export default async function bootloader(this: Sequence) {
  let grubName = Diversion.grubName(this.distro.familyId)
  let grubForce = Diversion.grubForce(this.distro.familyId)

  /**
   * grub-install: added --force per fedora family
   */
  let cmd = `chroot ${this.installTarget} ${grubName}-install ${this.partitions.installationDevice} ${grubForce} ${this.toNull}`
  await exec(cmd, this.echo)


  /**
   * grub-mkconfig
   */
  cmd = `chroot ${this.installTarget} ${grubName}-mkconfig -o /boot/${grubName}/grub.cfg ${this.toNull}`
  await exec(cmd, this.echo)


  /**
   * In fedora family, we need to call kernel-install to force entry creation
   */
  if (this.distro.familyId === "fedora") {
    /**
     * create grub2 entries
     * 
     */
    cmd = `chroot ${this.installTarget} kernel-install add $(uname -r) /boot/vmlinuz-$(uname -r)`
    await exec(cmd, this.echo)

    /**
     * and not only: on RHEL, Almalinux, Rocky it take UUID from janitor
     */
    if (this.distro.distroId === "Almalinux" || this.distro.distroId === "Rocky") {
      /**
       * grub2: adapt entries at new system
       */
      const rootUUID = Utils.uuid(this.devices.root.name)
      const resumeUUID = Utils.uuid(this.devices.swap.name)
      await updateEntries(this.installTarget, rootUUID, resumeUUID)
    }
  }
}


/**
 * 
 * @param installTarget 
 * @param rootUUID 
 * @param resumeUUID 
 */
async function updateEntries(installTarget: string, rootUUID: string, resumeUUID: string) {

  const entriesPath = path.join(installTarget, `/boot/loader/entries/`)

  const entries: string[] = fs.readdirSync(entriesPath)
  if (entries.length > 0) {
    for (const entry of entries) {
      const currentEntry = path.join(entriesPath, entry)
      let source = fs.readFileSync(currentEntry, 'utf8')
      let lines = source.split('\n')
      let content = ''
      for (let line of lines) {
        line = searchAndReplace(line, 'root=UUID=', rootUUID)
        line = searchAndReplace(line, 'resume=UUID=', resumeUUID)

        content += line + '\n'
      }
      fs.writeFileSync(`${currentEntry}`, content, 'utf-8')
    }
  }
}

/**
 * 
 * @param line 
 * @param search 
 * @param replace 
 * @returns 
 */
function searchAndReplace(line: string, search: string, replace: string): string {
  if (line.includes(search)) {
    const lenSearch = search.length
    const lenReplace = replace.length

    const at = line.indexOf(search)
    const first = line.substring(0, at + lenSearch)
    const last = line.substring(at + lenSearch + lenReplace)
    line = first + replace + last
  }
  return line
}
