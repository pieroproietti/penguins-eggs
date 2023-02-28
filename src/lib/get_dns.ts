'use strict'
import inquirer from 'inquirer'

export default async function getDns(initial: string): Promise<string> {
  return new Promise(function (resolve) {
    const questions: Array<Record<string, any>> = [
      {
        type: 'input',
        name: 'dns',
        message: 'use ; to separe: ',
        default: initial,
      },
    ]

    inquirer.prompt(questions).then(function (options) {
      resolve(options.dns)
    })
  })
}
