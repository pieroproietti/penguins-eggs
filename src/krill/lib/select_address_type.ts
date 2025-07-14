/**
 * ./src/lib/select_address_type.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

export default async function selectAddressType(): Promise<string> {
  const questions: any = [
    {
      choices: ['dhcp', 'static'],
      default: 'dhcp',
      message: 'Select address type: ',
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
