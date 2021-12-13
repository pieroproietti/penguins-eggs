'use strict'
import inquirer = require('inquirer')
import shx from 'shelljs'

export default async function selectInstallationMode(): Promise<string> {
  const modes = ['standard', 'full-encrypted']

  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'installationMode',
      message: 'Select the installation mode: ',
      choices: modes,
    },
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options) {
      resolve(options.installationMode)
    })
  })
}
