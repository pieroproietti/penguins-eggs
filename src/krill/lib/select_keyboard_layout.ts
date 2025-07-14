/**
 * ./src/lib/select_keyboard_layout.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

import Keyboards from '../../classes/keyboards.js'

/**
 *
 */
export default async function selectKeyboardLayout(selected = ''): Promise<string> {
  const keyboards = new Keyboards()
  const layouts = keyboards.getLayouts()

  const supported: string[] = []
  for (const l of layouts) {
    supported.push(l.code)
  }

  // sord keyboard layouts
  supported.sort()

  const questions: any = [
    {
      choices: supported,
      default: selected,
      message: 'Select layout: ',
      name: 'layout',
      type: 'list'
    }
  ]

  return new Promise((resolve) => {
    inquirer.prompt(questions).then((options: any) => {
      resolve(options.layout)
    })
  })
}
