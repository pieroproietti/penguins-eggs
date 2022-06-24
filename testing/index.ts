#!/usr/bin/pnpx ts-node

/**
 * run with: npx ts-node
 * #!/usr/bin/pnpx ts-node
 */

import { exec } from '../src/lib/utils'
import Utils from '../src/classes/utils'
import fs, { unwatchFile } from 'fs'
import axios from 'axios'
import shx from 'shelljs'
import { restoreDefaultPrompts } from 'inquirer'

console.clear()
main()
process.exit()

async function main() {

   Utils.titles('test')

   const url = `https://geoip.kde.org/v1/calamares`
   let prefereInternet = true
   let response = 'vuota'
   console.log(response)
   try {
     response = await axios.get(url)
   } catch (error) {
     console.error(error);
     prefereInternet = false
   }
   console.log(response)

   process.exit()
   let timezone: string = fs.readFileSync('/etc/timezone', 'utf8')
   let region = shx.exec('cut -f1 -d/ < /etc/timezone', { silent: true }).stdout.trim()
   let zone = shx.exec('cut -f2 -d/ < /etc/timezone', { silent: true }).stdout.trim()
   if (prefereInternet) {
     timezone = JSON.parse(response)
     region = timezone.substring(0,timezone.indexOf('/'))
     zone = timezone.substring(timezone.indexOf('/'))
     console.log(region)
     console.log(zone)
     
   }
    
}



