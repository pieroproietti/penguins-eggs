/**
 * ./src/classes/incubation/fisherman-helper/displaymanager.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import Pacman from '../../pacman.js'

/**
 * restituisce displaymanagers in uso
 */
export function displaymanager(): string [] {
  let ret: string [] = []

  if (Pacman.packageIsInstalled('gdm')) {
    ret.push('gdm')
  }
  if (Pacman.packageIsInstalled('gdm3')) {
    // gdm3 viene trattato come gdm
    ret.push('gdm')
  }
  if (Pacman.packageIsInstalled('kdm')) {
    ret.push('kdm')
  }
  if (Pacman.packageIsInstalled('lightdm')) {
    ret.push('lightdm')
  }
  if (Pacman.packageIsInstalled('lxdm')) {
    ret.push('lxdm')
  }
  if (Pacman.packageIsInstalled('mdm')) {
    ret.push('mdm')
  }
  if (Pacman.packageIsInstalled('sddm')) {
    ret.push('sddm')
  }
  if (Pacman.packageIsInstalled('slim')) {
    ret.push('slim')
  }
  return ret
}

