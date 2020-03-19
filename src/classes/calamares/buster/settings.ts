/* eslint-disable no-console */
/**
 * penguins-eggs: buster/settings.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import yaml = require('js-yaml')

/**
 * 
 * @param displaymanager 
 * @param branding 
 */
export function settings(displaymanager = false, sourcesMedia = false, sourcesTrusted = true, branding = 'eggs'): string {
  // path di ricerca dei moduli
  const modulesSearch: string [] = []
  modulesSearch.push('local')
  modulesSearch.push('/usr/lib/calamares/modules')

  // moduli da mostrare a video
  let show: string[] = []
  show.push('welcome')
  show.push('locale')
  show.push('keyboard')
  show.push('partition')
  show.push('users')
  show.push('summary')

  // moduli da eseguire
  let exec: string [] = []
  exec.push('partition')
  exec.push('mount')
  exec.push('unpackfs')
  if (sourcesMedia){
    exec.push('sources-media')
  }
  if (sourcesTrusted){
    exec.push('sources-trusted')
  }
  exec.push('machineid')
  exec.push('fstab')
  exec.push('locale')
  exec.push('keyboard')
  exec.push('localecfg')
  exec.push('users')
  if (displaymanager){
    exec.push('displaymanager')
  }
  exec.push('networkcfg')
  exec.push('hwclock')
  exec.push('services-systemd')
  exec.push('create-tmp')
  exec.push('bootloader-config')
  exec.push('grubcfg')
  exec.push('bootloader')
  /**
  * tolta la rimozione dei pacchetti da sistemare
  */
  //exec.push('packages')
  exec.push('luksbootkeyfile')
  exec.push('plymouthcfg')
  exec.push('initramfscfg')
  exec.push('initramfs')
  exec.push('removeuser')
  if (sourcesMedia) {
    exec.push('sources-media-unmount')
    exec.push('sources-final')
  }
  if (sourcesTrusted) {
    exec.push('sources-trusted-unmount')
    exec.push('sources-final')
  }
  exec.push('umount')
  
  const settings = {
    'modules-search': modulesSearch,
    'sequence': [
      {'show': show},
      {'exec': exec},
      {'show': ['finished'] },
    ],
    'branding': branding,
    'prompt-install': false,
    'dont-chroot': false,
    }
        
  return yaml.safeDump(settings)
}