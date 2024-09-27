/**
 * ./src/krill/modules/initramfs.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import path from 'node:path'

import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'
import Sequence from '../sequence.js'
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
    let cmd = `chroot ${this.installTarget} mkinitramfs -o ~/initrd.img-$(uname -r) ${this.toNull}`
    cmd = `chroot ${this.installTarget} mv ~/initrd.img-$(uname -r) /boot ${this.toNull}`
    await exec(cmd, this.echo)

  } else if (this.distro.familyId === 'archlinux') {
    /**
     * Archlinux
     */
    let initrdImg = Utils.initrdImg()
    initrdImg = initrdImg.slice(Math.max(0, initrdImg.lastIndexOf('/') + 1))
    //let cmd = `mkinitcpio -c ${path.resolve(__dirname, '../../../mkinitcpio/arch/mkinitcpio-install.conf')} -g ${this.installTarget}/boot/${initrdImg}`
    let cmd = `mkinitcpio -g ${this.installTarget}/boot/${initrdImg}`
    if (this.distro.distroId === 'Manjaro') {
      cmd = `mkinitcpio -c ${path.resolve(__dirname, '../../../mkinitcpio/manjaro/mkinitcpio-install.conf')} -g ${this.installTarget}/boot/${initrdImg}`
    }
    await exec(cmd, Utils.setEcho(true))

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
    let cmd=`chroot ${this.installTarget} dracut -f ${this.toNull}`
    await exec(cmd, this.echo)

  } else if (this.distro.familyId === 'opensuse') {    
    /**
     * Opensuse
     */
    let cmd=`chroot ${this.installTarget} dracut -f ${this.toNull}`
    await exec(cmd, this.echo)

  }
} 
