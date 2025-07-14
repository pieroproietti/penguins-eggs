/**
 * ./src/lib/select_languages.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

import Locales from '../../classes/locales.js'

export default async function selectLanguages(selectedLanguage = ''): Promise<string> {
  const locales = new Locales()
  const supported = await locales.getSupported()
  const selected = selectedLanguage

  const questions: any = [
    {
      choices: supported,
      default: selected,
      message: 'Select language: ',
      name: 'language',
      type: 'list'
    }
  ]

  return new Promise((resolve) => {
    inquirer.prompt(questions).then((options: any) => {
      resolve(options.language)
    })
  })
}
