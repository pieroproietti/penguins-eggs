/**
 * installer
 *
 * name  = 'calamares' oppure 'krill'
 * configuration = '/etc/calamares/' oppure '/etc/penguins-eggs.d/krill/'
 * modules = configuration + 'modules/'
 * modulesMultiarch = '/usr/lib/' + arch-linux-gnu + '/' + installer + '/'
 *
 * template = '/etc/penguins-eggs/' + .distro.codenameLikeId + '/' + installer + '/'
 * templateModules = template + '/modules/'
 * templateMultiarch = template + installer + '-modules/'
 *
 */
import {IInstaller, IRemix} from '../../interfaces/index'
import Distro from '../../classes/distro'
import Pacman from '../../classes/pacman'

/**
 * 
 * @returns 
 */
export function installer(): IInstaller {
  const installer = {} as IInstaller
  if (Pacman.packageIsInstalled('calamares')) {
    installer.name = 'calamares'
    installer.configuration = '/etc/calamares/'
    installer.multiarch = multiarch() + 'calamares/'
  } else {
    installer.name = 'krill'
    installer.configuration = '/etc/penguins-eggs.d/krill/'
    installer.multiarch = multiarch() + 'penguins-eggs/'
  }

  installer.modules = installer.configuration + 'modules/'
  installer.multiarchModules = installer.multiarch + 'modules/'

  /**
   * i template nelle versioni isCalamaresAvailable sono QUELLI di calamares
   */
  const remix = {} as IRemix
  const distro = new Distro(remix)
  if (distro.isCalamaresAvailable) {
    installer.template = '/etc/penguins-eggs.d/distros/' + distro.codenameLikeId + '/calamares/'
    installer.templateModules = installer.template + 'modules/'
    installer.templateMultiarch = installer.template + 'calamares-modules/'
  } else {
    installer.template = '/etc/penguins-eggs.d/distros/' + distro.codenameLikeId + '/krill/'
    installer.templateModules = installer.template + 'modules/'
    installer.templateMultiarch = installer.template + 'krill-modules/'
  }

  return installer
}

/**
 *
 * @returns
 */
function multiarch(): string {
  return Pacman.distro().usrLibPath
}
