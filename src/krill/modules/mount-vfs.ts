/**
 * ./src/krill/modules/mount-vfs.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import { exec } from '../../lib/utils.js'
import Sequence from '../sequence.js'
/**
 * mountvfs()
 */
export async function mountVfs(this: Sequence) {
  await exec(`mkdir ${this.installTarget}/dev ${this.toNull}`, this.echo)
  await exec(`mkdir ${this.installTarget}/dev/pts ${this.toNull}`, this.echo)
  await exec(`mkdir ${this.installTarget}/proc ${this.toNull}`, this.echo)
  await exec(`mkdir ${this.installTarget}/sys ${this.toNull}`, this.echo)
  await exec(`mkdir ${this.installTarget}/run ${this.toNull}`, this.echo)

  await exec(`mount -o bind /dev ${this.installTarget}/dev ${this.toNull}`, this.echo)
  await exec(`mount -o bind /dev/pts ${this.installTarget}/dev/pts ${this.toNull}`, this.echo)
  await exec(`mount -o bind /proc ${this.installTarget}/proc ${this.toNull}`, this.echo)
  await exec(`mount -o bind /sys ${this.installTarget}/sys ${this.toNull}`, this.echo)
  if (this.efi) {
    await exec(`mount -o bind /sys/firmware/efi/efivars ${this.installTarget}/sys/firmware/efi/efivars ${this.toNull}`, this.echo)
  }

  await exec(`mount -o rbind /run ${this.installTarget}/run ${this.toNull}`, this.echo)
}

/**
 *
 */
export async function umountVfs(this: Sequence) {
  await this.umount(`${this.installTarget}/dev/pts`)
  await this.umount(`${this.installTarget}/dev`)
  await this.umount(`${this.installTarget}/proc`)
  await this.umount(`${this.installTarget}/run`)
  if (this.efi) {
    await this.umount(`${this.installTarget}/sys/firmware/efi/efivars`)
  }
  await this.umount(`${this.installTarget}/sys`)
}
