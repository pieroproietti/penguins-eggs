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
    text += addIfExist('live-boot')
    text += addIfExist('live-boot-doc')
    text += addIfExist('live-config')
    text += addIfExist('live-config-doc')
    text += addIfExist('live-config-systemd')
    text += addIfExist('live-tools')
    text += addIfExist('task-localisation')
    text += addIfExist('live-task-recommended')
    text += addIfExist('calamares')
    text += '\n'
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
