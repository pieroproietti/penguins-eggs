'use strict'
const inquirer = require('inquirer') 


export default async function getHostname(initial: string): Promise<string> {
  return new Promise(function (resolve) {
    const questions: Array<Record<string, any>> = [
      {
        type: 'input',
        name: 'hostname',
        message: 'Choose a name for this computer? ',
        default: initial,
      },
    ]

    inquirer.prompt(questions).then(function (options: any) {
      resolve(options.hostname)
    })
  })
}
