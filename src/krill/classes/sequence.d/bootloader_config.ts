/**
 * ./src/krill/modules/bootloader-config.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Openmamba from '../../../classes/pacman.d/openmamba.js'
import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../sequence.js'

/**
 * 
 * @param this 
 */
export default async function bootloaderConfig(this: Sequence): Promise<void> {
  let cmd = ''

  /**
  * alpine
  */
  if (this.distro.familyId === 'alpine') {
    if (this.efi) {
      try {
        cmd = `chroot ${this.installTarget} apk add grub grub-efi efibootmgr} ${this.toNull}`
        await exec(cmd, this.echo)
      } catch (error) {
        await showError(cmd, error)
      }
    } else {
      try {
        cmd = `chroot ${this.installTarget} apk add grub grub-bios ${this.toNull}`
        await exec(cmd, this.echo)
      } catch (error) {
        await showError(cmd, error)
      }
    }

    /**
     * archlinux
     */
  } else if (this.distro.familyId === 'archlinux') {
    if (this.efi) {
      try {
        cmd = `chroot ${this.installTarget} pacman -Sy grub efibootmgr} ${this.toNull}`
        await exec(cmd, this.echo)
      } catch (error) {
        await showError(cmd, error)
      }
    } else {
      try {
        cmd = `chroot ${this.installTarget} pacman -Sy grub ${this.toNull}`
        await exec(cmd, this.echo)
      } catch (error) {
        await showError(cmd, error)
      }
    }


    /**
     * debian
     */
  } else if (this.distro.familyId === 'debian') {
    try {
      cmd = `chroot ${this.installTarget} apt-get -y update ${this.toNull}`
      await exec(cmd, this.echo)
    } catch (error) {
      await showError(cmd, error)
    }

    await exec('sleep 1', this.echo)

    const aptInstallOptions = ' apt install -y --no-upgrade --allow-unauthenticated -o Acquire::gpgv::Options::=--ignore-time-conflict '
    if (this.efi) {
      try {
        cmd = `chroot ${this.installTarget} ${aptInstallOptions} grub-efi-${Utils.uefiArch()} --allow-unauthenticated ${this.toNull}`
        await exec(cmd, this.echo)
      } catch (error) {
        await showError(cmd, error)
      }
    } else {
      try {
        cmd = `chroot ${this.installTarget} ${aptInstallOptions} grub-pc ${this.toNull}`
        await exec(cmd, this.echo)
      } catch (error) {
        await showError(cmd, error)
      }
    }


    /**
     * fedora/openmamba
     */
  } else if (this.distro.familyId === 'fedora' || this.distro.familyId === 'openmamba') {
    if (this.efi) {
      try {
        cmd = `chroot ${this.installTarget} dnf -y install grub2 grub2-efi-x64 efibootmgr shim ${this.toNull}`
        await exec(cmd, this.echo)
      } catch (error) {
        await showError(cmd, error)
      }
    } else {
      try {
        cmd = `chroot ${this.installTarget} dnf -y install grub2 grub2-pc ${this.toNull}`
        await exec(cmd, this.echo)
      } catch (error) {
        await showError(cmd, error)
      }
    }


    /**
     * opensuse
     */
  } else if (this.distro.familyId === 'opensuse') {
    if (this.efi) {
      try {
        cmd = `chroot ${this.installTarget} zypper install -y grub2 grub2-i386-pc grub2-x86_64-efi- efibootmgr} ${this.toNull}`
        await exec(cmd, this.echo)
      } catch (error) {
        await showError(cmd, error)
      }
    }
  }
}


/**
 * 
 * @param cmd 
 * @param error 
 */
async function showError(cmd: string, error: any) {
  console.log('error:', error)
  console.log(cmd)
  await Utils.pressKeyToExit(cmd, true)
}