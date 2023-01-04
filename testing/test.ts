#!/usr/bin/pnpx ts-node

/**
 * run with: pnpx ts-node
 * #!/usr/bin/npx ts-node
 */

import Utils from '../src/classes/utils'
import yaml from 'js-yaml'
import fs from 'fs'

startPoint()

interface IDerivative {
   id: string,
   distro: string,
   derivatives: string []
}




async function startPoint() {
   Utils.titles('test')

   const file = 'conf/distros.yaml'
   const content = fs.readFileSync(file, 'utf8')
   let distros =  yaml.load(content) as IDerivative

   console.log(distros)


}
