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
  let content = ''

  if (Pacman.packageIsInstalled(package2check)) {
    let displayManager = package2check
    if (package2check === 'gdm3') {
      // gdm3 is treat as gdm
      displayManager = 'gdm'
    }

    content = `- ${displayManager}\n`
    // text += text === '' ? `- ${displayManager}\n` : `                 - ${displayManager}\n`
  }

  return content
}
