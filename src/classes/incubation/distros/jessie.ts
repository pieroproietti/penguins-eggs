/**
 * penguins-eggs: jessie.ts
 *
 * it work both: jessie
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import {IRemix, IDistro} from '../../../interfaces/index.js'
import {IInstaller} from '../../../interfaces/i-installer.js'
import Fisherman from '../fisherman.js'

import {exec} from '../../../lib/utils.js'

/**
 *
 */
export class Jessie {
  verbose = false

  installer = {} as IInstaller

  remix: IRemix

  distro: IDistro

  release = false

  user_opt: string

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
    await fisherman.settings(this.remix.branding)

    await fisherman.buildModule('partition', this.remix.branding)
    await fisherman.buildCalamaresModule('sources-yolk', true)
    await fisherman.moduleRemoveuser(this.user_opt)
    await fisherman.buildCalamaresModule('sources-yolk-undo', false)
  }
}
