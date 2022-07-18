/**
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import { exec } from '../../lib/utils'
import Utils from '../../classes/utils'

/**
   * bootloader
   * @param target
   * @param options
   */
export default async function bootloader(this: Sequence) {
    let echoYes = Utils.setEcho(true)
    // await exec(`chroot ${this.installTarget} grub-install ${this.partitions.installationDevice} ${this.toNull}`, this.echo)
    // await exec(`chroot ${this.installTarget} update-grub ${this.toNull}`, this.echo)
    // await exec(`sleep 1 ${this.toNull}`, this.echo)

    // non trova update-grub
    await exec(`chroot ${this.installTarget} grub-install ${this.partitions.installationDevice} ${this.toNull}`, echoYes)
    await exec(`chroot ${this.installTarget} update-grub ${this.toNull}`, echoYes)
    await exec(`sleep 1 ${this.toNull}`, echoYes)
}
