/**
 * penguins-eggs: buster.ts
 *
 * it work both: buster, bullseye
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

/**
 *
 */
export class Buster {
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
    await fisherman.moduleUnpackfs()
    await fisherman.buildCalamaresModule('dpkg-unsafe-io', true)
    await fisherman.buildCalamaresModule('sources-yolk', true)
    await fisherman.buildModule('machineid')
    await fisherman.buildModule('fstab')
    await fisherman.buildModule('locale')
    await fisherman.buildModule('keyboard')
    await fisherman.buildModule('localecfg')
    await fisherman.buildModule('users')
    await fisherman.moduleDisplaymanager()
    await fisherman.buildModule('networkcfg')
    await fisherman.buildModule('hwclock')
    await fisherman.buildModule('services-systemd')
    await fisherman.buildCalamaresModule('bootloader-config', true)
    await fisherman.buildModule('grubcf')
    await fisherman.buildModule('bootloader')
    await fisherman.modulePackages(this.distro, this.release)
    await fisherman.buildModule('luksbootkeyfile')
    await fisherman.buildModule('plymouthcfg')
    await fisherman.buildModule('initramfscfg')
    await fisherman.buildModule('initramfs')
    await fisherman.buildCalamaresModule('dpkg-unsafe-io-undo', false)
    await fisherman.moduleRemoveuser(this.user_opt)
    await fisherman.buildCalamaresModule('sources-yolk-undo', false)
    await fisherman.buildCalamaresModule('cleanup', true)
    await fisherman.buildModule('umount')
    await fisherman.moduleFinished()
  }
}
