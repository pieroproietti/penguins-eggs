/**
 * ./src/krill/modules/initramfs.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import path from 'node:path'

import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../../classes/sequence.js'
// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * initramfs()
 */
export default async function initramfs(this: Sequence) {
  if (this.distro.familyId === 'debian') {
    /**
     * Debian
     */
    let cmd = `chroot ${this.installTarget} mkinitramfs -o /boot/initrd.img-$(uname -r)`
    await exec(cmd, this.echo)

  } else if (this.distro.familyId === 'archlinux') {
    /**
     * Archlinux
     */
    let initrdImg = path.basename(Utils.initrdImg())
    let cmd=`chroot ${this.installTarget} mkinitcpio -g /boot/${initrdImg}}`
    await exec(cmd, this.echo)

  } else if (this.distro.familyId === 'alpine') {
    /**
     * Alpine
     */
    let cmd=`chroot ${this.installTarget} mkinitfs`
    await exec(cmd, this.echo)

  } else if (this.distro.familyId === 'fedora') {    
    /**
     * Fedora
     */
    let cmd=`chroot ${this.installTarget} dracut -f`
    await exec(cmd, this.echo)

  } else if (this.distro.familyId === 'opensuse') {    
    /**
     * Opensuse
     */
    let cmd=`chroot ${this.installTarget} dracut -f`
    await exec(cmd, this.echo)

  }
} 
