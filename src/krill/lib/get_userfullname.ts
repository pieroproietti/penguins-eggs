/**
 * ./src/lib/get_userfullname.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

export default async function getUserfullname(initial: string): Promise<string> {
  return new Promise((resolve) => {
    const questions: any = [
      {
        default: initial,
        message: 'What is your name? ',
        name: 'fullname',
        type: 'input'
      }
    ]

    inquirer.prompt(questions).then((options: any) => {
      resolve(options.fullname)
    })
  })
}
