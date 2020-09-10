/**
 *
 */
export function createTmp(): string {
   let text = ``

   text += `---\n`
   text += `type:       "job"\n`
   text += `name:       "create-tmp"\n`
   text += `interface:  "process"\n`
   text += `command:    "/usr/sbin/create-tmp"\n`
   text += `timeout:    600\n`
   return text
}
