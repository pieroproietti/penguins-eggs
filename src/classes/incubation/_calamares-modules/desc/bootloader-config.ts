/**
 *
 */
export function bootloaderConfig(): string {
   let text = ``

   text += `---\n`
   text += `type:       "job"\n`
   text += `name:       "bootloader-config"\n`
   text += `interface:  "process"\n`
   text += `command:    "/usr/sbin/bootloader-config"\n`
   text += `timeout:    600\n`
   return text
}
