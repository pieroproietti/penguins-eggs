/**
 * penguins-eggs
 * lib: get_domain.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
'use strict'
const inquirer = require('inquirer') 

export default async function getDomain(initial: string): Promise<string> {
  return new Promise(function (resolve) {
    const questions: Array<Record<string, any>> = [
      {
        type: 'input',
        name: 'domain',
        message: 'What is domain of this network? ',
        default: initial,
      },
    ]

    inquirer.prompt(questions).then(function (options: any) {
      resolve(options.domain)
    })
  })
}
