#!/usr/bin/npx ts-node

/**
 * run with: npx ts-node
 * #!/usr/bin/npx ts-node
 */

import { exec } from './src/lib/utils'
import Utils from './src/classes/utils'

console.clear()

testuser('artisan')

async function testuser (user = '') {
   let cmd = `#!/bin/sh\ngetent passwd "${user}"  > /dev/null`
   let userExists = false
   try {
      await exec(cmd, Utils.setEcho(false))
      userExists = true
   } catch (error) {
      //console.log(error)
   } finally {
      if (userExists) {
         console.log('user: ' + user + ' exists!')
      } else {
         console.log('user: ' + user + ', NOT exists!')
      }
   }

}
