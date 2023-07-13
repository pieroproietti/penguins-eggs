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
import { IInstaller, IRemix } from '../../interfaces/index'
import Distro from '../../classes/distro'
import Pacman from '../../classes/pacman'
import fs from 'fs'
import shell from 'shelljs'
/**
 * 
 * @returns 
 */
export function installer(): IInstaller {
  const installer = {} as IInstaller

  // configRoot

  installer.configRoot = ''
  if (Pacman.calamaresExists()) {
    // console.log('calamares presente')    
    installer.name = 'calamares'
    installer.configRoot = '/etc/calamares/'
    installer.multiarch = multiarch() + 'calamares/'
  } else {
    // console.log('calamares ASSENTE')    
    installer.name = 'krill'
    installer.configRoot = '/etc/penguins-eggs.d/krill/'
    /**
     * renamed: was penguins-eggs
     */
    installer.multiarch = multiarch() + 'krill/' 
  }

  installer.modules = installer.configRoot + 'modules/'
  installer.multiarchModules = installer.multiarch + 'modules/'

  /**
   * i template nelle versioni isCalamaresAvailable sono QUELLI di calamares
   */
  const remix = {} as IRemix
  const distro = new Distro(remix)
  if (distro.isCalamaresAvailable) {
    installer.template = '/etc/penguins-eggs.d/distros/' + distro.codenameLikeId + '/calamares/'
    if (distro.distroId === 'ManjaroLinux') {
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

/**
 *
 * @returns
 */
function multiarch(): string {
  return Pacman.distro().usrLibPath
}
