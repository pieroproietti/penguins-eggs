/**
 * ./src/lib/select_keyboard_variant.ts
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
export default async function selectKeyboardVariant(keyboardLayout = ''): Promise<string> {
  const keyboards = new Keyboards()
  const variants = keyboards.getVariants(keyboardLayout)
  const supported: string[] = []
  supported.push('') // inserisce una variant nulla
  for (const v of variants) {
    supported.push(v.code)
  }

  const questions: any = [
    {
      choices: supported,
      default: '',
      message: 'Select variant: ',
      name: 'variant',
      type: 'list'
    }
  ]

  return new Promise((resolve) => {
    inquirer.prompt(questions).then((options: any) => {
      resolve(options.variant)
    })
  })
}
