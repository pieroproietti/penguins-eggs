/**
 * penguins-eggs
 * selectKeyboardModel
 * author: Piero Proietti
 */
import inquirer from 'inquirer'
import Keyboards from '../classes/keyboards.js'
import {IXkbModel, IXkbLayout, IXkbVariant, IXkbOption} from '../interfaces/i-xkb-model.js'

/**
  *
  */
export default async function selectKeyboardModel(selected = ''): Promise<string> {
  const keyboards = new Keyboards()
  const models = keyboards.getModels() as IXkbModel []

  const supported : string [] = []
  for (const m of models) {
    supported.push(m.code)
  }

  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'model',
      message: 'Select model: ',
      choices: supported,
      default: selected,
    },
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options) {
      resolve(options.model)
    })
  })
}

