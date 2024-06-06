/**
 * ./src/lib/get_dns.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */


import inquirer from 'inquirer'

export default async function getDns(initial: string): Promise<string> {
  return new Promise((resolve) => {
    const questions: Array<Record<string, any>> = [
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
