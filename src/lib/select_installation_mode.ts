/**
 * penguins-eggs
 * lib: select_installation_mode.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
'use strict'
const inquirer = require('inquirer') 

export default async function selectInstallationMode(): Promise<string> {
  const modes = ['standard', 'full-encrypted', 'lvm2']

  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'installationMode',
      message: 'Select the installation mode: ',
      choices: modes,
    },
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options: any) {
      resolve(options.installationMode)
    })
  })
}
