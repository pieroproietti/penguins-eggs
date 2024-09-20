/**
 * ./src/krill/modules/bootloader-config.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'
import Sequence from '../sequence.js'

/**
 * 
 * @param this 
 */
export default async function bootloaderConfig(this: Sequence): Promise<void> {
  let cmd = ''

  switch (this.distro.familyId) {
    /**
     * fedora
     */
    case 'fedora': {
      if (this.efi) {
        try {
          cmd = `chroot ${this.installTarget} dnf install grub2 grub2-efi-x64 efibootmgr} ${this.toNull}`
          await exec(cmd, this.echo)
        } catch (error) {
          console.log(error)
          await Utils.pressKeyToExit(cmd, true)
        }
      } else {
        try {
          cmd = `chroot ${this.installTarget} dnf install grub2 grub2-pc ${this.toNull}`
          await exec(cmd, this.echo)
        } catch (error) {
          console.log(error)
          await Utils.pressKeyToExit(cmd, true)
        }
      }
      break
    }

    /**
     * alpine
     */
    case 'alpine': {
      if (this.efi) {
        try {
          cmd = `chroot ${this.installTarget} apk add grub grub-efi efibootmgr} ${this.toNull}`
          await exec(cmd, this.echo)
        } catch (error) {
          console.log(error)
          await Utils.pressKeyToExit(cmd, true)
        }
      } 
    }

    /**
     * opensuse
     */
    case 'opensuse': {
      if (this.efi) {
        try {
          cmd = `chroot ${this.installTarget} zypper install -y grub2 grub2-i386-pc grub2-x86_64-efi- efibootmgr} ${this.toNull}`
          await exec(cmd, this.echo)
        } catch (error) {
          console.log(error)
          await Utils.pressKeyToExit(cmd, true)
        }
      } else {
        try {
          cmd = `chroot ${this.installTarget} apk add grub grub-bios ${this.toNull}`
          await exec(cmd, this.echo)
        } catch (error) {
          console.log(error)
          await Utils.pressKeyToExit(cmd, true)
        }
      }
      break
    }

    /**
     * archlinux
     */
    case 'archlinux': {
      if (this.efi) {
        try {
          cmd = `chroot ${this.installTarget} pacman -Sy grub efibootmgr} ${this.toNull}`
          await exec(cmd, this.echo)
        } catch (error) {
          console.log(error)
          await Utils.pressKeyToExit(cmd, true)
        }
      } else {
        try {
          cmd = `chroot ${this.installTarget} pacman -Sy grub ${this.toNull}`
          await exec(cmd, this.echo)
        } catch (error) {
          console.log(error)
          await Utils.pressKeyToExit(cmd, true)
        }
      }
      break
    }

    /**
     * debian
     */
    case 'debian': {
      try {
        cmd = `chroot ${this.installTarget} apt-get update -y ${this.toNull}`
        await exec(cmd, this.echo)
      } catch (error) {
        console.log(error)
        await Utils.pressKeyToExit(cmd, true)
      }

      await exec('sleep 1', this.echo)

      const aptInstallOptions = ' apt install -y --no-upgrade --allow-unauthenticated -o Acquire::gpgv::Options::=--ignore-time-conflict '
      if (this.efi) {
        try {
          cmd = `chroot ${this.installTarget} ${aptInstallOptions} grub-efi-${Utils.uefiArch()} --allow-unauthenticated ${this.toNull}`
          await exec(cmd, this.echo)
        } catch (error) {
          console.log(error)
          await Utils.pressKeyToExit(cmd, true)
        }
      } else {
        try {
          cmd = `chroot ${this.installTarget} ${aptInstallOptions} grub-pc ${this.toNull}`
          await exec(cmd, this.echo)
        } catch (error) {
          console.log(error)
          await Utils.pressKeyToExit(cmd, true)
        }
      }
      break
    }
  }
}
