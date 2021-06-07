/**
 * installer
 * 
 * name  = 'calamares' oppure 'krill'
 * configuration = '/etc/calamares/' oppure '/etc/penguins-eggs.d/krill/'
 * modules = configuration + 'modules/'
 * modulesMultiarch = '/usr/lib/' + arch-linux-gnu + '/' + installer + '/'
 * 
 * template = '/etc/penguins-eggs/' + .distro.versionLike + '/' + installer + '/'
 * templateModules = template + '/modules/'
 * templateMultiarch = template + installer + '-modules/'
 * 
*/
import { IInstaller, IRemix } from '../../interfaces/index'
import Distro from '../../classes/distro'
import Pacman from '../../classes/pacman'

export function installer(): IInstaller {
   let installer = {} as IInstaller
   if (Pacman.packageIsInstalled('calamares')) {
      installer.name = 'calamares'
      installer.configuration = '/etc/calamares/'
      installer.multiarch = '/usr/lib/' + multiarch() + '/calamares/'
   } else {
      installer.name = 'krill'
      installer.configuration = '/etc/penguins-eggs.d/krill/'
      installer.multiarch = '/usr/lib/' + multiarch() + '/penguins-eggs/'
   }
   installer.multiarchModules = installer.multiarch + 'modules/'
   installer.modules = installer.configuration + 'modules/'

   /**
    * i template nelle versioni calamaresAble sono QUELLI di calamares
    */
   const remix = {} as IRemix
   const distro = new Distro(remix)
   if (distro.calamaresAble) {
      installer.template = '/etc/penguins-eggs.d/distros/' + distro.versionLike + '/calamares/'
      installer.templateModules = installer.template + 'modules/'
      installer.templateMultiarch = installer.template + 'calamares-modules/'
   } else {
      installer.template = '/etc/penguins-eggs.d/distros/' + distro.versionLike + '/krill/'
      installer.templateModules = installer.template + 'modules/'
      installer.templateMultiarch = installer.template + 'krill-modules/'
   }

   // console.log(installer)
   return installer
}

/**
 * 
 * @returns 
 */
function multiarch(): string {
   let archLinuxGnu = 'i386-linux-gnu'

   if (process.arch === 'ia32') {
      archLinuxGnu = 'i386-linux-gnu'
   } else if (process.arch === 'x64') {
      archLinuxGnu = 'x86_64-linux-gnu'
   } else if (process.arch === 'arm64') {
      archLinuxGnu = 'arm64-linux-gnu'
   } else if (process.arch === 'armel') {
      archLinuxGnu = 'armel-linux-gnu'
   }

   return archLinuxGnu
}
