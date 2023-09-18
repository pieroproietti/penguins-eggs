/**
 * penguins-eggs
 * lib: select_keyboard_option.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
const inquirer = require('inquirer') 
import Keyboards from '../classes/keyboards'

/**
  * selectKeyboardOption
  */
export default async function selectKeyboardOption(selected = ''): Promise<string> {
  const keyboards = new Keyboards()
  const options = keyboards.getOptions()

  const supported : string [] = []
  for (const o of options) {
    supported.push(o.code)
  }

  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'option',
      message: 'Select option: ',
      choices: supported,
      default: selected,
    },
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options: any) {
      resolve(options.option)
    })
  })
}

