/**
 * ./src/lib/select_replaced_partition.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

import { shx } from '../../lib/utils.js'

export default async function selectReplacedPartition(): Promise<string> {
  const partitions = shx.exec('lsblk -l -o NAME,TYPE | grep part | cut -d" " -f1', { silent: true }).stdout.trim().split('\n')

  const partitionsList: string[] = []

  // Add partition to partitionsList
  partitions.forEach((element: string) => {
    partitionsList.push('/dev/' + element)
  })

  const questions: any = [
    // nvme0n1p1, nvme0n1p2, nvme0n1p3
    {
      choices: partitionsList,
      message: 'Select the installation partition: ',
      name: 'installationPartition',
      type: 'list'
    }
  ]

  return new Promise((resolve) => {
    inquirer.prompt(questions).then((options: any) => {
      resolve(options.installationPartition)
    })
  })
}
