/**
 * ./src/krill/modules/bootloader-config.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../sequence.js'

export default async function bootloaderConfig(this: Sequence): Promise<void> {
  if (this.distro.familyId === 'debian') {
    this.bootloaderConfigDebian()
  } else if (this.distro.familyId === 'archlinux') {
    this.bootloaderConfigArch()
  }
}
