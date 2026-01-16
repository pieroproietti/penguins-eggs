/**
 * ./src/krill/modules/initramfs-cfg.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import { SwapChoice } from '../krill_enums.js'
import Sequence from '../sequence.js'

/**
 *
 * @param this
 */
export default async function initramfsCfg(this: Sequence, installDevice: string): Promise<void> {
  if (this.distro.familyId === 'debian') {
    // userSwapChoices = ['none', 'small', 'suspend', 'file']
    const file = this.installTarget + '/etc/initramfs-tools/conf.d/resume'
    let text = ''
    if (SwapChoice.None) {
      text += `#RESUME=none\n`
    } else if (this.partitions.userSwapChoice === SwapChoice.File) {
      const swap_uuid = (await exec(`findmnt -no UUID -T /swapfile`)).data.trim()
      const swap_offset = (await exec(`filefrag -v /swapfile | awk 'NR==4 {print $4}' | sed 's/\..*//'`)).data.trim()
      text += `RESUME=UUID=${swap_uuid}\n`
      text += `RESUME_OFFSET=${swap_offset}\n`
    } else {
      text += 'RESUME=UUID=' + Utils.uuid(this.devices.swap.name)
    }

    Utils.write(file, text)
  }
}
