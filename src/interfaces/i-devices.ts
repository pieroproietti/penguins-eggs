/**
 * penguins-eggs
 * interface: i-devices.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface IDevice {
  name: string
  fsType: string
  mountPoint: string
  cryptedFrom: string
}

export interface IDevices {
  efi: IDevice
  boot: IDevice
  root: IDevice
  data: IDevice
  swap: IDevice
}
