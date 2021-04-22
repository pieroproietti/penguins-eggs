/*
  penguins-eggs: Eggs.js
  author: Piero Proietti
  mail: piero.proietti@gmail.com
*/

export interface IDevice {
   name: string
   fsType: string
   mountPoint: string
}

export interface IDevices {
   efi: IDevice
   boot: IDevice
   root: IDevice
   data: IDevice
   swap: IDevice
}
