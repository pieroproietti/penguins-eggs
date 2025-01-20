/**
 * ./src/interfaces/i-krill-config.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { ILvmOptions } from "./i-krill.js"

export interface IKrillConfig {
  address: string
  addressType: string
  autologin: boolean
  dns: string
  domain: string
  filesystemType: string
  fullname: string
  gateway: string
  hostname: string
  iface: string
  installationDevice: string
  installationMode: string
  lvmOptions: ILvmOptions
  keyboardLayout: string
  keyboardModel: string
  keyboardOption: string
  keyboardVariant: string
  language: string
  name: string
  netmask: string
  password: string
  region: string
  rootPassword: string
  userSwapChoice: string
  zone: string
}
