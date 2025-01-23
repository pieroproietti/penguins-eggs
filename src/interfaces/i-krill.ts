/**
 * ./src/interfaces/i-krill.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { SwapChoice } from '../enum/e-krill.js'

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
  lvmOptions: ILvmOptions
  installationMode: string
  userSwapChoice: SwapChoice
}

export interface IUsers {
  autologin: boolean
  fullname: string
  hostname: string
  password: string
  rootPassword: string
  username: string
}

// interface solo per hatching
export interface ICalamaresModule {
  command: string
  interface: string
  name: string
  timeout: number
  type: string
}

export interface ILvmOptions {
  vgName: string
  lvRootName: string
  lvRootFSType: string
  lvRootSize: string
  lvDataName: string
  lvDataFSType: string
  lvDataMountPoint: string
}
