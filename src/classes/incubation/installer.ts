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
import {IInstaller, IRemix} from '../../interfaces/index'
import Distro from '../../classes/distro'

export function installer (name= 'krill') : IInstaller {
   let installer =  {} as IInstaller
   installer.name = name
   if (installer.name === 'calamares') {
      installer.configuration = '/etc/calamares/'
   } else {
      installer.configuration = '/etc/penguins-eggs.d/krill/'
   }
   installer.modules = installer.configuration + 'modules/'
   installer.multiarch = '/usr/lib/' + multiarch() + '/' + installer.name + '/'
   installer.multiarchModules = installer.multiarch + 'modules/'

   if (versionLike()==='jessie' || versionLike()==='stretch') {
      installer.template = '/etc/penguins-eggs.d/distros/' + versionLike() + '/krill/'
   } else {
      installer.template = '/etc/penguins-eggs.d/distros/' + versionLike() + '/' + installer.name + '/'
   }
   installer.templateModules = installer.template + 'modules/'
   installer.templateMultiarch = installer.template + installer.name + '-modules/'

   return installer
}


function versionLike() :string {
   const remix = {} as IRemix
   const distro = new Distro(remix)
   return distro.versionLike
}


function multiarch(): string {
   let archLinuxGnu= ''

   if (process.arch === 'x32') {
      archLinuxGnu = 'i386-linux-gnu'
   } else if (process.arch === 'x64') {
      archLinuxGnu = 'x86_64-linux-gnu'
   } else if (process.arch === 'armel') {
      archLinuxGnu = 'armel-linux-gnu'
   }

   return archLinuxGnu
}
