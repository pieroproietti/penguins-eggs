/**
 * less /usr/share/i18n/SUPPORTED
 */
import inquirer from 'inquirer'
import shx from 'shelljs'
import Locales from '../classes/locales'

export default async function selectLanguages(selected: string): Promise<string> {
  const locales = new Locales()
  const supported = await locales.getSupported()
                           
  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'language',
      message: 'Select language: ',
      choices: supported,
      default: selected
    }
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options) {
      resolve(options.language)
    })
  })
}
