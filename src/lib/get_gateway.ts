'use strict'
const inquirer = require('inquirer') 

export default async function getGateway(initial: string): Promise<string> {
  return new Promise(function (resolve) {
    const questions: Array<Record<string, any>> = [
      {
        type: 'input',
        name: 'gateway',
        message: 'What is gateway of this network? ',
        default: initial,
      },
    ]

    inquirer.prompt(questions).then(function (options: any) {
      resolve(options.gateway)
    })
  })
}
