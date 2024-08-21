/**
 * ./src/lib/get_gateway.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

export default async function getGateway(initial: string): Promise<string> {
  return new Promise((resolve) => {
    const questions: Array<Record<string, any>> = [
      {
        default: initial,
        message: 'What is gateway of this network? ',
        name: 'gateway',
        type: 'input'
      }
    ]

    inquirer.prompt(questions).then((options: any) => {
      resolve(options.gateway)
    })
  })
}
