'use strict'
const inquirer = require('inquirer') 


export default async function getUserfullname(initial: string): Promise<string> {
  return new Promise(function (resolve) {
    const questions: Array<Record<string, any>> = [
      {
        type: 'input',
        name: 'fullname',
        message: 'What name do you want to use? ',
        default: initial,
      },
    ]

    inquirer.prompt(questions).then(function (options: any) {
      resolve(options.fullname)
    })
  })
}
