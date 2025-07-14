/**
 * ./src/lib/select_keyboard_option.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

import Keyboards from '../../classes/keyboards.js'

/**
 * selectKeyboardOption
 */
export default async function selectKeyboardOption(selected = ''): Promise<string> {
  const keyboards = new Keyboards()
  const options = keyboards.getOptions()

  const supported: string[] = []
  for (const o of options) {
    supported.push(o.code)
  }

  const questions: any = [
    {
      choices: supported,
      default: selected,
      message: 'Select option: ',
      name: 'option',
      type: 'list'
    }
  ]

  return new Promise((resolve) => {
    inquirer.prompt(questions).then((options: any) => {
      resolve(options.option)
    })
  })
}
