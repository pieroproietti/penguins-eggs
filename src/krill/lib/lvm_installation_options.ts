/**
 * ./src/lib/select_installation_lvm_vgname.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

import { LvmPartitionPreset } from '../classes/krill-enums.js'

export async function selectLvmPreset(initial: LvmPartitionPreset): Promise<LvmPartitionPreset> {
  const modes = Object.values(LvmPartitionPreset)

  const questions: Array<Record<string, any>> = [
    {
      default: initial,
      choices: modes,
      message: 'Select the LVM partition preset: ',
      name: 'lvmpreset',
      type: 'list'
    }
  ]

  return new Promise((resolve) => {
    inquirer.prompt(questions).then((options: any) => {
      resolve(options.lvmpreset)
    })
  })
}

export async function getLvmVGName(initial: string): Promise<string> {
  return new Promise((resolve) => {
    const questions: Array<Record<string, any>> = [
      {
        default: initial,
        message: 'What name do you want to assign to the volume group? ',
        name: 'vgname',
        type: 'input'
      }
    ]

    inquirer.prompt(questions).then((options: any) => {
      resolve(options.vgname)
    })
  })
}

export async function getLvmLVRootName(initial: string): Promise<string> {
  return new Promise((resolve) => {
    const questions: Array<Record<string, any>> = [
      {
        default: initial,
        message: 'What name do you want to assign to the root logical volume? ',
        name: 'lvrootname',
        type: 'input'
      }
    ]

    inquirer.prompt(questions).then((options: any) => {
      resolve(options.lvrootname)
    })
  })
}

export async function getLvmLVRootSize(initial: string): Promise<string> {
  return new Promise((resolve) => {
    const questions: Array<Record<string, any>> = [
      {
        default: initial,
        message: 'How large should the root logical volume be? ',
        name: 'lvrootsize',
        type: 'input'
      }
    ]

    inquirer.prompt(questions).then((options: any) => {
      resolve(options.lvrootsize)
    })
  })
}

export async function getLvmLVDataName(initial: string): Promise<string> {
  return new Promise((resolve) => {
    const questions: Array<Record<string, any>> = [
      {
        default: initial,
        message: 'What name do you want to assign to the data logical volume? ',
        name: 'lvdataname',
        type: 'input'
      }
    ]

    inquirer.prompt(questions).then((options: any) => {
      resolve(options.lvdataname)
    })
  })
}

export async function getLvmLVDataMountPoint(initial: string): Promise<string> {
  return new Promise((resolve) => {
    const questions: Array<Record<string, any>> = [
      {
        default: initial,
        message: 'Where you want to mount the data logical volume? ',
        name: 'lvdatamountpoint',
        type: 'input'
      }
    ]

    inquirer.prompt(questions).then((options: any) => {
      resolve(options.lvdatamountpoint)
    })
  })
}
