/**
 * ./src/interfaces/i-devices.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export interface IDevice {
  cryptedFrom: string
  fsType: string
  mountPoint: string
  name: string
}

export interface IDevices {
  boot: IDevice
  data: IDevice
  efi: IDevice
  root: IDevice
  swap: IDevice
}
