/**
 * ./src/classes/incubation/distros/focal.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import path from 'path'

import { IDistro, IInstaller, IRemix } from '../../../interfaces/index.js'
import CFS from '../../../krill/classes/cfs.js'
// libraries
import { exec } from '../../../lib/utils.js'
import Fisherman from '../fisherman.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

interface IReplaces {
  replace: string
  search: string
}

/**
 *
 */
export class Noble {
  distro: IDistro
installer = {} as IInstaller
isClone: boolean
release = false
remix: IRemix
theme: string // theme comprende il path
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
    await fisherman.buildCalamaresModule('sources-yolk', true)
    await fisherman.buildModule('machineid')
    await fisherman.buildModule('fstab')
    await fisherman.buildModule('locale', this.theme)
    await fisherman.buildModule('keyboard')
    await fisherman.buildModule('localecfg')
    await fisherman.buildModule('luksbootkeyfile')
    await fisherman.buildModule('users', this.theme)
    await fisherman.buildModule('displaymanager')
    await fisherman.buildModule('networkcfg')
    await fisherman.buildModule('hwclock')
    await fisherman.buildModule('initramfs')
    await fisherman.buildModule('grubcfg')
    await fisherman.buildModule('bootloader')
    await fisherman.buildModulePackages(this.distro, this.release) //
    await fisherman.buildModuleRemoveuser(this.user_opt)
    await fisherman.buildCalamaresModule('sources-yolk', false)
    await fisherman.buildCalamaresModule('sources-yolk-undo', false)
    await fisherman.buildCalamaresModule('cleanup', true)

    // contextualprocess
    await fisherman.contextualprocess('before_bootloader_context')
    await fisherman.contextualprocess('after_bootloader_context')

    // shellprocess
    // const spSrc = path.resolve(__dirname, this.installer.templateModules + 'shellprocess@' + name + '.yml')
    await fisherman.shellprocess('mkinitramfs')
    await fisherman.shellprocess('aptsources')
    await fisherman.shellprocess('boot_deploy')
    await fisherman.shellprocess('boot_reconfigure')
    await fisherman.shellprocess('install_translations')
    await fisherman.shellprocess('logs')
    await fisherman.shellprocess('nomodeset')

    // libexec recreate
    await exec (`rm -rf /usr/libexec/calamares`)
    await exec (`mkdir -p /usr/libexec/calamares`)
    // const scriptSrc=path.resolve(__dirname, '../../../../conf/distros/noble/calamares/libexec/')
    // await exec (`cp ${scriptSrc}/*.sh /usr/libexec/calamares/`)
    await fisherman.helper('calamares-aptsources')
    await fisherman.helper('calamares-l10n-helper')
    await fisherman.helper('calamares-logs-helper') // Sostituzione __LIVE_MEDIUM_PATH__
    await fisherman.helper('calamares-nomodeset')


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
    await fisherman.buildModule('finished')
  }
}
