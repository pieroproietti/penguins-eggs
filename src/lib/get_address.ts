'use strict'
import inquirer  from 'inquirer'

export default async function getAddress(initial: string): Promise<string> {
  return new Promise(function (resolve) {
    const questions: Array<Record<string, any>> = [
      {
        type: 'input',
        name: 'address',
        message: 'What is ip address of this computer? ',
        default: initial,
      },
    ]

    inquirer.prompt(questions).then(function (options) {
      resolve(options.address)
    })
  })
}
