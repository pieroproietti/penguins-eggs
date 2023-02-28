/**
 * penguins-eggs: focal.ts
 * used for: groovy, hirsute
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import fs from 'node:fs'
import shx from 'shelljs'
import yaml from 'js-yaml'
import path from 'node:path'
import {IInstaller, IRemix, IDistro} from '../../../interfaces'
import Fisherman from '../fisherman'

import {exec} from '../../../lib/utils'
import {throws} from 'node:assert'

interface IReplaces {
  search: string
  replace: string
}

/**
 *
 */
export class Focal {
  verbose = false

  installer = {} as IInstaller

  remix: IRemix

  distro: IDistro

  release = false

  user_opt: string

  theme: string

  /**
   * @param remix
   * @param distro
   * @param displaymanager
   * @param verbose
   */
  constructor(installer: IInstaller, remix: IRemix, distro: IDistro, user_opt: string, release = false, theme = 'eggs', verbose = false) {
    this.installer = installer
    this.remix = remix
    this.distro = distro
    this.user_opt = user_opt
    this.verbose = verbose
    this.release = release
    this.theme = theme
  }

  /**
   * locale, partitions, users can come from themes
   */
  async create() {
    const fisherman = new Fisherman(this.distro, this.installer, this.verbose)

    await fisherman.settings(this.remix.branding)

    await fisherman.buildModule('partition', this.theme)
    await fisherman.buildModule('mount')
    await fisherman.moduleUnpackfs()
    await fisherman.buildCalamaresModule('sources-yolk', true)
    await fisherman.buildModule('machineid')
    await fisherman.buildModule('fstab')
    await fisherman.buildModule('locale', this.theme)
    await fisherman.buildModule('keyboard')
    await fisherman.buildModule('localecfg')
    await fisherman.buildModule('luksbootkeyfile')
    await fisherman.buildModule('users', this.theme)
    await fisherman.moduleDisplaymanager()
    await fisherman.buildModule('networkcfg')
    await fisherman.buildModule('hwclock')
    await fisherman.contextualprocess('before_bootloader_mkdirs')
    await fisherman.shellprocess('bug-LP#1829805')
    await fisherman.buildModule('initramfs')
    await fisherman.buildModule('grubcfg')
    await fisherman.contextualprocess('before_bootloader')
    await fisherman.buildModule('bootloader')
    await fisherman.contextualprocess('after_bootloader')
    await fisherman.shellprocess('add386arch')
    await fisherman.modulePackages(this.distro, this.release) //
    await fisherman.moduleRemoveuser(this.user_opt)
    await fisherman.buildCalamaresModule('sources-yolk', false)
    await fisherman.buildCalamaresModule('sources-yolk-undo', false)
    await fisherman.buildCalamaresModule('cleanup', true)
    await fisherman.buildModule('umount')
    await fisherman.buildModule('finished')
  }
}
