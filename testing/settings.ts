#!/usr/bin/pnpx ts-node
/**
 * run with: pnpx ts-node
 * #!/usr/bin/pnpx ts-node
 */

import {ISettings} from '../src/interfaces/i-settings'
import Utils from '../src/classes/utils'
import fs from 'fs'
import yaml from 'js-yaml'

Utils.titles('settings')



main()

async function main() {
  const settingsVar: string = fs.readFileSync('/etc/calamares/settings.conf', 'utf8')
  const settingsYaml = yaml.load(settingsVar) as ISettings

  // console.log()
  // console.log(settingsYaml.sequence)

  console.log()

  const execSequence = settingsYaml.sequence[1]
  console.log(execSequence.exec)
  const steps = execSequence.exec
  for (const step of steps){
    if (step.includes('bliss-')) {
      console.log(`- ${step}`)
    }
  }

  // console.log()
  // console.log(settingsYaml.sequence[2])
}
