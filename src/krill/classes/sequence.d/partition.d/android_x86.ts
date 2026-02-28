/**
 * ./src/krill/classes/sequence.d/partition.d/android_x86.ts
 * penguins-eggs — Android backend
 * license: MIT
 *
 * Android-specific partition scheme for x86/x86_64 installs.
 *
 * Layout (GPT, UEFI):
 *   Part 1: EFI System Partition  (256 MiB, FAT32)
 *   Part 2: /system               (variable, ext4, read-only after install)
 *   Part 3: /vendor               (512 MiB, ext4, read-only after install)
 *   Part 4: /data                 (remaining, ext4, read-write)
 *
 * Layout (MBR, BIOS):
 *   Part 1: /boot                 (256 MiB, ext4, GRUB)
 *   Part 2: /system               (variable, ext4)
 *   Part 3: /vendor               (512 MiB, ext4)
 *   Part 4: /data                 (remaining, ext4)
 *
 * Note: Android doesn't use swap. The /cache partition is typically
 * a directory inside /data on modern Android (10+).
 */

import { exec } from '../../../../lib/utils.js'
import Sequence from '../../sequence.js'

/**
 * Android x86 UEFI partition scheme.
 */
export async function androidUefi(this: Sequence, installDevice = '', p = ''): Promise<boolean> {
  await exec(`parted --script ${installDevice} mklabel gpt`, this.echo)

  // Part 1: EFI System Partition (256 MiB)
  await exec(`parted --script ${installDevice} mkpart efi fat32 1MiB 257MiB`, this.echo)
  await exec(`parted --script ${installDevice} set 1 boot on`, this.echo)
  await exec(`parted --script ${installDevice} set 1 esp on`, this.echo)

  // Part 2: system (60% of remaining space)
  await exec(`parted --script ${installDevice} mkpart system ext4 257MiB 60%`, this.echo)

  // Part 3: vendor (512 MiB)
  await exec(`parted --script ${installDevice} mkpart vendor ext4 60% 65%`, this.echo)

  // Part 4: data (remaining space)
  await exec(`parted --script ${installDevice} mkpart data ext4 65% 100%`, this.echo)

  // Map devices
  this.devices.efi.name = `${installDevice}${p}1`
  this.devices.efi.fsType = 'F 32 -I'
  this.devices.efi.mountPoint = '/boot/efi'

  this.devices.boot.name = 'none'

  // Use root device for /system (Krill's root = Android's system)
  this.devices.root.name = `${installDevice}${p}2`
  this.devices.root.fsType = 'ext4'
  this.devices.root.mountPoint = '/system'

  // Use data device for /vendor
  this.devices.data.name = `${installDevice}${p}3`
  this.devices.data.fsType = 'ext4'
  this.devices.data.mountPoint = '/vendor'

  // Swap device repurposed for /data
  this.devices.swap.name = `${installDevice}${p}4`
  this.devices.swap.fsType = 'ext4'
  this.devices.swap.mountPoint = '/data'

  return true
}

/**
 * Android x86 BIOS (legacy) partition scheme.
 */
export async function androidBios(this: Sequence, installDevice = '', p = ''): Promise<boolean> {
  await exec(`parted --script ${installDevice} mklabel msdos`, this.echo)

  // Part 1: /boot (256 MiB, for GRUB)
  await exec(`parted --script ${installDevice} mkpart primary ext4 1MiB 257MiB`, this.echo)
  await exec(`parted --script ${installDevice} set 1 boot on`, this.echo)

  // Part 2: /system (60% of remaining)
  await exec(`parted --script ${installDevice} mkpart primary ext4 257MiB 60%`, this.echo)

  // Part 3: /vendor (512 MiB)
  await exec(`parted --script ${installDevice} mkpart primary ext4 60% 65%`, this.echo)

  // Part 4: /data (remaining)
  await exec(`parted --script ${installDevice} mkpart primary ext4 65% 100%`, this.echo)

  // Map devices
  this.devices.efi.name = 'none'

  this.devices.boot.name = `${installDevice}${p}1`
  this.devices.boot.fsType = 'ext4'
  this.devices.boot.mountPoint = '/boot'

  this.devices.root.name = `${installDevice}${p}2`
  this.devices.root.fsType = 'ext4'
  this.devices.root.mountPoint = '/system'

  this.devices.data.name = `${installDevice}${p}3`
  this.devices.data.fsType = 'ext4'
  this.devices.data.mountPoint = '/vendor'

  this.devices.swap.name = `${installDevice}${p}4`
  this.devices.swap.fsType = 'ext4'
  this.devices.swap.mountPoint = '/data'

  return true
}
