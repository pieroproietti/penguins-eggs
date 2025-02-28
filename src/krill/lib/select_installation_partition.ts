/**
 * ./src/lib/select_installation_partition.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'
import shx from 'shelljs'

export default async function selectInstallationPartition(): Promise<string> {
  const partitions = shx.exec('lsblk -l -o NAME,TYPE | grep part | cut -d" " -f1', { silent: true }).stdout.trim().split('\n');

  let partitionsList: string[] = [];

  // Add partition to partitionsList
  partitions.forEach((element: string) => {
    partitionsList.push("/dev/" + element)
  })

  const questions: Array<Record<string, any>> = [
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
