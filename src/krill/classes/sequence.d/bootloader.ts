/**
 * ./src/krill/modules/bootloader.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import { up } from 'inquirer/lib/utils/readline.js'
import fs from 'node:fs'
import path from 'node:path'

import Diversion from '../../../classes/diversions.js'
import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../../classes/sequence.js'

/**
 *
 * @param this
 */
export default async function bootloader(this: Sequence) {
  const grubName = Diversion.grubName(this.distro.familyId)
  const grubForce = Diversion.grubForce(this.distro.familyId)

  let cmd = ''
  if (this.efi) {
    /**
     * UEFI Installation
     */

    // DEFAULT x86_64
    let target = `x86_64-efi`
    let extraArgs = `` // Variabile per argomenti extra come --removable

    // Rilevamento Architetture
    if (process.arch === 'arm64') {
      target = `arm64-efi`
    } else if (process.arch === 'riscv64') {
      target = `riscv64-efi`
      extraArgs = `--removable`
    }

    const bootloaderId = this.distro.distroLike.toLowerCase()

    cmd = `chroot ${this.installTarget} ${grubName}-install --target=${target} --efi-directory=/boot/efi --bootloader-id=${bootloaderId} --recheck ${extraArgs} ${grubForce}`
  } else {
    /**
     * MBR (Legacy BIOS) Installation
     * For legacy boot, we specify the installation device directly.
     */
    const target = 'i386-pc'
    cmd = `chroot ${this.installTarget} ${grubName}-install --target=${target} ${this.partitions.installationDevice} ${grubForce}`
  }

  // await Utils.debug(`grub-install: ${cmd}`)

  await exec(cmd, this.echo)

  /**
   * grub-mkconfig
   */
  cmd = `chroot ${this.installTarget} ${grubName}-mkconfig -o /boot/${grubName}/grub.cfg ${this.toNull}`
  await exec(cmd, this.echo)

  /**
   * In fedora family, we need to call kernel-install to force entry creation
   */
  if (this.distro.familyId === 'fedora') {
    /**
     * create grub2 entries
     *
     */
    cmd = `chroot ${this.installTarget} kernel-install add $(uname -r) /boot/vmlinuz-$(uname -r)`
    await exec(cmd, this.echo)

    /**
     * and not only: on RHEL, Almalinux, Rocky it take UUID from janitor
     */
    if (this.distro.distroId === 'Almalinux' || this.distro.distroId === 'Rocky') {
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
      const source = fs.readFileSync(currentEntry, 'utf8')
      const lines = source.split('\n')
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
    const first = line.slice(0, Math.max(0, at + lenSearch))
    const last = line.slice(Math.max(0, at + lenSearch + lenReplace))
    line = first + replace + last
  }

  return line
}
