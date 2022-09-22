#!/usr/bin/pnpx ts-node

/**
 * run with: pnpx ts-node
 * #!/usr/bin/npx ts-node
 */

import Utils from '../src/classes/utils'
import shx from 'shelljs'
import { networkInterfaces } from 'os'

startPoint()



async function startPoint() {
   Utils.titles('test')
   const fl = shx.exec(`tr -dc a-z </dev/urandom | head -c 1 ; echo ''`, { silent: true }).trim()
   const sl = shx.exec(`tr -dc q-z </dev/urandom | head -c 2 ; echo ''`, { silent: true }).trim()
   const fn = shx.exec(`tr -dc 0-9 </dev/urandom | head -c 2 ; echo ''`, { silent: true }).trim()
   const sn = shx.exec(`tr -dc 0-9 </dev/urandom | head -c 2 ; echo ''`, { silent: true }).trim()
   console.log(`${fl}${fn}${sl}${sn}`)

   let now = new Date().toISOString()
   console.log(now)
   now = now.substring(0, 19)
   now = now.replace('-', 'm')
   now = now.replace('-', 'd')
   now = now.replace('T', 'h')
   now = now.replace(':', 'm')
   now = now.replace(':', 's')

   console.log(now)

   const interfaces = networkInterfaces()
   if (interfaces !== undefined) {
      for (const devName in interfaces) {
         console.log(devName)
         console.log(`----------------------------`)
         const iface = interfaces[devName]
         if (iface !== undefined) {
            for (const alias of iface) {
               if (
                  alias.family === 'IPv4' &&
                  alias.address !== '127.0.0.1' &&
                  !alias.internal
               ) {
                  console.log(alias.address)
               }
            }
         }
      }
   }
}
