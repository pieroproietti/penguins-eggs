/**
 * ./src/lib/get_hostname.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

'use strict'
import inquirer from 'inquirer'


export default async function getHostname(initial: string): Promise<string> {
  return new Promise((resolve) => {
    const questions: Array<Record<string, any>> = [
      {
        default: initial,
        message: 'Choose a name for this computer? ',
        name: 'hostname',
        type: 'input',
      },
    ]

    inquirer.prompt(questions).then((options: any) => {
      resolve(options.hostname)
    })
  })
}
