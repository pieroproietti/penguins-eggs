/**
 * ./src/classes/diversions.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti (modified by Hossein Seilani)
 * license: MIT
 *
 * NEW VERSION: Improved and cleaned with detailed comments and new changes
 */

import { IDistro } from '../interfaces/index.js';
import Distro from './distro.js';
import fs from 'fs';
import path from 'path'
import Utils from './utils.js';
import Pacman from './pacman.js';

export default class Diversions {

  // NEW CHANGE [1]
  // Made isSystemDBoot more readable by using direct return without extra variable.
  // Simplified logic for clarity.
  static isSystemDBoot(familyId: string, isEfi: boolean): boolean {
    return familyId === 'fedora' && isEfi;
  }

  // NEW CHANGE [2]
  // Simplified deluser function using array.includes and default value.
  // This makes adding new families easier and avoids long OR chains.
  static deluser(familyId: string): string {
    const userdelFamilies = ['aldos', 'archlinux', 'fedora', 'openmamba', 'opensuse', 'voidlinux'];
    return userdelFamilies.includes(familyId) ? 'userdel' : 'deluser';
  }

  // NEW CHANGE [3]
  // Improved grubName using array.includes and direct return
  // Cleaner, easier to maintain if new families are added
  static grubName(familyId: string): string {
    const grub2Families = ['aldos', 'fedora', 'opensuse'];
    return grub2Families.includes(familyId) ? 'grub2' : 'grub';
  }

  // NEW CHANGE [4]
  // Simplified grubForce function with array.includes
  // Provides explicit "--force" only for specific families
  static grubForce(familyId: string): string {
    const forceFamilies = ['aldos', 'fedora'];
    return forceFamilies.includes(familyId) ? '--force' : '';
  }

  // NEW CHANGE [5]
  // Improved kernelParameters function:
  // - Use template literals consistently
  // - Reduce redundant code
  // - Added optional `fullCrypt` handling for debian
  static kernelParameters(familyId: string, volid: string, fullCrypt = false): string {
    let kp = '';

    switch (familyId) {
      case 'alpine':
        kp += `alpinelivelabel=${volid} alpinelivesquashfs=/mnt/live/filesystem.squashfs`;
        break;
      case 'archlinux': {
        const distroId = this.distro().distroId;
        kp += `boot=live components locales=${process.env.LANG}`;
        if (this.isManjaroBased(distroId)) {
          kp += ` misobasedir=manjaro misolabel=${volid}`;
        } else {
          kp += ` archisobasedir=arch archisolabel=${volid}`;
        }
        break;
      }
      case 'debian':
        kp += `boot=live components locales=${process.env.LANG} cow_spacesize=2G`;
        if (fullCrypt) kp += ` live-media=/run/live/medium`;
        break;
      case 'fedora':
      case 'openmamba':
        kp += `root=live:CDLABEL=${volid} rd.live.image rd.live.dir=/live rd.live.squashimg=filesystem.squashfs selinux=0`;
        break;
      case 'opensuse':
        kp += `root=live:CDLABEL=${volid} rd.live.image rd.live.dir=/live rd.live.squashimg=filesystem.squashfs apparmor=0`;
        break;
      case 'voidlinux':
        kp += `root=live:CDLABEL=${volid} rd.live.image rd.live.dir=/live rd.live.squashimg=filesystem.squashfs rd.debug`;
        break;
      default:
        kp += '';
        break;
    }

    return kp;
  }

  // NEW CHANGE [6]
  // Centralized creation of Distro instance
  // Ensures only one point of modification for Distro
  static distro(): IDistro {
    return new Distro();
  }

  // NEW CHANGE [7]
  // Simplified isManjaroBased function using array.includes
  // Makes it easier to maintain and extend to new derivatives
  static isManjaroBased(distro: string): boolean {
    const manjaroFamilies = ['Manjaro', 'Biglinux', 'Bigcommunity'];
    return manjaroFamilies.includes(distro);
  }

  /**
   * 
   * @param familyId 
   * @returns 
   */
  static bootloaders(familyId: string): string {
    // 1. AppImage ha priorità per non-Debian
    if (Utils.isAppImage() && familyId !== 'debian') {
      const appImagePath = path.join(__dirname, '..', '..', 'usr', 'lib', 'penguins-eggs', 'bootloaders');
      if (fs.existsSync(appImagePath)) {
        return appImagePath;
      }
    }

    // 2. Logica originale per sistemi nativi
    return familyId === 'debian' ? '/usr/lib/' : '/usr/lib/penguins-eggs/bootloaders/';
  }
}
