'use strict'
const inquirer = require('inquirer') 
import shx from 'shelljs'

export default async function selectInstallationDevice(): Promise<string> {
  const drives = shx.exec('lsblk |grep disk|cut -f 1 "-d "', {silent: true}).stdout.trim().split('\n')
  const driveList: string[] = []
  drives.forEach((element: string) => {
    driveList.push('/dev/' + element)
  })

  const questions: Array<Record<string, any>> = [
    // nvme0n1p1, nvme0n1p2, nvme0n1p3
    {
      type: 'list',
      name: 'installationDevice',
      message: 'Select the installation disk: ',
      choices: driveList,
    },
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options: any) {
      resolve(options.installationDevice)
    })
  })
}
