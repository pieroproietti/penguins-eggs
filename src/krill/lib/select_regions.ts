/**
 * ./src/lib/
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

export default async function selectRegions(selected = ''): Promise<string> {
  const questions: any = [
    {
      choices: ['Atlantic', 'Africa', 'America', 'Antarctica', 'Artic', 'Australia', 'Europe', 'India', 'Europe', 'Pacific'],
      default: selected,
      message: 'Select your region: ',
      name: 'region',
      type: 'list'
    }
  ]

  return new Promise((resolve) => {
    inquirer.prompt(questions).then((options: any) => {
      resolve(options.region)
    })
  })
}
