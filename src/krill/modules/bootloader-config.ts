/**
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
      this.execCalamaresModule('bootloader-config')
    }
  } else if (this.distro.familyId === 'archlinux') {
    // nothing
  }
}

