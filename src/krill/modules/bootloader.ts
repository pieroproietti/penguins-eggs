/**
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import { exec } from '../../lib/utils'

/**
   * bootloader
   * @param target
   * @param options
   */
export default async function bootloader(this: Sequence) {
    await exec(`chroot ${this.installTarget} grub-install ${this.partitions.installationDevice} ${this.toNull}`, this.echo)
    await exec(`chroot ${this.installTarget} update-grub ${this.toNull}`, this.echo)
    await exec(`sleep 1 ${this.toNull}`, this.echo)
}
