'use strict'
const inquirer = require('inquirer') 


export default async function getUsername(initial: string): Promise<string> {
  return new Promise(function (resolve) {
    const questions: Array<Record<string, any>> = [
      {
        type: 'input',
        name: 'name',
        message: 'What is your name? ',
        default: initial,
      },
    ]

    inquirer.prompt(questions).then(function (options: any) {
      resolve(options.name)
    })
  })
}
