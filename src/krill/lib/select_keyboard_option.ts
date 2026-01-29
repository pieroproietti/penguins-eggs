import { select } from '@inquirer/prompts'

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

  const choices = supported.map((o) => ({ name: o, value: o }));

  const answer = await select({
    message: 'Select option: ',
    choices,
    default: selected,
  });

  return answer;
}
