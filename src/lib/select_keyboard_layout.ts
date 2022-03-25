/**
 * penguins-eggs
 * selectKeyboardLayout
 * author: Piero Proietti
 */
import inquirer from 'inquirer'
import shx from 'shelljs'

/**
 * 
 */
export default async function selectKeyboardLayout(): Promise<string> {
  const choices = shx.exec('localectl list-x11-keymap-layouts').split('/n')
  const choice = shx.exec(`localectl |grep "X11 Layout"| cut -d ':' -f2`)
  
  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'layout',
      message: 'Select layout: ',
      choices: choices,
      default: choice
    }
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options) {
      resolve(options.layout)
    })
  })
}
