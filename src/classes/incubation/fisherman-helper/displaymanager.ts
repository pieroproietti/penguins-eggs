/**
 * displaymanagers
 */
import Pacman from '../../pacman'

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
      let displayManager = package2check
      if (package2check==='gdm3') {
         displayManager = 'gdm'
      }
      if (text === '') {
         text += `- ${displayManager}\n`
      } else {
         text += `                 - ${displayManager}\n`
      }
   }
   return text
}
