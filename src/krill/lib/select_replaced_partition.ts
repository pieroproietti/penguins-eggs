import { select } from '@inquirer/prompts'

import { shx } from '../../lib/utils.js'

export default async function selectReplacedPartition(): Promise<string> {
  const partitions = shx.exec('lsblk -l -o NAME,TYPE | grep part | cut -d" " -f1', { silent: true }).stdout.trim().split('\n')

  const partitionsList: { name: string, value: string }[] = []

  // Add partition to partitionsList
  partitions.forEach((element: string) => {
    partitionsList.push({ name: '/dev/' + element, value: '/dev/' + element })
  })

  const answer = await select({
    message: 'Select the installation partition: ',
    choices: partitionsList,
  });

  return answer;
}
