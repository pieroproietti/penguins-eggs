/**
* 
*/

import Utils from '../../../utils'

export function removeuser(): string {
    let text = ''
    text += '---\n'
    text += `username: ${Utils.getPrimaryUser()}\n`
    return text
}

