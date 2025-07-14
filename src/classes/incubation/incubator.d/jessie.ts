/**
 * ./src/classes/incubation/distros/jessie.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { IInstaller } from '../../../interfaces/i-installer.js'
import { IDistro, IRemix } from '../../../interfaces/index.js'
import { exec } from '../../../lib/utils.js'
import Fisherman from '../fisherman.js'

/**
 *
 */
export class Jessie {
  distro: IDistro

  installer = {} as IInstaller

  release = false

  remix: IRemix

  user_opt: string

  verbose = false

  /**
   * @param remix
   * @param distro
   * @param displaymanager
   * @param verbose
   */
  constructor(installer: IInstaller, remix: IRemix, distro: IDistro, user_opt: string, release = false, verbose = false) {
    this.installer = installer
    this.remix = remix
    this.distro = distro
    this.user_opt = user_opt
    this.verbose = verbose
    this.release = release // nel senso di --final
  }

  /**
   * partitions can come from themes
   */
  async create() {
    const fisherman = new Fisherman(this.distro, this.installer, this.verbose)
    await fisherman.createCalamaresSettings(this.remix.branding)

    await fisherman.buildModule('partition', this.remix.branding)
    await fisherman.buildCalamaresModule('sources-yolk', true)
    await fisherman.moduleRemoveuser(this.user_opt)
    await fisherman.buildCalamaresModule('sources-yolk-undo', false)
  }
}
