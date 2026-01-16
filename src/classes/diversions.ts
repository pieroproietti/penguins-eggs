/**
 * ./src/classes/diversions.ts
 * penguins-eggs v.26.1.x / ecmascript 2020
 * author: Piero Proietti (modified by Hossein Seilani)
 * license: MIT
 */

import fs from 'fs'
import path from 'path'

import { IDistro } from '../interfaces/index.js'
import Distro from './distro.js'
import Utils from './utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

export default class Diversions {
  /**
   * bootloaders
   * return pathBootloaders
   */
  static bootloaders(familyId: string): string {
    let pathBootloaders = '/usr/lib/'
    if (familyId !== 'debian') {
      if (Utils.isAppImage()) {
        pathBootloaders = path.join(__dirname, '..', '..', 'bootloaders/')
      } else {
        pathBootloaders = '/usr/lib/penguins-eggs/bootloaders/'
      }
    }

    return pathBootloaders
  }

  /**
   * deluser
   * return userdel/deluser
   */
  static deluser(familyId: string): string {
    const userdelFamilies = ['archlinux', 'fedora', 'openmamba', 'opensuse', 'voidlinux']
    return userdelFamilies.includes(familyId) ? 'userdel' : 'deluser'
  }

  // NEW CHANGE [6]
  // Centralized creation of Distro instance
  // Ensures only one point of modification for Distro
  static distro(): IDistro {
    return new Distro()
  }

  /**
   *
   * grubForce
   * return --force/empty
   */
  static grubForce(familyId: string): string {
    const forceFamilies = [, 'fedora']
    return forceFamilies.includes(familyId) ? '--force' : ''
  }

  /**
   *
   * grubName
   * return: grub2/grub
   */
  static grubName(familyId: string): string {
    const grub2Families = [, 'fedora', 'opensuse']
    return grub2Families.includes(familyId) ? 'grub2' : 'grub'
  }

  /**
   * isManjaroBased
   * returns true if Manjaro/Biglinux/Bigcommunity
   */
  static isManjaroBased(distro: string): boolean {
    const manjaroFamilies = ['Manjaro', 'Biglinux', 'Bigcommunity']
    return manjaroFamilies.includes(distro)
  }

  /**
   * isSystemDBoot
   * return true if use systemd-boot
   */
  static isSystemDBoot(familyId: string, isEfi: boolean): boolean {
    return familyId === 'fedora' && isEfi
  }

  /**
   * kernelParameters
   * return kernelParameters
   */
  static kernelParameters(familyId: string, volid: string, fullCrypt = false): string {
    let kp = ''

    switch (familyId) {
      case 'alpine': {
        kp += `alpinelivelabel=${volid} alpinelivesquashfs=/mnt/live/filesystem.squashfs`
        break
      }

      case 'archlinux': {
        const { distroId } = this.distro()
        kp += `boot=live components locales=${process.env.LANG}`
        if (this.isManjaroBased(distroId)) {
          kp += ` misobasedir=manjaro misolabel=${volid}`
        } else {
          kp += ` archisobasedir=arch archisolabel=${volid}`
        }

        break
      }

      case 'debian': {
        kp += `boot=live components locales=${process.env.LANG} cow_spacesize=2G`
        if (fullCrypt) kp += ` live-media=/run/live/medium`
        break
      }

      case 'fedora':
      case 'openmamba': {
        kp += `root=live:CDLABEL=${volid} rd.live.image rd.live.dir=/live rd.live.squashimg=filesystem.squashfs enforcing=0`
        break
      }

      case 'opensuse': {
        kp += `root=live:CDLABEL=${volid} rd.live.image rd.live.dir=/live rd.live.squashimg=filesystem.squashfs apparmor=0`
        break
      }

      case 'voidlinux': {
        kp += `root=live:CDLABEL=${volid} rd.live.image rd.live.dir=/live rd.live.squashimg=filesystem.squashfs rd.debug`
        break
      }

      default: {
        kp += ''
        break
      }
    }

    return kp
  }
}
