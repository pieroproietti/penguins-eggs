/**
 * krill: module mkfs
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import {exec} from '../../lib/utils'
import Utils from '../../classes/utils'

/**
* mkfs
*/
export default async function mkfs(this: Sequence): Promise<boolean> {
  const result = true

  if (this.efi) {
    await exec(`mkdosfs -F 32 -I ${this.devices.efi.name} ${this.toNull}`, this.echo)
  }

  if (this.devices.boot.name !== 'none') {
    if (this.devices.boot.fsType === undefined) {
      this.devices.boot.fsType = 'ext2'
      this.devices.boot.mountPoint = '/boot'
    }

    await exec(`mke2fs -Ft ${this.devices.boot.fsType} ${this.devices.boot.name} ${this.toNull}`, this.echo)
  }

  if (this.devices.root.name !== 'none') {
    await exec(`mke2fs -Ft ${this.devices.root.fsType} ${this.devices.root.name} ${this.toNull}`, this.echo)
  }

  if (this.devices.data.name !== 'none') {
    await exec(`mke2fs -Ft ${this.devices.data.fsType} ${this.devices.data.name} ${this.toNull}`, this.echo)
  }

  if (this.devices.swap.name !== 'none') {
    await exec(`mkswap ${this.devices.swap.name} ${this.toNull}`, this.echo)
  }

  return result
}
