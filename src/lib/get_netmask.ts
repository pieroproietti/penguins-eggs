/**
 * penguins-eggs
 * lib: get_netmask.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
'use strict'
const inquirer = require('inquirer') 


export default async function getNetmask(initial: string): Promise<string> {
  return new Promise(function (resolve) {
    const questions: Array<Record<string, any>> = [
      {
        type: 'input',
        name: 'netmask',
        message: 'What is netmask of this computer? ',
        default: initial,
      },
    ]

    inquirer.prompt(questions).then(function (options: any) {
      resolve(options.netmask)
    })
  })
}
