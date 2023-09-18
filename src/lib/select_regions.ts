/**
 * penguins-eggs
 * lib: select_regiones.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
'use strict'
const inquirer = require('inquirer') 

export default async function selectRegions(selected = ''): Promise<string> {
  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'region',
      message: 'Select your region: ',
      choices: ['Atlantic', 'Africa', 'America', 'Antarctica', 'Artic', 'Australia', 'Europe', 'India', 'Europe', 'Pacific'],
      default: selected,
    },
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options: any) {
      resolve(options.region)
    })
  })
}
