/**
 * ./src/lib/installation_device.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'
import shx from 'shelljs'

export default async function selectInstallationDevice(): Promise<string> {
  const drives = shx.exec('lsblk |grep disk|cut -f 1 "-d "', { silent: true }).stdout.trim().split('\n')
  const raid_drives = shx.exec('lsblk -l | grep raid | cut -f 1 "-d "', { silent: true }).stdout.trim().split('\n')
  const driveList: string[] = []
  drives.forEach((element: string) => {
    driveList.push('/dev/' + element)
  })
  raid_drives.forEach((element: string) => {
    driveList.push('/dev/' + element)
  })

  const questions: Array<Record<string, any>> = [
    // nvme0n1p1, nvme0n1p2, nvme0n1p3
    {
      choices: driveList,
      message: 'Select the installation disk: ',
      name: 'installationDevice',
      type: 'list'
    }
  ]

  return new Promise((resolve) => {
    inquirer.prompt(questions).then((options: any) => {
      resolve(options.installationDevice)
    })
  })
}
