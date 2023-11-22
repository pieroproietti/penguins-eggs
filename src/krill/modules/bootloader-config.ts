/**
 * penguins-eggs
 * krill modules: bootloader-config.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'

/**
 *
 * @param this
 */
export default async function bootloaderConfig(this: Sequence): Promise<void> {
  if (this.distro.familyId === 'debian') {
      this.bootloaderConfigDebian()
  } else if (this.distro.familyId === 'archlinux') {
    this.bootloaderConfigArch() 
  }
}

