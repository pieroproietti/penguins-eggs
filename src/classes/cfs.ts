/**
 * cfs: custom final steps
 */
import { ISettings } from '../interfaces/i-settings'
import fs from 'fs'
import yaml from 'js-yaml'
import Pacman from './pacman'

/**
 * cfs
 */
export default class CFS {

   /**
    * steps
    * @returns 
    */
   async steps(): Promise<string[]> {
      const cfs: string[] = []
      let configRoot = '/etc/penguins-eggs.d/krill/'
      if (fs.existsSync('/etc/calamares/settings.conf')) {
         configRoot = '/etc/calamares/'
      }

      const settingsVar: string = fs.readFileSync(`${configRoot}settings.conf`, 'utf8')
      const settingsYaml = yaml.load(settingsVar) as ISettings
      const execSequence = settingsYaml.sequence[1]
      const steps = execSequence.exec
      for (const step of steps) {
         if (step.includes('cfs-')) {
            cfs.push(step)
         }
      }
      return cfs
   }
}
