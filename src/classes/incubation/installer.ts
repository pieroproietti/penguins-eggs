/**
 * ./src/classes/incubation/installer.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
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
 * template = '/etc/penguins-eggs/' + .distro.codenameLikeId + '/' + installer + '/'
 * templateModules = template + '/modules/'
 * templateMultiarch = template + installer + '-modules/'
 *
 */
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
    installer.configRoot = '/etc/calamares/'
    installer.multiarch = Pacman.distro().usrLibPath + '/calamares/'
  } else {
    installer.name = 'krill'
    installer.configRoot = '/etc/penguins-eggs.d/krill/'
    installer.multiarch = Pacman.distro().usrLibPath + '/krill/'
  }
  installer.modules = installer.configRoot + 'modules/'
  installer.multiarchModules = installer.multiarch + 'modules/'

  /**
   * i template calamares/krill sono gli stessi
   */
  const distro = new Distro()
  installer.template = `/etc/penguins-eggs.d/distros/${distro.codenameLikeId}/calamares/`
  installer.templateModules = `${installer.template}modules/`
  installer.templateMultiarch = `${installer.template}${installer.name}-modules/`

  return installer
}
