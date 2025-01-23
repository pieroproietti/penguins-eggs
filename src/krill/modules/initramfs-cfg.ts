/**
 * ./src/krill/modules/initramfs-cfg.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Utils from '../../classes/utils.js'
import Sequence from '../sequence.js'
import { SwapChoice } from '../../enum/e-krill.js'

/**
 *
 * @param this
 */
export default async function initramfsCfg(this: Sequence, installDevice: string): Promise<void> {
  if (this.distro.familyId === 'debian') {
    // userSwapChoices = ['none', 'small', 'suspend', 'file']
    const file = this.installTarget + '/etc/initramfs-tools/conf.d/resume'
    let text = ''
    text += this.partitions.userSwapChoice === SwapChoice.None || this.partitions.userSwapChoice === SwapChoice.File ? '#RESUME=none\n' : 'RESUME=UUID=' + Utils.uuid(this.devices.swap.name)
    Utils.write(file, text)
  }
}
