/**
 * ./src/lib/get_password.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

export default async function getPassword(user = 'root', initial: string): Promise<string> {
  const requireLetterAndNumber = (value: string) => {
    if (/\w/.test(value) && /\d/.test(value)) {
      return true
    }
  }

  return new Promise((resolve) => {
    const questions: any = [
      {
        default: initial,
        message: `Choose a password for ${user}: `,
        name: 'password',
        type: 'password'
        // validate: requireLetterAndNumber,
      },
      {
        default: initial,
        message: `Confirm your ${user} password: `,
        name: 'confirmPassword',
        type: 'password'
        // validate: requireLetterAndNumber,
      }
    ]

    inquirer.prompt(questions).then((options: any) => {
      resolve(options.password)
    })
  })
}
