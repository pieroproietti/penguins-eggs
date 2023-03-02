/**
 * penguins-eggs
 * selectKeyboardOption
 * author: Piero Proietti
 */
import inquirer from 'inquirer'
import Keyboards from '../classes/keyboards.js'

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
    inquirer.prompt(questions).then(function (options) {
      resolve(options.option)
    })
  })
}

