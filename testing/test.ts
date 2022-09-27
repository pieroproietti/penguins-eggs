#!/usr/bin/pnpx ts-node

/**
 * run with: pnpx ts-node
 * #!/usr/bin/npx ts-node
 */

import Utils from '../src/classes/utils'
import shx from 'shelljs'
import { networkInterfaces } from 'os'
import fs from 'fs'
import ini from 'ini'

startPoint()



async function startPoint() {
   Utils.titles('test')

   const dirConf = '/etc/lightdm/'
   let confs = fs.readdirSync(dirConf)
   for (const conf of confs) {
      
      if (conf === 'lightdm.conf') {
         console.log('\nconf: ' + conf)
         let fc = dirConf + conf
         console.log(fs.readFileSync(fc, 'utf-8'))
         let config = ini.parse(fs.readFileSync(fc, 'utf-8'))
         console.log("autologin-user: " + config["Seat:*"]["autologin-user"])

      }
   }
}
