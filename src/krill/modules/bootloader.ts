/**
 * ./src/krill/modules/bootloader.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

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
   * look at: https://systemd.io/BOOT/
   */

  // update boot/loader/entries/
  const pathEntries = path.join(this.installTarget, '/boot/loader/entries/')
  if (fs.existsSync(pathEntries)) {
    const uuid = Utils.uuid(this.devices.root.name)
    const machineId = fs.readFileSync(path.join(this.installTarget, '/etc/machine-id'), 'utf-8').trim()
    await renameLoaderEntries(pathEntries, machineId)
    await updateLoaderEntries(pathEntries, machineId, uuid)
  }

  /**
   * GRUB
   */
  let grubName=Diversion.grubName(this.distro.familyId)
  let cmd = `chroot ${this.installTarget} ${grubName}-install ${this.partitions.installationDevice} ${this.toNull}`
  try {
    await exec(cmd, this.echo)
  } catch {
    await Utils.pressKeyToExit(cmd)
  }

  cmd = `chroot ${this.installTarget} ${grubName}-mkconfig -o /boot/${grubName}/grub.cfg ${this.toNull}`
  try {
    await exec(cmd, this.echo)
  } catch {
    await Utils.pressKeyToExit(cmd)
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
      if (file.length > 32) {
        const oldEntry = path.join(directoryPath, file)
        let current = file.substring(32)
        current = machineId + current
        const newEntry = path.join(directoryPath, current)
        const cmd = `mv ${oldEntry} ${newEntry}`
        try {
          await exec(cmd)
        } catch (error) {
          console.log(`error executing: ${cmd}`)
        }
      }
    }
  }
}

/**
 * 
 * @param directoryPath 
 * @param newUUID 
 */
async function updateLoaderEntries(directoryPath: string, machineId: string, newUUID: string): Promise<void> {
  const files: string[] = fs.readdirSync(directoryPath)
  if (files.length > 0) {
    for (const file of files) {
      const filePath = path.join(directoryPath, file)
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
          line = start + newUUID + stop
        }

        /**
         * REMOVE resume=UUID=
         */
        if (line.includes('resume=UUID=')) {
          const at = line.indexOf('resume=UUID=')
          const start = line.substring(0, at -1)
          line = start
        }

        /**
         * REPLACE machineId
         */
        // version 0-rescue-
        if (line.includes('version 0-rescue-')) {
          line = `version 0-rescue-${machineId}`
        }

        // linux /boot/vmlinuz-0-rescue-
        if (line.includes('vmlinuz-0-rescue-')) {
          line = `vmlinuz-0-rescue-${machineId}`
        }

        // initrd /boot/initramfs-0-rescue-
        if (line.includes('initrd /boot/initramfs-0-rescue-')) {
          line = `initrd /boot/initramfs-0-rescue-${machineId}.img`
        }
        content += line + '\n'
      }
      fs.writeFileSync(filePath, content)
    }
  }
}
