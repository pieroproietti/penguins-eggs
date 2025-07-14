/**
 * ./src/interfaces/i-krill-config.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { SwapChoice } from '../classes/krill_enums.js'

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
  replacedPartition: string
  installationMode: string
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
  userSwapChoice: SwapChoice
  zone: string
}
