/**
 * penguins-eggs
 * krill modules: bootloader-config.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import {exec} from '../../lib/utils'
import Utils from '../../classes/utils'

/**
 *
 * @param this
 */
export default async function bootloaderConfig(this: Sequence): Promise<void> {
  if (this.distro.familyId === 'debian') {
    if (this.distro.distroLike === 'ubuntu') {
      this.bootloaderConfigUbuntu()
    } else {
      this.bootloaderConfigDebian()
    }
  } else if (this.distro.familyId === 'archlinux') {
    this.bootloaderConfigArch() 
  }
}

