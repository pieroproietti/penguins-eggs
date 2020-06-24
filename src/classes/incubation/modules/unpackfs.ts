/**
 *
 */
export function unpackfs(mountpointSquashFs: string): string {
   let text = ``
   text += `---\n`
   text += `unpack:\n`
   text += `    -   source: "${mountpointSquashFs}"\n`
   text += `        sourcefs: "squashfs"\n`
   text += `        destination: ""\n`
   return text
}
