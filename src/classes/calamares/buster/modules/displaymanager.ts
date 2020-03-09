/**
 * 
 */

import Utils from '../../../utils'

export function displaymanager(mountpointSquashFs: string): string {

let text = ''

text += 'displaymanagers:\n'
text += addIfExist('slim')
text += addIfExist('sddm')
text += addIfExist('lightdm')
text += addIfExist('gdm')
text += addIfExist('mdm')
text += addIfExist('lxdm')
text += addIfExist('kdm')
text += 'basicSetup: false\n'
text += 'sysconfigSetup: false'
return text
}

/* 
* @param package2check
*/
function addIfExist(package2check: string): string {
    let text = ''
    
    if (Utils.packageIsInstalled(package2check)) {
        text += `   - '${package2check}'\n`
    }
    return text
}
