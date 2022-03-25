/**
 * penguins-eggs
 * selectKeyboardLayout
 * author: Piero Proietti
 */
import inquirer from 'inquirer'
import shx from 'shelljs'
import Keyboards from '../classes/keyboard'


/**
 * 
 */
export default async function selectKeyboardLayout(): Promise<string> {
  const keyboards = new Keyboards()
  const layouts = keyboards.getLayouts()
  const selected = keyboards.getLayout()
  
  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'layout',
      message: 'Select layout: ',
      choices: layouts,
      default: selected
    }
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options) {
      resolve(options.layout)
    })
  })
}
