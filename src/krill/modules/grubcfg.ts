/**
 * krill: module grubcfg
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence.js'
import Utils from '../../classes/utils.js'
import fs from 'fs'

/**
    * grubcfg
    * - open /etc/default/grub
    * - find GRUB_CMDLINE_LINUX_DEFAULT=
    * - replace with GRUB_CMDLINE_LINUX_DEFAULT=
    * 's/GRUB_CMDLINE_LINUX_DEFAULT=.*$/GRUB_CMDLINE_LINUX_DEFAULT=/g'
    */
export default async function grubcfg(this: Sequence) {
  const file = `${this.installTarget}/etc/default/grub`
  let content = ''
  const grubs = fs.readFileSync(file, 'utf-8').split('\n')
  for (let i = 0; i < grubs.length; i++) {
    if (grubs[i].includes('GRUB_CMDLINE_LINUX_DEFAULT=')) {
      if (this.partitions.installationMode === 'full-encrypted') {
        grubs[i] = `GRUB_CMDLINE_LINUX_DEFAULT="resume=UUID=${Utils.uuid(this.devices.swap.name)}"`
      } else {
        grubs[i] = `GRUB_CMDLINE_LINUX_DEFAULT="quiet splash resume=UUID=${Utils.uuid(this.devices.swap.name)}"`
      }
    }

    content += grubs[i] + '\n'
  }

  fs.writeFileSync(file, content, 'utf-8')
}
