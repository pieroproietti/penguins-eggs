/**
 * 
 */
export function mount(): string {
    let text = ''
    text += `---/n`
    text += `type:       "job"/n`
    text += `name:       "sources-media"/n`
    text += `interface:  "process"/n`
    text += `command:    "/usr/sbin/sources-media"/n`
    text += `timeout:    600/n`
    return text
}
