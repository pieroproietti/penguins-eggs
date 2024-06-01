/**
 * ./src/lib/get_username.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

export default async function getUsername(initial: string): Promise<string> {
  return new Promise((resolve) => {
    const questions: Array<Record<string, any>> = [
      {
        default: initial,
        message: 'What is your name? ',
        name: 'name',
        type: 'input',
      },
    ]

    inquirer.prompt(questions).then((options: any) => {
      resolve(options.name)
    })
  })
}
