/**
 * penguins-eggs
 * lib: select_filesystem_type.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
'use strict'
const inquirer = require('inquirer') 
import shx from 'shelljs'
import yaml from 'js-yaml'
import fs from 'node:fs'
import {IPartitions} from '../interfaces/index'

export default async function selectFileSystemType(): Promise<string> {
  let partitions = {} as IPartitions
  if (fs.existsSync('/etc/calamares/modules/partition.conf')) {
    partitions = yaml.load(fs.readFileSync('/etc/calamares/modules/partition.conf', 'utf-8')) as unknown as IPartitions
  } else {
    partitions.defaultFileSystemType = 'ext4'
  }

  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'fileSystemChoices',
      message: 'Select file system tyèe',
      choices: ['btrfs', 'ext', 'ext2', 'ext3', 'ext4', 'ReiserFS', 'Reiser4', 'zfs'],
      default: partitions.defaultFileSystemType,
    },
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options: any) {
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
