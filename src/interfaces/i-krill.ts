/**
 * ./src/interfaces/i-krill.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

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
  userSwapChoice: string
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
