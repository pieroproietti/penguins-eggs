/**
 * ./src/classes/incubation/distros/opensuse.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { IDistro, IInstaller, IRemix } from '../../../interfaces/index.js'
import CFS from '../../../krill/classes/cfs.js'
import Kernel from '../../utils.d/kernel.js'
import Fisherman from '../fisherman.js'

/**
 *
 */
export class Opensuse {
  distro: IDistro
installer = {} as IInstaller
isClone = false
release = false
remix: IRemix
theme: string
user_opt: string
verbose = false

  /**
   * @param remix
   * @param distro
   * @param displaymanager
   * @param verbose
   */
  constructor(installer: IInstaller, remix: IRemix, distro: IDistro, user_opt: string, release = false, theme = 'eggs', isClone = false, verbose = false) {
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
   * locale, partitions, users can come from themes
   */
  async create() {
    const fisherman = new Fisherman(this.distro, this.installer, this.verbose)

    await fisherman.createCalamaresSettings(this.theme, this.isClone)

    await fisherman.buildModule('welcome')
    await fisherman.buildModule('partition', this.theme)
    await fisherman.buildModule('mount')
    await fisherman.buildModuleUnpackfs()
    await fisherman.buildModule('machineid')
    await fisherman.buildModule('fstab')
    await fisherman.buildModule('locale', this.theme)
    await fisherman.buildModule('keyboard')
    await fisherman.buildModule('localecfg')
    await fisherman.buildModule('plymouthcfg')
    await fisherman.buildModule('luksbootkeyfile')
    await fisherman.buildModule('dracutlukscfg')
    await fisherman.buildModule('users', this.theme)
    await fisherman.buildModule('displaymanager')
    await fisherman.buildModule('networkcfg')
    await fisherman.buildModule('hwclock')
    await fisherman.buildModule('services-systemd')
    await fisherman.buildModuleDracut(Kernel.initramfs())
    await fisherman.buildCalamaresModule('bootloaderspecification')
    await fisherman.buildModule('grubcfg')
    await fisherman.buildModule('bootloader')
    await fisherman.buildModulePackages(this.distro, this.release)
    await fisherman.buildModuleRemoveuser(this.user_opt)

    /**
     * cfs: custom final steps
     */
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
