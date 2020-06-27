/**
 *
 */
export function sourcesFinal(): string {
   let text = ``
   text += `---\n`
   text += `type:       "job"\n`
   text += `name:       "sources-final"\n`
   text += `interface:  "process"\n`
   text += `command:    "/usr/sbin/sources-final"\n`
   text += `timeout:    600\n`
   return text
}
