/**
 * penguins-eggs
 * lib: select_languages.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
const inquirer = require('inquirer') 
import shx from 'shelljs'
import Locales from '../classes/locales'

export default async function selectLanguages(selectedLanguage = ''): Promise<string> {
  const locales = new Locales()
  const supported = await locales.getSupported()
  const selected = selectedLanguage

  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'language',
      message: 'Select language: ',
      choices: supported,
      default: selected,
    },
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options: any) {
      resolve(options.language)
    })
  })
}
