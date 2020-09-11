/**
 *
 */

import Utils from '../../../utils'
import Pacman from '../../../pacman'

/**
 *
 */
export function packages(): string {
   let text = ``
   text += `backend: apt\n\n`
   text += `operations:\n`
   text += ` - remove:\n`
   text += removeEggs()
   text += '\n'
   return text
}

function removeEggs(): string {
   const packages = Pacman.packages()
   let text = ''
   for (const i in packages) {
      text += addIfExist(packages[i])
   }
   return text
}

/*
 * @param package2check
 */
function addIfExist(package2check: string): string {
   let text = ''
   
   if (Pacman.packageIsInstalled(package2check)) {
      text += `   - '${package2check}'\n`
   }
   return text
}
