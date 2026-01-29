/**
 * ./src/lib/get_dns.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

export default async function getDns(initial: string): Promise<string> {
  return new Promise((resolve) => {
    const questions: any = [
      {
        default: initial,
        message: 'use ; to separe: ',
        name: 'dns',
        type: 'input'
      }
    ]

    inquirer.prompt(questions).then((options: any) => {
      resolve(options.dns)
    })
  })
}
