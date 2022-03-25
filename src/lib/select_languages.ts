/**
 * less /usr/share/i18n/SUPPORTED
 */
import inquirer from 'inquirer'
import shx from 'shelljs'

export default async function selectLanguages(choice: string): Promise<string> {
  const choices = shx.exec('cut -f1 -d. </usr/share/i18n/SUPPORTED', { silent: true }).split('\n')
  // const choice = shx.exec('cat /etc/default/locale|grep LANG|cut -f2 -d=', { silent: true })
                           
  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'language',
      message: 'Select language: ',
      choices: choices,
      default: choice
    }
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options) {
      resolve(options.language)
    })
  })
}
