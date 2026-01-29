/**
 * ./src/lib/get_username.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

export default async function getUsername(initial: string): Promise<string> {
  return new Promise((resolve) => {
    const questions: any = [
      {
        default: initial,
        message: 'What name you want to use to log in? ',
        name: 'username',
        type: 'input'
      }
    ]

    inquirer.prompt(questions).then((options: any) => {
      resolve(options.username)
    })
  })
}
