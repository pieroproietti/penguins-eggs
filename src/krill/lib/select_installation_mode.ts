/**
 * ./src/lib/select_installation_mode.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'
import { InstallationMode } from '../classes/krill_enums.js'

export default async function selectInstallationMode(): Promise<InstallationMode> {
  const modes = Object.values(InstallationMode)

  const questions: Array<Record<string, any>> = [
    {
      choices: modes,
      message: 'Select the installation mode: ',
      name: 'installationMode',
      type: 'list'
    }
  ]

  return new Promise((resolve) => {
    inquirer.prompt(questions).then((options: any) => {
      resolve(options.installationMode)
    })
  })
}
