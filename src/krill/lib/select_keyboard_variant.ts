import { select } from '@inquirer/prompts'

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

  const choices = supported.map((v) => ({ name: v, value: v }));

  const answer = await select({
    message: 'Select variant: ',
    choices,
    default: '',
  });

  return answer;
}
