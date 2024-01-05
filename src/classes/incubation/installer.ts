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
import { IInstaller, IRemix } from '../../interfaces/index'
import Distro from '../../classes/distro'
import Pacman from '../../classes/pacman'

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
   * se distro.isCalamaresAvailable()
   * i template di calamares e krill sono gli stessi
   */
  const remix = {} as IRemix
  const distro = new Distro(remix)
  if (distro.isCalamaresAvailable) {
    installer.template = '/etc/penguins-eggs.d/distros/' + distro.codenameLikeId + '/calamares/'
    if (distro.distroId === 'ManjaroLinux') {
      // We must to check this line... 
      installer.template = '/etc/penguins-eggs.d/distros/' + distro.codenameLikeId + '/calamares-32/'      
    }
    installer.templateModules = installer.template + 'modules/'
    installer.templateMultiarch = installer.template + 'calamares-modules/'
  } else {
    installer.template = '/etc/penguins-eggs.d/distros/' + distro.codenameLikeId + '/krill/'
    installer.templateModules = installer.template + 'modules/'
    installer.templateMultiarch = installer.template + 'krill-modules/'
  }

  return installer
}
