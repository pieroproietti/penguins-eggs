'use strict'
// import { option } from '@oclif/command/lib/flags'
const inquirer = require('inquirer') 


export default async function getPassword(initial: string): Promise<string> {
  const requireLetterAndNumber = (value: string) => {
    if (/\w/.test(value) && /\d/.test(value)) {
      return true
    }
  }

  return new Promise(function (resolve) {
    const questions: Array<Record<string, any>> = [
      {
        type: 'password',
        message: 'Choose a password to keep your account safe: ',
        name: 'password',
        default: initial,
        // validate: requireLetterAndNumber,
      },
      {
        type: 'password',
        message: 'Confirm your password: ',
        name: 'confirmPassword',
        default: initial,
        // validate: requireLetterAndNumber,
      },
    ]

    inquirer.prompt(questions).then(function (options: any) {
      resolve(options.password)
    })
  })
}
