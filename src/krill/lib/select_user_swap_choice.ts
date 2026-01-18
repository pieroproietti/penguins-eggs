import { select } from '@inquirer/prompts'
import yaml from 'js-yaml'
import fs from 'node:fs'

import { IPartitions } from '../../interfaces/index.js'
import { SwapChoice } from '../classes/krill_enums.js'

export default async function selectUserSwapChoice(initialSwapChoice: SwapChoice = SwapChoice.Small): Promise<SwapChoice> {
  let partitions = {} as IPartitions
  if (fs.existsSync('/etc/calamares/modules/partition.conf')) {
    partitions = yaml.load(fs.readFileSync('/etc/calamares/modules/partition.conf', 'utf8')) as unknown as IPartitions
  } else {
    partitions.userSwapChoices = Object.values(SwapChoice)
    partitions.initialSwapChoice = initialSwapChoice
  }

  const choices = partitions.userSwapChoices.map((c) => ({ name: c, value: c }));

  const answer = await select({
    message: 'Select the swap choice',
    choices,
    default: partitions.initialSwapChoice,
  });

  return answer as SwapChoice;
}
