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
  switch (this.distro.familyId) {
  case 'alpine': {
    if (this.efi) {
      try {
        cmd = `chroot ${this.installTarget} apk add grub grub-efi efibootmgr shim} ${this.toNull}`
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
  
  break;
  }

  case 'archlinux': {
    if (this.efi) {
      try {
        cmd = `chroot ${this.installTarget} pacman -Sy grub efibootmgr shim} ${this.toNull}`
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
  
  break;
  }

  case 'debian': {
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
        cmd = `chroot ${this.installTarget} ${aptInstallOptions} grub-efi-${Utils.uefiArch()} efibootmgr shim-signed --allow-unauthenticated ${this.toNull}`
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
     * fedora
     */
  
  break;
  }

  case 'fedora': {

    if (this.efi) {
      try {
        cmd = ``
        cmd += `chroot ${this.installTarget} `
        cmd += `dnf -y install grub2 `
        cmd += `grub2-efi-${process.arch} `
        cmd += `grub2-efi-${process.arch}-modules `
        cmd += `efibootmgr `
        cmd += `shim-${process.arch} ${this.toNull}`

        await exec(cmd, this.echo)

      } catch (error) {
        await showError(cmd, error)
      }
    } else {
      try {
        cmd = ``
        cmd += `chroot ${this.installTarget} `
        cmd += `dnf -y install grub2 `
        cmd += `grub2-pc `
        cmd += `grub2-pc-modules ${this.toNull}`
        await exec(cmd, this.echo)
      } catch (error) {
        await showError(cmd, error)
      }
    }

    /**
     * openmamba
     */
  
  break;
  }

  case 'openmamba': {

    if (this.efi) {
      try {
        cmd = ``
        cmd += `chroot ${this.installTarget} `
        cmd += `dnf -y install grub `
        cmd += `grub-efi-x86_64 `
        cmd += `efibootmgr `
        cmd += `shim-signed ${this.toNull}`

        await exec(cmd, this.echo)

      } catch (error) {
        await showError(cmd, error)
      }
    } else {
      try {
        cmd = ``
        cmd += `chroot ${this.installTarget} `
        cmd += `dnf -y install grub ${this.toNull}`
        await exec(cmd, this.echo)
      } catch (error) {
        await showError(cmd, error)
      }
    }


    /**
     * opensuse
     */
  
  break;
  }

  case 'opensuse': {
    if (this.efi) {
      try {
        cmd = `chroot ${this.installTarget} zypper install -y grub2 grub2-x86_64-efi efibootmgr shim} ${this.toNull}`
        await exec(cmd, this.echo)
      } catch (error) {
        await showError(cmd, error)
      }
    } else {
      try {
        cmd = `chroot ${this.installTarget} zypper install -y zypper install -y grub2 grub2-i386-pc ${this.toNull}`
        await exec(cmd, this.echo)
      } catch (error) {
        await showError(cmd, error)
      }
    }
  
  break;
  }
  // No default
  }
  // await Utils.debug(`grub packages install cmd: ${cmd}`)
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