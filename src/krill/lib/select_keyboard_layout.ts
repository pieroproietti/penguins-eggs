import { select } from '@inquirer/prompts'

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

  const choices = supported.map((l) => ({ name: l, value: l }));

  const answer = await select({
    message: 'Select layout: ',
    choices,
    default: selected,
  });

  return answer;
}
