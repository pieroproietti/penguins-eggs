/**
 * cfs: custom final steps
 */
import { ISettings } from '../interfaces/i-settings'
import fs from 'fs'
import yaml from 'js-yaml'

/**
 * cfs
 */
export default class CFS {

   /**
    * steps
    * @returns 
    */
   steps(): string[] {
      const ccm: string[] = []
      // const settingsVar: string = fs.readFileSync('/etc/calamares/settings.conf', 'utf8')
      const settingsVar: string = fs.readFileSync('/etc/calamares/cfs.conf', 'utf8')
      const settingsYaml = yaml.load(settingsVar) as ISettings
      const execSequence = settingsYaml.sequence[1]
      const steps = execSequence.exec
      for (const step of steps) {
         if (step.includes('ccm-')) {
            ccm.push(step)
         }
      }
      return ccm
   }
}
