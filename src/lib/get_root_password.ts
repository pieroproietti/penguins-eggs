'use strict'
const inquirer = require('inquirer') 


export default async function geRootPassword(initial: string): Promise<string> {
  const requireLetterAndNumber = (value: string) => {
    if (/\w/.test(value) && /\d/.test(value)) {
      return true
    }
  }

  return new Promise(function (resolve) {
    const questions: Array<Record<string, any>> = [
      {
        type: 'password',
        message: 'Repeat password: ',
        name: 'password',
        default: initial,
        // validate: requireLetterAndNumber,
      },
      {
        type: 'password',
        message: 'Choose a password to keep your account safe: ',
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
