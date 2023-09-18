/**
 * penguins-eggs
 * krill modules: initramfs-cfg.ts
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
export default async function initramfsCfg(this: Sequence, installDevice: string): Promise<void> {
  if (this.distro.familyId === 'debian') {
    // userSwapChoices = ['none', 'small', 'suspend', 'file']
    const file = this.installTarget + '/etc/initramfs-tools/conf.d/resume'
    let text = ''
    if (this.partitions.userSwapChoice === 'none' || this.partitions.userSwapChoice === 'file') {
      text += '#RESUME=none\n'
    } else {
      text += 'RESUME=UUID=' + Utils.uuid(this.devices.swap.name)
    }

    Utils.write(file, text)
  } else if (this.distro.familyId === 'archlinux') {
    console.log('initramfsCfg skipped')
  }
}
