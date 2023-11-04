/**
 * penguins-eggs
 * lib: select_keyboard_layout.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
const inquirer = require('inquirer') 
import Keyboards from '../classes/keyboards'

/**
  *
  */
export default async function selectKeyboardLayout(selected = ''): Promise<string> {
  const keyboards = new Keyboards()
  const layouts = keyboards.getLayouts()

  const supported : string [] = []
  for (const l of layouts) {
    supported.push(l.code)
  }
  // sord keyboard layouts
  supported.sort()

  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'layout',
      message: 'Select layout: ',
      choices: supported,
      default: selected,
    },
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options: any) {
      resolve(options.layout)
    })
  })
}

