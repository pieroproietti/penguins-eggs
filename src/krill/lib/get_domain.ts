/**
 * ./src/lib/get_domain.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

export default async function getDomain(initial = ''): Promise<string> {
  return new Promise((resolve) => {
    const questions: any = [
      {
        default: initial,
        message: 'What is domain of this network? ',
        name: 'domain',
        type: 'input'
      }
    ]

    inquirer.prompt(questions).then((options: any) => {
      resolve(options.domain)
    })
  })
}
