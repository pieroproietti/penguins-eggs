/**
 * ./src/classes/incubation/incubator.d/android.ts
 * penguins-eggs — Android backend
 * license: MIT
 *
 * Krill installer adapter for Android systems.
 * Android doesn't use Calamares — this configures Krill
 * with Android-specific partitioning (system/vendor/data/cache).
 */

import { IDistro, IInstaller, IRemix } from '../../../interfaces/index.js'
import CFS from '../../../krill/classes/cfs.js'
import Fisherman from '../fisherman.js'

export class Android {
  distro: IDistro
  installer = {} as IInstaller
  isClone: boolean
  release = false
  remix: IRemix
  theme: string
  user_opt: string
  verbose = false

  constructor(
    installer: IInstaller,
    remix: IRemix,
    distro: IDistro,
    user_opt: string,
    release = false,
    theme = 'eggs',
    isClone = false,
    verbose = false
  ) {
    this.installer = installer
    this.remix = remix
    this.distro = distro
    this.user_opt = user_opt
    this.verbose = verbose
    this.release = release
    this.theme = theme
    this.isClone = isClone
  }

  /**
   * Create Krill installer configuration for Android.
   *
   * Android partitioning differs from standard Linux:
   *   - /system  (read-only, the OS)
   *   - /vendor  (read-only, hardware drivers)
   *   - /data    (read-write, user data)
   *   - /cache   (read-write, temporary)
   *   - /boot    (kernel + ramdisk)
   *   - /recovery (optional)
   *
   * For x86 installs, we also need an EFI System Partition
   * and optionally a GRUB boot partition.
   */
  async create() {
    const fisherman = new Fisherman(this.distro, this.installer, this.verbose)

    await fisherman.createCalamaresSettings(this.theme, this.isClone)

    // Welcome screen
    await fisherman.buildModule('welcome')

    // Android-specific partition layout
    await fisherman.buildModule('partition', this.theme)
    await fisherman.buildModule('mount')

    // Unpack the Android system (system.sfs → /system)
    await fisherman.buildModuleUnpackfs()

    // Machine ID
    await fisherman.buildCalamaresModule('machineid', true)

    // Filesystem table — Android uses different mount points
    await fisherman.buildModule('fstab')

    // Locale and keyboard (Android handles these differently,
    // but Krill still needs them for the installer UI)
    await fisherman.buildModule('locale', this.theme)
    await fisherman.buildModule('keyboard')

    // Bootloader — GRUB for x86, U-Boot config for ARM
    await fisherman.buildModule('grubcfg')
    await fisherman.buildModule('bootloader')

    // Custom final steps
    const cfs = new CFS()
    const steps = await cfs.steps()
    if (steps.length > 0) {
      for (const step of steps) {
        await fisherman.buildCalamaresModule(step, true, this.theme)
      }
    }

    await fisherman.buildModule('umount')
    await fisherman.buildModuleFinished()
  }
}
