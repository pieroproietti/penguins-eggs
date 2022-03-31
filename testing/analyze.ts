#!/usr/bin/npx ts-node

/**
 * run with: npx ts-node
 * #!/usr/bin/npx ts-node
 */

import { exec } from '../src/lib/utils'
import Utils from '../src/classes/utils'
import fs from 'fs'
import yaml from 'js-yaml'

startPoint()



async function startPoint() {
   const installeds: string[] = []
   const oInstalleds = await exec('apt list --installed', {echo: false, ignore: false, capture: true})
   if (oInstalleds.code === 0) {
      const elements =oInstalleds.data.split(`\n`)
      console.log(elements)
      for (const elem of elements) {
         const pacchetto = elem.substring(0, elem.indexOf(`/`))
         console.log(pacchetto)
         await getSection(pacchetto)
      }
   } else {
      console.log('error')
   }
}

/**
 * 
 */
async function getSection(pacchetto: string) {
   const sh = `#!/bin/sh\napt-cache show ${pacchetto} | grep "Section: "\n`
   console.log(sh)
}
