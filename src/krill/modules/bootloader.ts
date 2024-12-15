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
  try {
    await exec(cmd, this.echo)
  } catch (error) {
    await showError(cmd, error)
  }

  /**
   * rm entries
   */
  cmd = `rm /boot/loader/entries/*`
  await exec(cmd, this.echo)

  /**
   * create entries
   */
  cmd = `kernel-install add $(uname -r) /boot/vmlinuz-$(uname -r)`
  await exec(cmd, this.echo)

  /**
   * grub-mkconfig
   */
  cmd = `chroot ${this.installTarget} ${grubName}-mkconfig -o /boot/${grubName}/grub.cfg ${this.toNull}`
  try {
    await exec(cmd, this.echo)
  } catch (error) {
    await showError(cmd, error)
  }

  /**
   * update-grub
   */
  cmd=`chroot ${this.installTarget} update-grub`
  try {
    await exec(cmd, this.echo)
  } catch (error) {
    await showError(cmd, error)
  }
}

/**
 * 
 * @param directoryPath 
 * @param machineId 
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
          const start = line.substring(0, at - 1)
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


/**
 * 
 * @param cmd 
 * @param error 
 */
async function showError(cmd: string, error: any) {
  console.log('error:', error)
  console.log(cmd)
  await Utils.pressKeyToExit(cmd, true)
}
