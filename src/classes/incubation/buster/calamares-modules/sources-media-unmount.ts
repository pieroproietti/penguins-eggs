/**
 * 
 */
export function sourcesMediaUnmount(): string {
    let text = ``
    text += `---\n`
    text += `type:       "job"\n`
    text += `name:       "sources-media-unmount"\n`
    text += `interface:  "process"\n`
    text += `command:    "/usr/sbin/sources-media -u"\n`
    text += `timeout:    600\n`
    return text
}