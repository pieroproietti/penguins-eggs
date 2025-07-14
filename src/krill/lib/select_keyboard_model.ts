/**
 * ./src/lib/select_keyboard_model.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

import Keyboards from '../../classes/keyboards.js'
import { IXkbLayout, IXkbModel, IXkbOption, IXkbVariant } from '../../interfaces/i-xkb-model.js'

/**
 *
 */
export default async function selectKeyboardModel(selected = ''): Promise<string> {
  const keyboards = new Keyboards()
  const models = keyboards.getModels() as IXkbModel[]

  const supported: string[] = []
  for (const m of models) {
    supported.push(m.code)
  }

  const questions: any = [
    {
      choices: supported,
      default: selected,
      message: 'Select model: ',
      name: 'model',
      type: 'list'
    }
  ]

  return new Promise((resolve) => {
    inquirer.prompt(questions).then((options: any) => {
      resolve(options.model)
    })
  })
}
