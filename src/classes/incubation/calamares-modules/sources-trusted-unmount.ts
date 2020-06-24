/**
 *
 */
export function sourcesTrustedUnmount(): string {
   let text = ``
   text += `---\n`
   text += `type:       "job"\n`
   text += `name:       "sources-trusted-unmount"\n`
   text += `interface:  "process"\n`
   text += `command:    "/usr/sbin/sources-trusted -u"\n`
   text += `timeout:    600\n`
   return text
}
