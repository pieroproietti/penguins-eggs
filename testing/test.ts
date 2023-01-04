#!/usr/bin/pnpx ts-node

/**
 * run with: pnpx ts-node
 * #!/usr/bin/npx ts-node
 */

import Utils from '../src/classes/utils'
import yaml from 'js-yaml'
import fs from 'fs'

startPoint()

interface IDistros {
   id: string,
   distro: string,
   derivatives: string[]
}

async function startPoint() {
   Utils.titles('test')

   const file = 'conf/distros.yaml'
   const content = fs.readFileSync(file, 'utf8')
   let distros = yaml.load(content) as IDistros[]

   // console.log(distros)
   let codename = 'jolnir'
   for (let i = 0; i < distros.length; i++) {
      for (let n = 0; n < distros[i].derivatives.length; n++) {
         if (codename === distros[i].derivatives[n]) {
            console.log(distros[i].distro + '/'+ distros[i].id) 
         }
      }
   }
}
