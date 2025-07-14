/**
 * ./src/krill/modules/grubcfg.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import fs from 'node:fs'

import Utils from '../../../classes/utils.js'
import Sequence from '../../classes/sequence.js'
import { SwapChoice } from '../krill_enums.js'
import { InstallationMode } from '../krill_enums.js'
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
  const grubs = fs.readFileSync(file, 'utf8').split('\n')
  for (let i = 0; i < grubs.length; i++) {
    // RESUME
    if (grubs[i].includes('GRUB_CMDLINE_LINUX_DEFAULT=')) {
      if (this.partitions.filesystemType==='btrfs'){
        // userSwapChoice != SwapChoice.File) {
        // grubs[i] = this.partitions.installationMode === InstallationMode.Luks ? `GRUB_CMDLINE_LINUX_DEFAULT="resume=UUID=${Utils.uuid(this.devices.swap.name)}"` : `GRUB_CMDLINE_LINUX_DEFAULT="quiet splash resume=UUID=${Utils.uuid(this.devices.swap.name)}"`
        grubs[i] = this.partitions.installationMode === InstallationMode.Luks ? `GRUB_CMDLINE_LINUX_DEFAULT="resume=UUID=${Utils.uuid(this.devices.swap.name)}"` : `GRUB_CMDLINE_LINUX_DEFAULT="quiet splash rootflags=subvol=@"`
      }
    }

    content += grubs[i] + '\n'
  }

  fs.writeFileSync(file, content, 'utf-8')
}
