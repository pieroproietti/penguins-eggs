/**
 * ./src/interfaces/i-krill.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { SwapChoice } from '../classes/krill_enums.js'

export interface IWelcome {
  language: string
}

export interface ILocation {
  language: string
  region: string
  zone: string
}

export interface IKeyboard {
  keyboardLayout: string
  keyboardModel: string
  keyboardOption: string
  keyboardVariant: string
}

export interface IPartitions {
  filesystemType: string
  installationDevice: string
  installationMode: string
  userSwapChoice: SwapChoice
  replacedPartition: string
}


export interface IUsers {
  autologin: boolean
  fullname: string
  hostname: string
  password: string
  rootPassword: string
  username: string
}

export interface ICalamaresModule {
  command: string
  interface: string
  name: string
  timeout: number
  type: string
}

