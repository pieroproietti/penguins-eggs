/**
 * ./src/classes/incubation/distros/buster.ts
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

/**
 *
 */
export class Trixie {
  distro: IDistro
installer = {} as IInstaller
isClone: boolean
release = false
remix: IRemix
theme: string
user_opt: string // theme comprende il path
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
    await fisherman.buildCalamaresModule('dpkg-unsafe-io', true)
    await fisherman.buildCalamaresModule('sources-yolk', true)
    await fisherman.buildModule('machineid')
    await fisherman.buildModule('fstab')
    await fisherman.buildModule('locale', this.theme)
    await fisherman.buildModule('keyboard')
    await fisherman.buildModule('localecfg')
    await fisherman.buildModule('users', this.theme)
    await fisherman.buildModule('displaymanager')
    await fisherman.buildModule('networkcfg')
    await fisherman.buildModule('hwclock')
    await fisherman.buildModule('services-systemd')
    await fisherman.buildModule('luksbootkeyfile')
    await fisherman.shellprocess('boot_deploy') // contiene this.liveMediumPath
    await fisherman.buildCalamaresModule('bootloader-config', true)
    await fisherman.buildModule('grubcfg')
    await fisherman.buildModule('bootloader')
    await fisherman.shellprocess('boot_reconfigure')
    await fisherman.buildModule('initramfscfg')
    await fisherman.shellprocess('mkinitramfs')
    await fisherman.buildModule('plymouthcfg')
    await fisherman.buildModulePackages(this.distro, this.release)
    await fisherman.buildCalamaresModule('dpkg-unsafe-io-undo', false)
    await fisherman.buildModuleRemoveuser(this.user_opt)
    await fisherman.buildCalamaresModule('sources-yolk-undo', false)
    await fisherman.buildCalamaresModule('cleanup', true)
    
    // await fisherman.buildModule('initramfs')
    
    // libexec recreate
    await exec (`rm -rf /usr/libexec/calamares`)
    await exec (`mkdir -p /usr/libexec/calamares`)
    const scriptSrc=path.resolve(__dirname, '../../../../conf/distros/noble/calamares/libexec/')
    await exec (`cp ${scriptSrc}/*.sh /usr/libexec/calamares/`)


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
