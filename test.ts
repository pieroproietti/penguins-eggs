#!/usr/bin/npx ts-node

/**
 * run with: npx ts-node
 * #!/usr/bin/npx ts-node
 */

import { exec } from './src/lib/utils'
import Utils from './src/classes/utils'
import path from 'path'
import fs from 'fs'
import N8 from  './src/classes/n8'

console.clear()

// testuser('artisan')

// const filesInSkel: string [] = []
for (const elem of fs.readdirSync(`/etc/skel/`, {withFileTypes: true})) {
   if (elem.isDirectory()) {
      console.log(`dir: ${elem.name}`)
   } else {
      console.log(`file: ${elem.name}`)
   }
   
}
// [ '.bash_logout', '.bashrc', '.config', '.profile' ]



const files: string [] = []
for (const elem of fs.readdirSync(`/etc/skel/`)) {
    files.push(path.basename(elem))
}
//[ '.bash_logout', '.bashrc', '.config', '.profile' ]

console.log(files)

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
