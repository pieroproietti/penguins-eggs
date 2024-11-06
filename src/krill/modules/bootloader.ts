/**
 * ./src/krill/modules/bootloader.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import { dir } from 'node:console'
import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'
import Sequence from '../sequence.js'
import fs from 'node:fs'
import path from 'node:path'
import { subscribe } from 'node:diagnostics_channel'

/**
 *
 * @param this
 */
export default async function bootloader(this: Sequence) {
  let grubInstall = 'grub-install'
  if (this.distro.familyId === 'fedora' || this.distro.familyId === 'opensuse') {
    grubInstall = 'grub2-install'
  }
  let cmd = `chroot ${this.installTarget} ${grubInstall} ${this.partitions.installationDevice} ${this.toNull}`
  try {
    await exec(cmd, this.echo)
  } catch {
    await Utils.pressKeyToExit(cmd)
  }

  cmd = `chroot ${this.installTarget} grub-mkconfig -o /boot/grub/grub.cfg ${this.toNull}`
  if (this.distro.familyId === 'fedora' || this.distro.familyId === 'opensuse') {
    cmd = `chroot ${this.installTarget} grub2-mkconfig -o /boot/grub2/grub.cfg ${this.toNull}`
  }
  try {
    await exec(cmd, this.echo)
  } catch {
    await Utils.pressKeyToExit(cmd)
  }

  // update boot/loader/entries/
  const pathEntries = path.join(this.installTarget, '/boot/loader/entries/')
  if (fs.existsSync(pathEntries)) {
    const uuid = Utils.uuid(this.devices.root.name)
    const machineId = fs.readFileSync(path.join(this.installTarget, '/etc/machine-id'), 'utf-8').trim()
    await renameLoaderEntries(pathEntries, machineId)
    await updateLoaderEntries(pathEntries, uuid)
  }
}

/**
 * 
 * @param directoryPath 
 * @param machineId 
 */
async function renameLoaderEntries(directoryPath: string, machineId: string): Promise<void> {
  const files: string[] = fs.readdirSync(directoryPath)
  if (files.length > 0) {
    for (const file of files) {
      const oldPath = path.join(directoryPath, file)
      let current = file.substring(32)
      current = machineId + current
      const newPath = path.join(directoryPath, current)
      await exec(`mv ${oldPath} ${newPath}`)
    }
  }
}

/**
 * 
 * @param directoryPath 
 * @param newUUID 
 */
async function updateLoaderEntries(directoryPath: string, newUUID: string): Promise<void> {
  const files: string[] = fs.readdirSync(directoryPath)
  if (files.length > 0) {
    for (const file of files) {
      console.log(file)
      const filePath = path.join(directoryPath, file)
      console.log(`entry: ${filePath}`)
      let source = fs.readFileSync(filePath, 'utf8')
      let lines = source.split('\n')
      let content = ''
      for (let line of lines) {
        if (line.includes('UUID=')) {
          const at = line.indexOf('UUID=')
          const p1 = line.substring(0, at + 5)
          const p2 = newUUID
          const p3 = line.substring(at + 5 + 36)
          console.log("Orig: " + line)
          console.log("p1: " + p1)
          console.log("p2: " + p2)
          console.log("p3: " + p3)
          line = p1 + p2 + p3
        }
        content += line + '\n'
      }
      fs.writeFileSync(filePath, content)
    }
  }
}
