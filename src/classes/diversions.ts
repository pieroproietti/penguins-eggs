/**
 * ./src/classes/diversions.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

/**
 * contiene le variazione di nome 
 * per ogni famiglia
 */

import { IDistro } from '../interfaces/index.js'
import Distro from './distro.js'
import fs from 'fs'
import Pacman from './pacman.js'

export default class Diversions {


  /**
   * 
   * @param familyId 
   * @returns 
   */
  static isSystemDBoot(familyId: string, isEfi: boolean): boolean {
    let isSystemDBoot = false
    if (familyId === 'fedora' && isEfi) {
      isSystemDBoot = true
    }
    return isSystemDBoot
  }

  /**
   * 
   * @param familyId 
   * @returns deluser
   */
  static deluser(familyId: string): string {
    let deluser = 'deluser'
    if (familyId === 'aldos' ||
      familyId === 'archlinux' ||
      familyId === 'fedora' ||
      familyId === 'openmamba' ||
      familyId === 'opensuse' ||
      familyId === 'voidlinux') {
      deluser = 'userdel'
    }
    return deluser
  }

  /**
   * 
   * @param familyId 
   * @returns 
   */
  static grubName(familyId: string): string {
    let grubName = 'grub'
    if (familyId === 'aldos' ||
      familyId === 'fedora' ||
      familyId === 'opensuse') {

      grubName = 'grub2'
    }

    return grubName
  }

  /**
   * grubForce
   */
  static grubForce(familyId: string): string {
    let grubForce = ''
    if (familyId === 'aldos' || familyId === 'fedora') {

      grubForce = '--force'
    }

    return grubForce
  }
  /**
   * 
   * @param familyId 
   * @param volid 
   * @returns 
   */
  static kernelParameters(familyId: string, volid: string, luksUuid = ''): string {
    // GRUB_CMDLINE_LINUX='ipv6.disable=1'

    let kp = ""

    if (familyId === 'alpine') {
      kp += `alpinelivelabel=${volid} alpinelivesquashfs=/mnt/live/filesystem.squashfs`
    } else if (familyId === 'archlinux') {
      kp += `boot=live components locales=${process.env.LANG}`
      const distroId = this.distro().distroId
      if (this.isManjaroBased(distroId)) {
        kp += ` misobasedir=manjaro misolabel=${volid}`
      } else {
        kp += ` archisobasedir=arch archisolabel=${volid}`
      }
    } else if (familyId === 'debian') {
      /**
       * da rivedere dracut/initramfs
       */
      if (Pacman.packageIsInstalled('dracut')) {
        if (luksUuid !== '') {
          // dracut rd.luks.uuid
          
          let cmd =`boot=live \
                root=live:LABEL=${volid} \
                rd.luks.uuid=${luksUuid} \
                nomodeset \
                rd.udev.settle \
                rd.luks.timeout=180 \
                rd.debug \
                rd.shell`
          
          kp += cmd.replaceAll(/\s\s+/g, ' ')

        } else {
          // dracut: rd.live.squashimg
          kp += `root=live:CDLABEL=${volid} rd.live.image rd.live.dir=/live rd.live.squashimg=filesystem.squashfs`
        }
      } else {
          kp += `boot=live components locales=${process.env.LANG} cow_spacesize=2G`
      }
    } else if (familyId === 'fedora') {
      kp += `root=live:CDLABEL=${volid} rd.live.image rd.live.dir=/live rd.live.squashimg=filesystem.squashfs selinux=0`
    } else if (familyId === 'openmamba') {
      kp += `root=live:CDLABEL=${volid} rd.live.image rd.live.dir=/live rd.live.squashimg=filesystem.squashfs selinux=0`
    } else if (familyId === 'opensuse') {
      kp += `root=live:CDLABEL=${volid} rd.live.image rd.live.dir=/live rd.live.squashimg=filesystem.squashfs apparmor=0`
    } else if (familyId === 'voidlinux') {
      kp += `root=live:CDLABEL=${volid} rd.live.image rd.live.dir=/live rd.live.squashimg=filesystem.squashfs rd.debug`
    }

    return kp
  }

  /**
     *
     * @returns
     */
  static distro(): IDistro {
    return new Distro()
  }


  /**
  * isManjaroBased
  */
  static isManjaroBased(distro: string): boolean {
    let found = false
    if (distro === 'Manjaro' ||
      distro === `Biglinux` ||
      distro === `Bigcommunity`) {
      found = true
    }

    return found
  }

  static bootloaders(familyId: string): string {
    let bootloaders = '/usr/lib/'
    if (familyId !== 'debian') {
      bootloaders = '/usr/lib/penguins-eggs/bootloaders/'
    }
    return bootloaders
  }

}
