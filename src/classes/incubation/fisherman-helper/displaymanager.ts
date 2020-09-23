/**
 *
 */

import Pacman from '../../pacman'

/**
 * restituisce displaymanagers in uso
 */
export function displaymanager(): string {
   let text = ''

   text += addIfExist('slim')
   text += addIfExist('sddm')
   text += addIfExist('lightdm')
   text += addIfExist('gdm')
   text += addIfExist('gdm3')
   text += addIfExist('mdm')
   text += addIfExist('lxdm')
   text += addIfExist('kdm')
   return text
}

/*
 * @param package2check
 */
function addIfExist(package2check: string): string {
   let text = ''

   if (Pacman.packageIsInstalled(package2check)) {
      if (text === '') {
         text += `- ${package2check}\n`
      } else {  //displaymanagers: '
         text += `                 - ${package2check}\n`
      }
   }
   return text
}
