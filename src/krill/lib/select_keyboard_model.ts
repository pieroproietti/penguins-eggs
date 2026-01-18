import { select } from '@inquirer/prompts'

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

  const choices = supported.map((m) => ({ name: m, value: m }));

  const answer = await select({
    message: 'Select model: ',
    choices,
    default: selected,
  });

  return answer;
}
