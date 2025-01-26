/**
 * ./src/lib/select_filesystem_type.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'
import yaml from 'js-yaml'
import fs from 'node:fs'

import Pacman from '../../classes/pacman.js'
import { IPartitions } from '../../interfaces/index.js'

export default async function selectFileSystemType(): Promise<string> {
  let partitions = {} as IPartitions
  if (fs.existsSync('/etc/calamares/modules/partition.conf')) {
    partitions = yaml.load(fs.readFileSync('/etc/calamares/modules/partition.conf', 'utf8')) as unknown as IPartitions
  } else {
    partitions.defaultFileSystemType = 'ext4'
  }

  const choices = ['ext4']
  if (Pacman.packageIsInstalled('btrfs-progs')) {
    choices.push('btrfs')
  }
  partitions.defaultFileSystemType = 'ext4'

  const questions: Array<Record<string, any>> = [
    {
      choices: choices,
      default: partitions.defaultFileSystemType,
      message: 'Select file system type',
      name: 'fileSystemChoices',
      type: 'list'
    }
  ]

  return new Promise((resolve) => {
    inquirer.prompt(questions).then((options: any) => {
      resolve(options.fileSystemChoices)
    })
  })
}

/*
"efiSystemPartition":"/boot/efi","userSwapChoices":        │
│Users       ["none","small","suspend","file"],"drawNestedPartiti        │
│Summary     ons":false,"alwaysShowPartitionLabels":true,"initial        │
│Install     PartitioningChoice":"none","initialSwapChoice":"smal        │
│Finish      l","defaultFileSystemType":"ext4"}
*/
