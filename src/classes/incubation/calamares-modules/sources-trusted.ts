/**
 *
 */
export function sourcesTrusted(): string {
   let text = ``
   text += `---\n`
   text += `type:       "job"\n`
   text += `name:       "sources-trusted"\n`
   text += `interface:  "process"\n`
   text += `command:    "/usr/sbin/sources-trusted"\n`
   text += `timeout:    600\n`
   return text
}
