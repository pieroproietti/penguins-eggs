/**
 * ./src/classes/incubation/installer.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

/**
 * installer
 *
 * name  = 'calamares' oppure 'krill'
 * configRoot = '/etc/calamares/' oppure '/etc/penguins-eggs.d/krill/'
 * modules = configuration + 'modules/'
 * modulesMultiarch = '/usr/lib/' + arch-linux-gnu + '/' + installer + '/'
 *
 * template = '/etc/penguins-eggs/' + .distro.distroUniqueId + '/' + installer + '/'
 * templateModules = template + '/modules/'
 * templateMultiarch = template + installer + '-modules/'
 *
 */
import path from 'node:path'
import Distro from '../../classes/distro.js'
import Pacman from '../../classes/pacman.js'
import { IInstaller, IRemix } from '../../interfaces/index.js'

/**
 *
 * @returns
 */
export function installer(): IInstaller {
  const installer = {} as IInstaller

  // configRoot
  installer.configRoot = ''
  if (Pacman.calamaresExists()) {
    installer.name = 'calamares'
    installer.configRoot = '/etc/calamares'
    installer.multiarch = path.join(Pacman.distro().usrLibPath, 'calamares')
  } else {
    installer.name = 'krill'
    installer.configRoot = '/etc/penguins-eggs.d/krill'
    installer.multiarch = path.join(Pacman.distro().usrLibPath, 'krill')
  }

  installer.modules = path.join(installer.configRoot, 'modules')
  installer.multiarchModules = path.join(installer.multiarch, 'modules')

  /**
   * i template calamares/krill sono SEMPRE nel folder calamares e calamares-modules
   *
   */
  const distro = new Distro()
  installer.template = path.join('/etc/penguins-eggs.d/distros', distro.distroUniqueId, 'calamares')
  installer.templateModules = path.join(installer.template, 'modules')
  installer.templateMultiarch = path.join(installer.template, 'calamares-modules')

  return installer
}
