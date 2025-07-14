/**
 * ./src/classes/families/cfs.ts (custom final steps)
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import yaml from 'js-yaml'
import fs from 'node:fs'

import { ISettings } from '../../interfaces/i-settings.js'
import Pacman from '../../classes/pacman.js'

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
    if (Pacman.calamaresExists()) {
      configRoot = '/etc/calamares/'
    }

    // solo se esiste settings.conf  CALAMARES
    if (fs.existsSync(`${configRoot}settings.conf`)) {
      const settingsVar: string = fs.readFileSync(`${configRoot}settings.conf`, 'utf8')
      const settingsYaml = yaml.load(settingsVar) as ISettings
      const execSequence = settingsYaml.sequence[1]
      const steps = execSequence.exec
      for (const step of steps) {
        if (step.includes('cfs-')) {
          cfs.push(step)
        }
      }
    }

    return cfs
  }
}
