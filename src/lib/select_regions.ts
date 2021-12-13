'use strict'
import inquirer = require('inquirer')

export default async function selectRegions(): Promise<string> {
  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'region',
      message: 'Select your region: ',
      choices: [
        'Atlantic',
        'Africa',
        'America',
        'Antarctica',
        'Artic',
        'Australia',
        'Europe',
        'India',
        'Europe',
        'Pacific',
      ],
      default: 'Europe',
    },
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options) {
      resolve(options.region)
    })
  })
}
