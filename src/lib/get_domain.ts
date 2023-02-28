'use strict'
import inquirer  from 'inquirer'

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

    inquirer.prompt(questions).then(function (options) {
      resolve(options.domain)
    })
  })
}
