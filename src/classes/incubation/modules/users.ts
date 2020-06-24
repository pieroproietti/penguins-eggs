/**
 *
 */
export function users(): string {
   let text = ``
   text += `---\n`
   text += `userGroup:       users\n`
   text += `defaultGroups:\n`
   text += `    - cdrom\n`
   text += `    - floppy\n`
   text += `    - sudo\n`
   text += `    - audio\n`
   text += `    - dip\n`
   text += `    - video\n`
   text += `    - plugdev\n`
   text += `    - netdev\n`
   text += `    - lpadmin\n`
   text += `    - scanner\n`
   text += `    - bluetooth\n`
   text += `autologinGroup:  autologin\n`
   text += `sudoersGroup:    sudo\n`
   text += `setRootPassword: false\n`
   return text
}
