/**
 * less /usr/share/i18n/SUPPORTED
 */
import inquirer from 'inquirer'
import shx from 'shelljs'

export default async function selectLanguages(): Promise<string> {
  const start = shx.exec('cat /etc/default/locale |cut -f2 -d=| cut -f1 -d-', {silent: true})
  const languages = shx.exec('locale -a|cut -f1 -d.', {silent: true}).split('\n')

  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'language',
      message: 'Select language: ',
      choices: languages,
      default: start,
    },
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options) {
      resolve(options.language)
    })
  })
}
