/**
 * penguins-eggs: bionic.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import fs from 'node:fs'
import shx from 'shelljs'
import yaml from 'js-yaml'
import path from 'node:path'

import { IInstaller, IRemix, IDistro } from '../../../interfaces'

import Fisherman from '../fisherman'

import { exec } from '../../../lib/utils'

interface IReplaces {
  search: string
  replace: string
}

/**
 *
 */
export class Bionic {
  verbose = false

  installer = {} as IInstaller

  remix: IRemix

  distro: IDistro

  release = false

  user_opt: string

  /**
   * @param remix
   * @param distro
   * @param release
   * @param verbose
   */
  constructor(installer: IInstaller, remix: IRemix, distro: IDistro, user_opt: string, release = false, verbose = false) {
    this.installer = installer
    this.remix = remix
    this.distro = distro
    this.user_opt = user_opt
    this.verbose = verbose
    this.release = release
  }

  /**
   *
   */
  async create() {
    const fisherman = new Fisherman(this.distro, this.installer, this.verbose)

    await fisherman.settings(this.remix.branding)

    await fisherman.buildModule('partition', this.remix.branding)
    await fisherman.buildModule('mount')
    await fisherman.moduleUnpackfs(this.distro.squashfs) //
    await fisherman.buildModule('machineid')
    await fisherman.buildModule('fstab')
    await fisherman.buildModule('locale')
    await fisherman.buildModule('keyboard')
    await fisherman.buildModule('localecfg')
    await fisherman.buildModule('luksbootkeyfile')
    await fisherman.buildModule('users')
    await fisherman.moduleDisplaymanager() //
    await fisherman.buildModule('networkcfg')
    await fisherman.buildModule('hwclock')
    await fisherman.buildCalamaresModule('sources-yolk', true)
    await fisherman.buildCalamaresModule('bug')
    await fisherman.buildModule('initramfscfg')
    await fisherman.buildModule('initramfs')
    await fisherman.buildCalamaresPy('grubcfg')
    await fisherman.buildModule('bootloader')
    await fisherman.buildCalamaresModule('after-bootloader')
    await fisherman.buildCalamaresModule('add386arch', false)
    await fisherman.modulePackages(this.distro, this.release) //
    await fisherman.moduleRemoveuser(this.user_opt) //
    await fisherman.buildCalamaresModule('sources-yolk-undo', false)
    await fisherman.buildCalamaresModule('cleanup', true)
    await fisherman.buildModule('umount')
    await fisherman.buildModule('finished')
  }
}
