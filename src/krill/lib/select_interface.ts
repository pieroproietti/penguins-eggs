/**
 * ./src/lib/select_interface.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

export default async function selectInterface(iface = 'eth0', ifaces: string[]): Promise<string> {
  const questions: any = [
    {
      choices: ifaces,
      default: iface,
      message: 'Select interface: ',
      name: 'option',
      type: 'list'
    }
  ]

  return new Promise((resolve) => {
    inquirer.prompt(questions).then((options: any) => {
      resolve(options.option)
    })
  })
}
